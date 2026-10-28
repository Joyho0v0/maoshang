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
      const schemaName = (operation as GeneratedOperation).responses[status]?.schema;
      if (schemaName === undefined) {
        if (value === undefined) return value;
        throw new ProblemError(buildProblem({
          status: 500,
          code: 'INTERNAL_ERROR',
          title: 'Response status is absent from the contract.',
          requestId: normalizeRequestId(request.headers['x-request-id']),
          retryable: false,
        }));
      }
      const responseContract = (operation as GeneratedOperation).responses[status];
      for (const header of responseContract?.requiredHeaders ?? []) {
        if (response.getHeader(header) === undefined) {
          throw new ProblemError(buildProblem({
            status: 500,
            code: 'INTERNAL_ERROR',
            title: 'Response header contract validation failed',
            requestId: normalizeRequestId(request.headers['x-request-id']),
            retryable: false,
          }));
        }
      }
      if (this.validator.validate(schemaName, value)) return value;
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

function operationForRequest(request: FastifyRequest): GeneratedOperation | undefined {
  const path = (request.routeOptions.url ?? request.url.split('?')[0] ?? '').replace(/^\/api\/v1/, '').replace(/:([A-Za-z][A-Za-z0-9_]*)/g, '{$1}');
  const method = request.method.toUpperCase();
  return Object.values(operations).find((candidate) => candidate.method === method && candidate.path === path) as (typeof operations)[OperationId] | undefined;
}
