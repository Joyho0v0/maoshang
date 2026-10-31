import { buildProblem, normalizeRequestId, ProblemError } from './problem.js';
import { parseEtag } from './etag.js';
import { DomainProblemError } from './domain-error.js';
import { requireIdempotencyTransaction } from '../security/idempotency-transaction-context.js';
import type { FastifyRequest } from 'fastify';
import type { PoolClient } from 'pg';
import type { AuthorizationPrincipal } from '../../modules/identity/domain/authz.js';

export interface BackendRequest extends FastifyRequest {
  user?: AuthorizationPrincipal;
}

export function principalOf(request: BackendRequest): AuthorizationPrincipal {
  if (request.user === undefined) {
    throw new ProblemError(buildProblem({ status: 401, code: 'AUTHENTICATION_REQUIRED', title: 'Authentication required', requestId: requestIdOf(request), retryable: false }));
  }
  return request.user;
}

export function requestIdOf(request: FastifyRequest): string {
  return normalizeRequestId(request.headers['x-request-id']);
}

export function transactionOf(request: BackendRequest): PoolClient {
  try {
    return requireIdempotencyTransaction(request).client;
  } catch {
    throw new ProblemError(buildProblem({ status: 500, code: 'INTERNAL_ERROR', title: 'Idempotency transaction unavailable', requestId: requestIdOf(request), retryable: false }));
  }
}

export function etagVersion(request: FastifyRequest): number {
  const value = Array.isArray(request.headers['if-match']) ? request.headers['if-match'][0] : request.headers['if-match'];
  const version = parseEtag(value);
  if (version === undefined) {
    throw new ProblemError(buildProblem({ status: 428, code: 'PRECONDITION_REQUIRED', title: 'If-Match is required', requestId: requestIdOf(request), retryable: false }));
  }
  return version;
}

export function queryRecord(request: FastifyRequest): Record<string, unknown> {
  const query = request.query;
  return typeof query === 'object' && query !== null && !Array.isArray(query) ? query as Record<string, unknown> : {};
}

export function queryString(query: Record<string, unknown>, key: string): string | undefined {
  const value = query[key];
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  return typeof value === 'string' ? value : undefined;
}

export function queryStrings(query: Record<string, unknown>, key: string): string[] | undefined {
  const value = query[key];
  if (value === undefined) return undefined;
  const values = (Array.isArray(value) ? value : [value]).filter((item): item is string => typeof item === 'string');
  return values;
}

export function problemForBackend(error: unknown, request: FastifyRequest, resourceHref?: string): ProblemError {
  if (error instanceof ProblemError) return error;
  const requestId = requestIdOf(request);
  if (error instanceof DomainProblemError) {
    const code = error.code;
    const status = error.status;
    const meta = error.meta ?? (code === 'VALIDATION_FAILED' ? { violations: [{ field: 'request', code: 'INVALID', message: 'The request is invalid.' }] } : undefined);
    return new ProblemError(buildProblem({ status, code, title: titleFor(code), requestId, retryable: false, ...(resourceHref === undefined ? {} : { instance: resourceHref }), ...(meta === undefined ? {} : { meta }) }));
  }
  if (isPgCode(error, '23505')) return new ProblemError(buildProblem({ status: 409, code: 'DUPLICATE_BUSINESS_KEY', title: 'Business key already exists', requestId, retryable: false }));
  if (isPgCode(error, '23503')) return new ProblemError(buildProblem({ status: 404, code: 'RESOURCE_NOT_FOUND', title: 'Resource not found', requestId, retryable: false }));
  if (error instanceof Error && ['INVALID_CURSOR', 'UNKNOWN_SORT', 'INVALID_PAGE_SIZE'].includes(error.message)) {
    return new ProblemError(buildProblem({ status: 400, code: 'VALIDATION_FAILED', title: 'Validation failed', requestId, retryable: false, meta: { violations: [{ field: 'query', code: error.message, message: 'The pagination query is invalid.' }] } }));
  }
  return new ProblemError(buildProblem({ status: 500, code: 'INTERNAL_ERROR', title: 'Internal server error', requestId, retryable: false }));
}

function titleFor(code: string): string {
  if (code === 'PERMISSION_DENIED') return 'Permission denied';
  if (code === 'RESOURCE_NOT_FOUND') return 'Resource not found';
  if (code === 'VERSION_CONFLICT') return 'Resource version conflict';
  if (code === 'VALIDATION_FAILED') return 'Validation failed';
  if (code === 'CUSTOMER_APPROVAL_STATE_CONFLICT') return 'Customer approval state conflict';
  if (code === 'INVALID_TRANSITION') return 'Invalid state transition';
  if (code === 'STATE_CONFLICT') return 'State conflict';
  return 'Business operation failed';
}

function isPgCode(value: unknown, code: string): boolean {
  return typeof value === 'object' && value !== null && 'code' in value && (value as { code?: unknown }).code === code;
}
