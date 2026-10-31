import { randomUUID } from 'node:crypto';

export type ProblemMeta = Record<string, unknown>;

export interface ProblemViolation {
  field: string;
  code: string;
  message: string;
}

export interface ProblemDocument {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code: string;
  requestId: string;
  traceId?: string;
  retryable: boolean;
  violations?: ProblemViolation[];
  meta?: ProblemMeta;
}

const META_REQUIREMENTS: Record<string, (meta: ProblemMeta) => boolean> = {
  VALIDATION_FAILED: (meta) => Array.isArray(meta.violations) && meta.violations.length > 0,
  VERSION_CONFLICT: (meta) => isInteger(meta.currentVersion) && isEtag(meta.currentEtag) && isApiHref(meta.resourceHref),
  STATE_CONFLICT: (meta) => typeof meta.resourceType === 'string' && typeof meta.resourceId === 'string' && typeof meta.currentState === 'string',
  IDEMPOTENCY_KEY_REUSED: (meta) => typeof meta.operationId === 'string' && isApiHref(meta.commandStatusHref),
  INVENTORY_INSUFFICIENT: (meta) => Array.isArray(meta.shortages) && meta.shortages.length > 0 && meta.shortages.every(isShortage),
  FILE_NOT_READY: (meta) => typeof meta.fileId === 'string' && typeof meta.state === 'string' && isApiHref(meta.statusHref),
  OPERATION_ALREADY_REVERSED: (meta) => typeof meta.operationId === 'string' && typeof meta.reversalOperationId === 'string' && isApiHref(meta.reversalHref),
  REVERSAL_WOULD_VIOLATE_INVARIANT: (meta) => Array.isArray(meta.violations) && meta.violations.length > 0 && meta.violations.every(isReversalViolation),
  REVERSAL_NOT_ALLOWED: (meta) => typeof meta.operationId === 'string' && typeof meta.operationType === 'string' && typeof meta.currentStatus === 'string',
  CUSTOMER_APPROVAL_STATE_CONFLICT: (meta) => typeof meta.customerId === 'string' && isCustomerStatus(meta.currentCustomerStatus) && isInteger(meta.currentVersion),
  CSRF_FAILED: (meta) => meta.refreshHref === '/api/v1/auth/csrf',
};

const STABLE_CODES = new Set([
  'VALIDATION_FAILED', 'INVALID_CURSOR', 'UNKNOWN_FILTER', 'INVALID_TRANSITION',
  'AUTHENTICATION_REQUIRED', 'SESSION_EXPIRED', 'INVALID_CREDENTIALS',
  'PERMISSION_DENIED', 'CSRF_FAILED', 'RESOURCE_NOT_FOUND', 'COMMAND_NOT_FOUND',
  'VERSION_CONFLICT', 'STATE_CONFLICT', 'IDEMPOTENCY_KEY_REUSED', 'INVENTORY_INSUFFICIENT',
  'DUPLICATE_BUSINESS_KEY', 'FILE_NOT_READY', 'FILE_TOO_LARGE', 'UNSUPPORTED_MEDIA_TYPE',
  'BUSINESS_RULE_VIOLATION', 'DOCUMENT_INVALID', 'PRECONDITION_REQUIRED', 'RATE_LIMITED',
  'DEPENDENCY_FAILURE', 'DEPENDENCY_UNAVAILABLE', 'OPERATION_ALREADY_REVERSED',
  'REVERSAL_WOULD_VIOLATE_INVARIANT', 'REVERSAL_NOT_ALLOWED', 'CUSTOMER_APPROVAL_STATE_CONFLICT',
]);

const EXPECTED_STATUS: Record<string, number | readonly number[]> = {
  VALIDATION_FAILED: [400, 422],
  INVALID_CURSOR: 400,
  UNKNOWN_FILTER: 400,
  INVALID_TRANSITION: 409,
  AUTHENTICATION_REQUIRED: 401,
  SESSION_EXPIRED: 401,
  INVALID_CREDENTIALS: 401,
  PERMISSION_DENIED: 403,
  CSRF_FAILED: 403,
  RESOURCE_NOT_FOUND: 404,
  COMMAND_NOT_FOUND: 404,
  VERSION_CONFLICT: 409,
  STATE_CONFLICT: 409,
  IDEMPOTENCY_KEY_REUSED: 409,
  INVENTORY_INSUFFICIENT: 409,
  DUPLICATE_BUSINESS_KEY: 409,
  BUSINESS_RULE_VIOLATION: 409,
  DOCUMENT_INVALID: 409,
  OPERATION_ALREADY_REVERSED: 409,
  REVERSAL_WOULD_VIOLATE_INVARIANT: 409,
  REVERSAL_NOT_ALLOWED: 409,
  CUSTOMER_APPROVAL_STATE_CONFLICT: 409,
  FILE_NOT_READY: 409,
  FILE_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  PRECONDITION_REQUIRED: 428,
  RATE_LIMITED: 429,
  DEPENDENCY_FAILURE: 502,
  DEPENDENCY_UNAVAILABLE: 503,
  INTERNAL_ERROR: [500, 502, 503],
};

export type ProblemDisposition = 'TERMINAL' | 'RECOVERABLE';

const RECOVERABLE_PROBLEM_CODES = new Set(['DEPENDENCY_FAILURE', 'DEPENDENCY_UNAVAILABLE']);

/**
 * Classifies known client-visible outcomes once, at the common ProblemError
 * boundary. Unknown internal failures must use RecoverableProblemError because
 * INTERNAL_ERROR alone cannot tell an unknown result from a deterministic
 * response-contract violation.
 */
export function problemDispositionFor(problem: Pick<ProblemDocument, 'code'>): ProblemDisposition {
  return RECOVERABLE_PROBLEM_CODES.has(problem.code) ? 'RECOVERABLE' : 'TERMINAL';
}

export class ProblemError extends Error {
  readonly problem: ProblemDocument;
  readonly disposition: ProblemDisposition;

  constructor(problem: ProblemDocument, disposition: ProblemDisposition = problemDispositionFor(problem)) {
    super(problem.title);
    this.name = 'ProblemError';
    this.problem = RECOVERABLE_PROBLEM_CODES.has(problem.code)
      ? { ...problem, retryable: true }
      : problem;
    this.disposition = RECOVERABLE_PROBLEM_CODES.has(problem.code) ? 'RECOVERABLE' : disposition;
  }

  get status(): number {
    return this.problem.status;
  }

  get code(): string {
    return this.problem.code;
  }
}

export class RecoverableProblemError extends ProblemError {
  constructor(problem: ProblemDocument) {
    super(problem, 'RECOVERABLE');
    this.name = 'RecoverableProblemError';
  }
}

export interface BuildProblemInput {
  status: number;
  code: string;
  title: string;
  detail?: string;
  instance?: string;
  requestId: string;
  traceId?: string;
  retryable?: boolean;
  violations?: ProblemViolation[];
  meta?: ProblemMeta;
}

export function buildProblem(input: BuildProblemInput): ProblemDocument {
  if (input.status < 400 || input.status > 599) {
    throw new ProblemError({
      type: 'urn:autoflow:problem:invalid-problem',
      title: 'Invalid problem',
      status: 500,
      code: 'INTERNAL_ERROR',
      requestId: input.requestId,
      retryable: false,
    });
  }
  if (!/^[A-Z][A-Z0-9_]{2,63}$/.test(input.code)) {
    throw new ProblemError({
      type: 'urn:autoflow:problem:invalid-problem',
      title: 'Invalid problem',
      status: 500,
      code: 'INTERNAL_ERROR',
      requestId: input.requestId,
      retryable: false,
    });
  }
  const meta = input.meta ?? (input.code === 'VALIDATION_FAILED' && input.violations !== undefined ? { violations: input.violations } : undefined);
  const expectedStatus = EXPECTED_STATUS[input.code];
  const expectedStatuses = typeof expectedStatus === 'number' ? [expectedStatus] : expectedStatus;
  if (expectedStatuses !== undefined && !expectedStatuses.includes(input.status)) {
    throw new ProblemError(internalProblem(`HTTP status ${input.status} does not match ${input.code}.`));
  }
  if (!STABLE_CODES.has(input.code) && input.code !== 'INTERNAL_ERROR') {
    throw new ProblemError(internalProblem(`Unknown stable problem code: ${input.code}.`));
  }
  if (META_REQUIREMENTS[input.code] !== undefined && meta === undefined) {
    throw new ProblemError(internalProblem(`Typed metadata for ${input.code} is required.`));
  }
  if (meta !== undefined) validateProblemMeta(input.code, meta);
  const violations = input.violations ?? (isViolationList(meta?.violations) ? meta.violations : undefined);

  return {
    type: `urn:autoflow:problem:${input.code.toLowerCase().replaceAll('_', '-')}`,
    title: input.title,
    status: input.status,
    ...(input.detail === undefined ? {} : { detail: input.detail }),
    ...(input.instance === undefined ? {} : { instance: input.instance }),
    code: input.code,
    requestId: input.requestId,
    ...(input.traceId === undefined ? {} : { traceId: input.traceId }),
    retryable: RECOVERABLE_PROBLEM_CODES.has(input.code) ? true : input.retryable ?? input.status >= 500,
    ...(violations === undefined ? {} : { violations }),
    ...(meta === undefined ? {} : { meta }),
  };
}

export function validateProblemMeta(code: string, meta: unknown): true {
  if (!isRecord(meta)) {
    throw new ProblemError(internalProblem('Typed problem metadata must be an object.'));
  }
  const requirement = META_REQUIREMENTS[code];
  if (requirement !== undefined && !requirement(meta)) {
    throw new ProblemError(internalProblem(`Typed metadata for ${code} is incomplete.`));
  }
  if (code === 'CSRF_FAILED' && meta.refreshHref !== '/api/v1/auth/csrf') {
    throw new ProblemError(internalProblem('CSRF refresh href is not allowlisted.'));
  }
  if (STABLE_CODES.has(code) === false && code !== 'INTERNAL_ERROR') {
    throw new ProblemError(internalProblem(`Unknown stable problem code: ${code}.`));
  }
  return true;
}

export function normalizeRequestId(value: unknown): string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : randomUUID();
}

function internalProblem(detail: string): ProblemDocument {
  return {
    type: 'urn:autoflow:problem:invalid-typed-meta',
    title: 'Invalid typed problem metadata',
    status: 500,
    code: 'INTERNAL_ERROR',
    requestId: '00000000-0000-4000-8000-000000000000',
    retryable: false,
    detail,
  };
}

function isRecord(value: unknown): value is ProblemMeta {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isViolationList(value: unknown): value is ProblemViolation[] {
  return Array.isArray(value) && value.every((item) => isRecord(item) && typeof item.field === 'string' && typeof item.code === 'string' && typeof item.message === 'string');
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1;
}

function isEtag(value: unknown): value is string {
  return typeof value === 'string' && /^"v[1-9][0-9]*"$/.test(value);
}

function isApiHref(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/api/v1/') && !/^(?:javascript:|data:|https?:)/i.test(value);
}

function isShortage(value: unknown): boolean {
  return isRecord(value) && typeof value.skuId === 'string' && isDecimal(value.requested) && isDecimal(value.available) && typeof value.unit === 'string';
}

function isReversalViolation(value: unknown): boolean {
  return isRecord(value) && typeof value.skuId === 'string' && typeof value.locationId === 'string' && isDecimal(value.onHand) && isDecimal(value.reserved) && isDecimal(value.delta) && typeof value.unit === 'string';
}

function isDecimal(value: unknown): boolean {
  return typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value);
}

function isCustomerStatus(value: unknown): boolean {
  return value === 'DRAFT' || value === 'PENDING_APPROVAL' || value === 'APPROVED' || value === 'INACTIVE';
}
