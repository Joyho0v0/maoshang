import { CallHandler, ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Observable, map } from 'rxjs';
import { buildProblem, normalizeRequestId, ProblemError } from './problem.js';
import type { ContractValidator } from '../../../../../packages/contracts/openapi/runtime-validator.js';
import { operations, type OperationId } from '../../../../../packages/contracts/openapi/generated-client.js';
import type { GeneratedOperation } from '../../../../../packages/contracts/openapi/client.js';
import type { RuntimeValidator as V2RuntimeValidator } from '../../../../../packages/contracts/openapi/v2/runtime-validator.js';
import { isV2Request, validateV2Response, v2OperationForRequest } from '../../modules/v2/v2-contract.js';

@Injectable()
export class ContractResponseValidationInterceptor implements NestInterceptor {
  constructor(private readonly validator: ContractValidator, private readonly v2Validator?: V2RuntimeValidator) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    if (isV2Request(request)) return this.interceptV2(context, next, request);
    const operation = operationForRequest(request);
    if (operation === undefined) return next.handle();
    const response = context.switchToHttp().getResponse<FastifyReply>();
    if (response.getHeader('X-Request-ID') === undefined && typeof response.header === 'function') response.header('X-Request-ID', normalizeRequestId(request.headers['x-request-id']));
    return next.handle().pipe(map((value: unknown) => {
      const status = String(response.statusCode ?? 200);
      ensureContractResponseContentType(operation as GeneratedOperation, Number(status), response);
      validateContractResponse(operation as GeneratedOperation, Number(status), value, response, this.validator, normalizeRequestId(request.headers['x-request-id']));
      return value;
    }));
  }

  private interceptV2(context: ExecutionContext, next: CallHandler, request: FastifyRequest): Observable<unknown> {
    const operation = v2OperationForRequest(request);
    if (operation === undefined || this.v2Validator === undefined) return next.handle();
    const response = context.switchToHttp().getResponse<FastifyReply>();
    if (response.getHeader('X-Request-ID') === undefined && typeof response.header === 'function') response.header('X-Request-ID', normalizeRequestId(request.headers['x-request-id']));
    return next.handle().pipe(map((value: unknown) => {
      const status = Number(response.statusCode ?? 200);
      const responseContract = operation.responses[String(status)] as { readonly contentType?: string } | undefined;
      const contentType = response.getHeader('content-type');
      if ((contentType === undefined || contentType === null || contentType === '') && responseContract?.contentType !== undefined) response.header('content-type', responseContract.contentType);
      validateV2Response(operation, status, value, { get: (name: string) => headerValue(response.getHeader(name)) }, this.v2Validator as V2RuntimeValidator);
      return value;
    }));
  }
}

export function ensureContractResponseContentType(operation: GeneratedOperation, status: number, response: Pick<FastifyReply, 'getHeader' | 'header'>): void {
  const responseContract = operation.responses[String(status)];
  if (responseContract?.contentType === undefined) return;
  const actual = response.getHeader('content-type');
  if ((actual === undefined || actual === null || actual === '') && typeof response.header === 'function') response.header('content-type', responseContract.contentType);
}

export function validateContractResponse(
  operation: GeneratedOperation,
  status: number,
  value: unknown,
  response: Pick<FastifyReply, 'getHeader'>,
  validator: ContractValidator,
  requestId: string,
): void {
  const responseContract = operation.responses[String(status)];
  if (responseContract === undefined) throw contractProblem('Response status is absent from the contract.', requestId);
  const contentType = String(response.getHeader('content-type') ?? '').split(';', 1)[0];
  if (responseContract.contentType !== undefined) {
    if (contentType !== responseContract.contentType) throw contractProblem('Response content type contract validation failed', requestId);
  } else if (responseContract.schema === undefined && contentType !== '') {
    throw contractProblem('Bodyless response has an unexpected content type', requestId);
  }
  for (const [headerName, headerContract] of Object.entries(responseContract.headers)) {
    const rawValue = response.getHeader(headerName);
    const headerValue = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (headerValue === undefined || headerValue === null) {
      if (!headerContract.required) continue;
      throw contractProblem('Response header contract validation failed', requestId);
    }
    if (headerContract.schema !== undefined && (typeof headerValue !== 'string' || !validateHeader(headerContract.schema, headerValue, validator))) {
      throw contractProblem('Response header value contract validation failed', requestId);
    }
  }
  if (responseContract.schema === undefined) {
    if (value === undefined || value === null) return;
    throw contractProblem('Bodyless response contains a response body', requestId);
  }
  if (!validator.validate(responseContract.schema, value)) throw contractProblem('Response contract validation failed', requestId);
}

function validateHeader(schema: string | Readonly<Record<string, unknown>>, value: string, validator: ContractValidator): boolean {
  return typeof schema === 'string' ? validator.validate(schema, value) : validator.validateSchema(schema, value);
}

function contractProblem(title: string, requestId: string): ProblemError {
  return new ProblemError(buildProblem({ status: 500, code: 'INTERNAL_ERROR', title, requestId, retryable: false }));
}

function operationForRequest(request: FastifyRequest): GeneratedOperation | undefined {
  const path = (request.routeOptions.url ?? request.url.split('?')[0] ?? '').replace(/^\/api\/v1/, '').replace(/:([A-Za-z][A-Za-z0-9_]*)/g, '{$1}');
  const method = request.method.toUpperCase();
  return Object.values(operations).find((candidate) => candidate.method === method && candidate.path === path) as (typeof operations)[OperationId] | undefined;
}

function headerValue(value: string | string[] | number | undefined): string | null {
  if (value === undefined) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return String(value);
}
