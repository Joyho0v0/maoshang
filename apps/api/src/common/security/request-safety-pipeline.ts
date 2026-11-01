import { buildProblem, ProblemError } from '../http/problem.js';

export type UnsafeMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface SafetyRequest {
  method: UnsafeMethod;
  operationId: string;
  authenticated: boolean;
  csrfToken?: string;
  expectedCsrfToken?: string;
  idempotencyKey?: string;
  ifMatch?: string;
  requiresIfMatch: boolean;
  requiresIdempotencyKey: boolean;
  body: unknown;
  allowAnonymous?: boolean;
  csrfRefreshHref?: string;
}

export interface SafetyPipelineHooks {
  authenticate?: (request: SafetyRequest) => void;
  validateStructure?: (request: SafetyRequest) => void;
  claim?: (key: string, request: SafetyRequest) => void;
  verifyTransactionState?: (request: SafetyRequest) => void;
}

export class RequestSafetyPipeline {
  constructor(private readonly hooks: SafetyPipelineHooks = {}) {}

  validate(request: SafetyRequest): void {
    this.hooks.authenticate?.(request);
    if (!request.allowAnonymous && !request.authenticated) {
      throw this.error(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required.', false);
    }

    if (!request.csrfToken || request.csrfToken !== request.expectedCsrfToken) {
      throw this.error(403, 'CSRF_FAILED', 'CSRF validation failed.', true, { refreshHref: request.csrfRefreshHref ?? '/api/v1/auth/csrf' });
    }

    this.hooks.validateStructure?.(request);

    if (request.requiresIdempotencyKey && !isIdempotencyKey(request.idempotencyKey)) {
      throw this.error(428, 'PRECONDITION_REQUIRED', 'Idempotency-Key is required.', false);
    }
    if (request.requiresIfMatch && !isEtag(request.ifMatch)) {
      throw this.error(428, 'PRECONDITION_REQUIRED', 'If-Match is required.', false);
    }

    if (request.requiresIdempotencyKey) {
      this.hooks.claim?.(request.idempotencyKey as string, request);
    }
    this.hooks.verifyTransactionState?.(request);
  }

  private error(status: number, code: string, detail: string, retryable: boolean, meta?: Record<string, unknown>): ProblemError {
    return new ProblemError(buildProblem({
      status,
      code,
      title: code === 'CSRF_FAILED' ? 'CSRF failed' : 'Precondition required',
      detail,
      requestId: '00000000-0000-4000-8000-000000000000',
      retryable,
      ...(meta === undefined ? {} : { meta }),
    }));
  }
}

function isIdempotencyKey(value: string | undefined): value is string {
  return value !== undefined && value.length >= 1 && value.length <= 128 && /^[\x21-\x7e]+$/.test(value);
}

function isEtag(value: string | undefined): value is string {
  return value !== undefined && /^"v[1-9][0-9]*"$/.test(value) && value !== '*';
}
