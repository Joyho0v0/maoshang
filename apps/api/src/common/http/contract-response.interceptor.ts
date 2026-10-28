import { CallHandler, ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Observable, map } from 'rxjs';
import { buildProblem, normalizeRequestId, ProblemError } from './problem.js';
import type { ContractValidator } from '../../../../../packages/contracts/openapi/runtime-validator.js';
import { operations, type OperationId } from '../../../../../packages/contracts/openapi/generated-client.js';
import type { GeneratedOperation } from '../../../../../packages/contracts/openapi/client.js';

@Injectable()
export class ContractResponseValidationInterceptor implements NestInterceptor {
  constructor(private readonly validator: ContractValidator) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const operation = operationForRequest(request);
    if (operation === undefined) return next.handle();
    const response = context.switchToHttp().getResponse<FastifyReply>();
    return next.handle().pipe(map((value: unknown) => {
      const status = String(response.statusCode ?? 200);
      const responseContract = (operation as GeneratedOperation).responses[status];
      if (responseContract === undefined) {
        throw new ProblemError(buildProblem({
          status: 500,
          code: 'INTERNAL_ERROR',
          title: 'Response status is absent from the contract.',
          requestId: normalizeRequestId(request.headers['x-request-id']),
          retryable: false,
        }));
      }
      const contentType = String(response.getHeader('content-type') ?? '').split(';', 1)[0];
      if (responseContract.contentType !== undefined) {
        if (contentType !== responseContract.contentType) {
          throw new ProblemError(buildProblem({
            status: 500,
            code: 'INTERNAL_ERROR',
            title: 'Response content type contract validation failed',
            requestId: normalizeRequestId(request.headers['x-request-id']),
            retryable: false,
          }));
        }
      } else if (responseContract.schema === undefined && contentType !== '') {
        throw new ProblemError(buildProblem({
          status: 500,
          code: 'INTERNAL_ERROR',
          title: 'Bodyless response has an unexpected content type',
          requestId: normalizeRequestId(request.headers['x-request-id']),
          retryable: false,
        }));
      }
      for (const [headerName, headerContract] of Object.entries(responseContract.headers)) {
        const rawValue = response.getHeader(headerName);
        const headerValue = Array.isArray(rawValue) ? rawValue[0] : rawValue;
        if (headerValue === undefined || headerValue === null) {
          if (!headerContract.required) continue;
          throw new ProblemError(buildProblem({
            status: 500,
            code: 'INTERNAL_ERROR',
            title: 'Response header contract validation failed',
            requestId: normalizeRequestId(request.headers['x-request-id']),
            retryable: false,
          }));
        }
        if (headerContract.schema !== undefined && (typeof headerValue !== 'string' || !validateHeader(headerContract.schema, headerValue, this.validator))) {
          throw new ProblemError(buildProblem({
            status: 500,
            code: 'INTERNAL_ERROR',
            title: 'Response header value contract validation failed',
            requestId: normalizeRequestId(request.headers['x-request-id']),
            retryable: false,
          }));
        }
      }
      if (responseContract.schema === undefined) {
        if (value === undefined || value === null) return value;
        throw new ProblemError(buildProblem({
          status: 500,
          code: 'INTERNAL_ERROR',
          title: 'Bodyless response contains a response body',
          requestId: normalizeRequestId(request.headers['x-request-id']),
          retryable: false,
        }));
      }
      if (this.validator.validate(responseContract.schema, value)) return value;
      throw new ProblemError(buildProblem({
        status: 500,
        code: 'INTERNAL_ERROR',
        title: 'Response contract validation failed',
        requestId: normalizeRequestId(request.headers['x-request-id']),
        retryable: false,
      }));
    }));
  }
}

function validateHeader(schema: string | Readonly<Record<string, unknown>>, value: string, validator: ContractValidator): boolean {
  return typeof schema === 'string' ? validator.validate(schema, value) : validator.validateSchema(schema, value);
}

function operationForRequest(request: FastifyRequest): GeneratedOperation | undefined {
  const path = (request.routeOptions.url ?? request.url.split('?')[0] ?? '').replace(/^\/api\/v1/, '').replace(/:([A-Za-z][A-Za-z0-9_]*)/g, '{$1}');
  const method = request.method.toUpperCase();
  return Object.values(operations).find((candidate) => candidate.method === method && candidate.path === path) as (typeof operations)[OperationId] | undefined;
}
