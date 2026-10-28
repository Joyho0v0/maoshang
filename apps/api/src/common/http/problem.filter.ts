import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { buildProblem, normalizeRequestId, ProblemError, type ProblemViolation } from './problem.js';
import type { ContractValidator } from '../../../../../packages/contracts/openapi/runtime-validator.js';
import { operations, type OperationId } from '../../../../../packages/contracts/openapi/generated-client.js';
import type { GeneratedOperation, OperationResponseContract } from '../../../../../packages/contracts/openapi/client.js';

@Catch()
export class ProblemExceptionFilter implements ExceptionFilter<unknown> {
  constructor(private readonly validator?: ContractValidator) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<FastifyRequest>();
    const response = context.getResponse<FastifyReply>();
    const requestId = normalizeRequestId(request.headers['x-request-id']);
    const candidate = exception instanceof ProblemError
      ? exception.problem
      : toProblem(exception, requestId);
    response.header('X-Request-ID', candidate.requestId).header('Cache-Control', 'no-store').type('application/problem+json');
    const operation = operationForRequest(request);
    const problem = this.validator === undefined || operation === undefined
      ? this.validator?.validate('Problem', candidate) === false
        ? internalProblem(requestId)
        : candidate
      : isDeclaredProblem(operation, candidate, response, this.validator)
        ? candidate
        : internalProblem(requestId);
    response.header('X-Request-ID', problem.requestId).status(problem.status).send(problem);
  }
}

function isDeclaredProblem(operation: GeneratedOperation, candidate: ReturnType<typeof buildProblem>, response: FastifyReply, validator: ContractValidator): boolean {
  const responseContract = operation.responses[String(candidate.status)];
  if (responseContract === undefined || responseContract.contentType !== 'application/problem+json' || responseContract.schema === undefined) return false;
  if (!validator.validate(responseContract.schema, candidate)) return false;
  return responseHeadersMatch(responseContract, response, validator);
}

function responseHeadersMatch(contract: OperationResponseContract, response: FastifyReply, validator: ContractValidator): boolean {
  for (const [name, header] of Object.entries(contract.headers)) {
    const rawValue = response.getHeader(name);
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (value === undefined || value === null) {
      if (header.required) return false;
      continue;
    }
    if (header.schema !== undefined && (typeof value !== 'string' || (typeof header.schema === 'string' ? !validator.validate(header.schema, value) : !validator.validateSchema(header.schema, value)))) return false;
  }
  return true;
}

function internalProblem(requestId: string) {
  return buildProblem({ status: 500, code: 'INTERNAL_ERROR', title: 'Internal server error', requestId, retryable: false });
}

function operationForRequest(request: FastifyRequest): GeneratedOperation | undefined {
  const path = (request.routeOptions.url ?? request.url.split('?')[0] ?? '').replace(/^\/api\/v1/, '').replace(/:([A-Za-z][A-Za-z0-9_]*)/g, '{$1}');
  const method = request.method.toUpperCase();
  return Object.values(operations).find((candidate) => candidate.method === method && candidate.path === path) as (typeof operations)[OperationId] | undefined;
}

function toProblem(exception: unknown, requestId: string) {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const response = exception.getResponse();
    const violations = status === 400 ? validationViolations(response) ?? [{ field: 'request', code: 'INVALID', message: 'Request validation failed.' }] : undefined;
    return buildProblem({
      status,
      code: statusCode(status),
      title: status >= 500 ? 'Internal server error' : statusTitle(status),
      requestId,
      retryable: status >= 500 || status === 429,
      ...(violations === undefined ? {} : { violations, meta: { violations } }),
    });
  }
  return buildProblem({ status: 500, code: 'INTERNAL_ERROR', title: 'Internal server error', requestId, retryable: false });
}

function validationViolations(value: unknown): ProblemViolation[] | undefined {
  if (!isRecord(value) || !Array.isArray(value.message)) return undefined;
  return value.message.filter((item): item is string => typeof item === 'string').map((message) => ({ field: 'request', code: 'INVALID', message }));
}

function statusCode(status: number): string {
  if (status === 400 || status === 422) return 'VALIDATION_FAILED';
  if (status === 401) return 'AUTHENTICATION_REQUIRED';
  if (status === 403) return 'PERMISSION_DENIED';
  if (status === 404) return 'RESOURCE_NOT_FOUND';
  if (status === 409) return 'STATE_CONFLICT';
  if (status === 428) return 'PRECONDITION_REQUIRED';
  if (status === 429) return 'RATE_LIMITED';
  if (status === 413) return 'FILE_TOO_LARGE';
  if (status === 415) return 'UNSUPPORTED_MEDIA_TYPE';
  if (status === 502) return 'DEPENDENCY_FAILURE';
  if (status === 503) return 'DEPENDENCY_UNAVAILABLE';
  return 'INTERNAL_ERROR';
}

function statusTitle(status: number): string {
  if (status === 400 || status === 422) return 'Validation failed';
  if (status === 401) return 'Authentication required';
  if (status === 403) return 'Permission denied';
  if (status === 404) return 'Resource not found';
  if (status === 409) return 'State conflict';
  if (status === 428) return 'Precondition required';
  if (status === 429) return 'Rate limited';
  return 'Internal server error';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
