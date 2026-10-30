import { CanActivate, ExecutionContext, Inject, Injectable, Optional } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { RequestSafetyPipeline } from './request-safety-pipeline.js';
import { CsrfService } from '../../modules/auth/csrf/csrf.service.js';
import { EXPECTED_OPERATION_MANIFEST } from '../../../../../packages/contracts/openapi/contract-manifest.js';
import { buildProblem, normalizeRequestId, ProblemError } from '../http/problem.js';
import { operations, type OperationId } from '../../../../../packages/contracts/openapi/generated-client.js';
import type { ContractValidator } from '../../../../../packages/contracts/openapi/runtime-validator.js';
import { validateOperationRequest, type ClientCallInput } from '../../../../../packages/contracts/openapi/client.js';
import type { AuthorizationPrincipal } from '../../modules/identity/domain/authz.js';
import type { AuthenticationAuditInput } from '../../modules/identity/application/session.service.js';

interface PrincipalRequest extends FastifyRequest {
  user?: AuthorizationPrincipal;
}

@Injectable()
export class RequestSafetyGuard implements CanActivate {
  constructor(
    @Inject(CsrfService) private readonly csrf: CsrfService,
    @Inject('CONTRACT_VALIDATOR') private readonly validator: ContractValidator,
    @Optional() @Inject('IDENTITY_STORE') private readonly securityAudit?: { recordAuthenticationAudit?(input: AuthenticationAuditInput): Promise<void> },
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PrincipalRequest>();
    const method = request.method.toUpperCase();
    const path = request.url.split('?')[0]?.replace(/^\/api\/v1/, '') ?? request.url;
    const contractPath = (request.routeOptions.url ?? path).replace(/^\/api\/v1/, '').replace(/:([A-Za-z][A-Za-z0-9_]*)/g, '{$1}');
    const operation = EXPECTED_OPERATION_MANIFEST.find((candidate) => candidate.method === method.toLowerCase() && candidate.path === contractPath);
    const unsafe = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (operation === undefined && unsafe) {
      await this.recordSafetyRejection(request, 'UNSAFE_ROUTE');
      throw new ProblemError(buildProblem({ status: 500, code: 'INTERNAL_ERROR', title: 'Unsafe route is absent from the contract.', requestId: normalizeRequestId(request.headers['x-request-id']), retryable: false }));
    }
    if (operation === undefined) return true;
    const anonymousSessionBootstrap = operation.operationId === 'createSession';
    const principal = request.user;
    const sessionId = request.cookies?.session_id;
    const operationId = operation.operationId;
    const idempotencyKey = headerString(request.headers['idempotency-key']);
    const ifMatch = headerString(request.headers['if-match']);
    const csrfToken = headerString(request.headers['x-csrf-token']);
    const requestBody = request.body === undefined ? undefined : request.body;

    const operationContract = operations[operationId as OperationId];
    if (operationContract === undefined) {
      throw new ProblemError(buildProblem({ status: 500, code: 'INTERNAL_ERROR', title: 'Unsafe route is absent from generated contract metadata.', requestId: normalizeRequestId(request.headers['x-request-id']), retryable: false }));
    }
    const validateStructure = () => {
      try {
        validateOperationRequest(operationContract, {
          pathParams: asStringRecord(request.params),
          query: asQueryRecord(request.query),
          headers: asStringRecord(request.headers),
          ...(requestBody === undefined ? {} : { body: requestBody }),
        } satisfies ClientCallInput, this.validator);
      } catch (error) {
        throw new ProblemError(buildProblem({
          status: 400,
          code: 'VALIDATION_FAILED',
          title: 'Validation failed',
          requestId: normalizeRequestId(request.headers['x-request-id']),
          retryable: false,
          violations: [{ field: 'request', code: 'INVALID', message: error instanceof Error ? error.message : 'Request validation failed.' }],
        }));
      }
    };
    if (!unsafe) {
      if (principal === undefined && !['getCsrfToken'].includes(operationId)) {
        await this.recordSafetyRejection(request, 'AUTHENTICATION_REQUIRED');
        throw new ProblemError(buildProblem({ status: 401, code: 'AUTHENTICATION_REQUIRED', title: 'Authentication required', requestId: normalizeRequestId(request.headers['x-request-id']), retryable: false }));
      }
      validateStructure();
      return true;
    }
    const pipeline = new RequestSafetyPipeline({ validateStructure });
    try {
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
    } catch (error) {
      await this.recordSafetyRejection(request, error instanceof ProblemError ? error.code : 'SAFETY_REJECTED');
      throw error;
    }
    return true;
  }

  private async recordSafetyRejection(request: PrincipalRequest, reason: string): Promise<void> {
    try {
      await this.securityAudit?.recordAuthenticationAudit?.({
        provider: 'REQUEST_SAFETY',
        outcome: 'DENIED',
        requestId: normalizeRequestId(request.headers['x-request-id']),
        ...(request.user === undefined ? {} : { organizationId: request.user.organizationId, actorUserId: request.user.userId }),
        reason,
      });
    } catch {
      // Preserve the original safety problem and avoid leaking audit storage
      // details. The database-backed sink is still the authoritative path
      // whenever the security audit boundary is available.
    }
  }
}

function headerString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function asStringRecord(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, headerString(typeof item === 'string' || Array.isArray(item) ? item : undefined) ?? ''])) as Record<string, string>;
}

function asQueryRecord(value: unknown): Record<string, string | number | boolean | readonly (string | number | boolean)[] | undefined> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, Array.isArray(item) ? item : item])) as Record<string, string | number | boolean | readonly (string | number | boolean)[] | undefined>;
}
