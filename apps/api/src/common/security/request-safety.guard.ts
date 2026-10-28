import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { canonicalRequestHash } from './canonical-request.js';
import { RequestSafetyPipeline } from './request-safety-pipeline.js';
import { CsrfService } from '../../modules/auth/csrf/csrf.service.js';
import { InMemoryIdempotencyStore } from '../../modules/integration/idempotency/in-memory-idempotency-store.js';
import { EXPECTED_OPERATION_MANIFEST } from '../../../../../packages/contracts/openapi/contract-manifest.js';
import { buildProblem, normalizeRequestId, ProblemError } from '../http/problem.js';

interface PrincipalRequest extends FastifyRequest {
  user?: { id: string; organizationId: string };
}

@Injectable()
export class RequestSafetyGuard implements CanActivate {
  constructor(@Inject(CsrfService) private readonly csrf: CsrfService, @Inject(InMemoryIdempotencyStore) private readonly idempotency: InMemoryIdempotencyStore) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<PrincipalRequest>();
    const method = request.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return true;

    const path = request.url.split('?')[0]?.replace(/^\/api\/v1/, '') ?? request.url;
    const contractPath = (request.routeOptions.url ?? path).replace(/^\/api\/v1/, '').replace(/:([A-Za-z][A-Za-z0-9_]*)/g, '{$1}');
    const operation = EXPECTED_OPERATION_MANIFEST.find((candidate) => candidate.method === method.toLowerCase() && candidate.path === contractPath);
    if (operation === undefined) {
      throw new ProblemError(buildProblem({ status: 500, code: 'INTERNAL_ERROR', title: 'Unsafe route is absent from the contract.', requestId: normalizeRequestId(request.headers['x-request-id']), retryable: false }));
    }
    const anonymousSessionBootstrap = operation.operationId === 'createSession';
    const principal = request.user;
    const sessionId = request.cookies?.session_id;
    const operationId = operation.operationId;
    const idempotencyKey = headerString(request.headers['idempotency-key']);
    const ifMatch = headerString(request.headers['if-match']);
    const csrfToken = headerString(request.headers['x-csrf-token']);
    const requestBody = request.body ?? null;

    const pipeline = new RequestSafetyPipeline({
      claim: (key, safetyRequest) => {
        if (principal === undefined) return;
        this.idempotency.claim({
          actorId: principal.id,
          organizationId: principal.organizationId,
          operationId: safetyRequest.operationId,
          idempotencyKey: key,
          requestHash: canonicalRequestHash({ method, path, body: requestBody, ...(ifMatch === undefined ? {} : { ifMatch }) }),
        });
      },
    });
    pipeline.validate({
      method: method as 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      operationId,
      authenticated: principal !== undefined,
      allowAnonymous: anonymousSessionBootstrap,
      ...(csrfToken === undefined ? {} : { csrfToken }),
      ...(sessionId === undefined || this.csrf.currentToken(`session:${sessionId}`) === undefined ? {} : { expectedCsrfToken: this.csrf.currentToken(`session:${sessionId}`) as string }),
      ...(idempotencyKey === undefined ? {} : { idempotencyKey }),
      ...(ifMatch === undefined ? {} : { ifMatch }),
      requiresIfMatch: operation.ifMatch,
      requiresIdempotencyKey: operation.idempotency,
      body: requestBody,
    });
    return true;
  }
}

function headerString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
