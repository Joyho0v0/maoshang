import { CallHandler, ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { Observable, map } from 'rxjs';
import { buildProblem, normalizeRequestId, ProblemError } from './problem.js';
import type { ContractValidator } from '../../../../../packages/contracts/openapi/runtime-validator.js';

@Injectable()
export class ContractResponseValidationInterceptor implements NestInterceptor {
  constructor(private readonly validator: ContractValidator) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const schemaName = responseSchema(request);
    if (schemaName === undefined) return next.handle();
    return next.handle().pipe(map((value: unknown) => {
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

function responseSchema(request: FastifyRequest): string | undefined {
  const path = request.routeOptions.url ?? request.url.split('?')[0] ?? '';
  if (path.endsWith('/auth/csrf')) return 'CsrfToken';
  if (path.endsWith('/commands/status')) return 'CommandStatus';
  return undefined;
}
