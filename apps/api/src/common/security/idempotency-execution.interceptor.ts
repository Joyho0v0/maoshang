import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { catchError, firstValueFrom, from, map, throwError, type Observable } from 'rxjs';
import { canonicalRequestHash } from './canonical-request.js';
import { EXPECTED_OPERATION_MANIFEST } from '../../../../../packages/contracts/openapi/contract-manifest.js';
import { operations, type OperationId } from '../../../../../packages/contracts/openapi/generated-client.js';
import { CommandFailureError, IdempotencyConflictError, type CommandResult, type CommandStatus } from '../../modules/integration/idempotency/in-memory-idempotency-store.js';
import type { PostgresIdempotencyInput, PostgresIdempotencyRepository } from '../../modules/integration/idempotency/postgres-idempotency-repository.js';
import { buildProblem, normalizeRequestId, ProblemError } from '../http/problem.js';

interface PrincipalRequest extends FastifyRequest {
  user?: { id: string; organizationId: string };
}

@Injectable()
export class IdempotencyExecutionInterceptor implements NestInterceptor {
  constructor(private readonly repository: PostgresIdempotencyRepository) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<PrincipalRequest>();
    const response = context.switchToHttp().getResponse<FastifyReply>();
    const match = operationForRequest(request);
    const principal = request.user;
    const idempotencyKey = headerString(request.headers['idempotency-key']);
    if (match === undefined || !match.definition.idempotency || principal === undefined || idempotencyKey === undefined) return next.handle();

    const input: PostgresIdempotencyInput = {
      actorId: principal.id,
      organizationId: principal.organizationId,
      operationId: match.definition.operationId,
      idempotencyKey,
      requestHash: canonicalRequestHash({
        method: request.method,
        path: request.url.split('?')[0] ?? request.url,
        query: asCanonicalQuery(request.query),
        body: request.body,
        ...(headerString(request.headers['if-match']) === undefined ? {} : { ifMatch: headerString(request.headers['if-match']) as string }),
      }),
    };

    return from(this.repository.execute(input, async () => {
      const body = await firstValueFrom(next.handle());
      const contentLocation = headerString(response.getHeader('content-location'));
      const result: CommandResult<unknown> = {
        status: response.statusCode ?? 200,
        body,
        ...(contentLocation === undefined ? {} : { resultHref: contentLocation }),
      };
      return result;
    })).pipe(map((outcome) => {
      if (isCommandStatus(outcome)) {
        response.statusCode = 202;
        response.header('cache-control', 'no-store');
        response.header('content-location', '/api/v1/commands/status');
        response.header('retry-after', String(Math.max(1, Math.ceil(outcome.retryAfterMs / 1000))));
        return outcome;
      }
      response.statusCode = outcome.status;
      return outcome.body;
    }), catchError((error: unknown) => {
      if (error instanceof IdempotencyConflictError) {
        return throwError(() => new ProblemError(buildProblem({
          status: 409,
          code: 'IDEMPOTENCY_KEY_REUSED',
          title: 'Idempotency key was reused with a different request.',
          requestId: normalizeRequestId(request.headers['x-request-id']),
          retryable: false,
          meta: { operationId: match.definition.operationId, commandStatusHref: '/api/v1/commands/status' },
        })));
      }
      if (error instanceof CommandFailureError) return throwError(() => new ProblemError(error.problem));
      return throwError(() => error);
    }));
  }
}

function operationForRequest(request: FastifyRequest): { definition: (typeof EXPECTED_OPERATION_MANIFEST)[number]; operation: (typeof operations)[OperationId] } | undefined {
  const path = (request.routeOptions.url ?? request.url.split('?')[0] ?? '').replace(/^\/api\/v1/, '').replace(/:([A-Za-z][A-Za-z0-9_]*)/g, '{$1}');
  const method = request.method.toUpperCase();
  const definition = EXPECTED_OPERATION_MANIFEST.find((candidate) => candidate.method === method.toLowerCase() && candidate.path === path);
  if (definition === undefined) return undefined;
  const operation = operations[definition.operationId as OperationId];
  return operation === undefined ? undefined : { definition, operation };
}

function isCommandStatus(value: CommandResult<unknown> | CommandStatus): value is CommandStatus {
  return typeof value === 'object' && value !== null && 'state' in value && 'commandId' in value;
}

function headerString(value: string | string[] | number | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : typeof value === 'number' ? String(value) : value;
}

function asCanonicalQuery(value: unknown): Record<string, string | string[] | undefined> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, Array.isArray(item) ? item.map(String) : typeof item === 'string' ? item : item === undefined ? undefined : String(item)]));
}
