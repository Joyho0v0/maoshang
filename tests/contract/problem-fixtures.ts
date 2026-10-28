export type ProblemCase = {
  readonly code: string;
  readonly statuses: readonly number[];
  readonly meta: unknown;
  readonly violations?: readonly Record<string, string>[];
};

export const typedMetaCases = new Set([
  'VALIDATION_FAILED',
  'VERSION_CONFLICT',
  'STATE_CONFLICT',
  'IDEMPOTENCY_KEY_REUSED',
  'INVENTORY_INSUFFICIENT',
  'FILE_NOT_READY',
  'OPERATION_ALREADY_REVERSED',
  'REVERSAL_WOULD_VIOLATE_INVARIANT',
  'REVERSAL_NOT_ALLOWED',
  'CUSTOMER_APPROVAL_STATE_CONFLICT',
  'CSRF_FAILED',
]);

const resourceId = '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019';
const requestId = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2';

export const problemCases: readonly ProblemCase[] = [
  { code: 'INVALID_CURSOR', statuses: [400], meta: null },
  { code: 'UNKNOWN_FILTER', statuses: [400], meta: null },
  { code: 'INVALID_TRANSITION', statuses: [409], meta: null },
  { code: 'AUTHENTICATION_REQUIRED', statuses: [401], meta: null },
  { code: 'SESSION_EXPIRED', statuses: [401], meta: null },
  { code: 'INVALID_CREDENTIALS', statuses: [401], meta: null },
  { code: 'PERMISSION_DENIED', statuses: [403], meta: null },
  { code: 'RESOURCE_NOT_FOUND', statuses: [404], meta: null },
  { code: 'COMMAND_NOT_FOUND', statuses: [404], meta: null },
  { code: 'PRECONDITION_REQUIRED', statuses: [428], meta: null },
  {
    code: 'VALIDATION_FAILED',
    statuses: [400, 422],
    meta: { violations: [{ field: 'name', code: 'REQUIRED', message: 'name is required' }] },
    violations: [{ field: 'name', code: 'REQUIRED', message: 'name is required' }],
  },
  { code: 'VERSION_CONFLICT', statuses: [409], meta: { currentVersion: 2, currentEtag: '"v2"', resourceHref: `/api/v1/products/${resourceId}` } },
  { code: 'STATE_CONFLICT', statuses: [409], meta: { resourceType: 'ORDER', resourceId, currentState: 'FULFILLED' } },
  { code: 'IDEMPOTENCY_KEY_REUSED', statuses: [409], meta: { operationId: 'createCustomer', commandStatusHref: '/api/v1/commands/status' } },
  { code: 'INVENTORY_INSUFFICIENT', statuses: [409], meta: { shortages: [{ skuId: resourceId, requested: '3', available: '1', unit: 'PCS' }] } },
  { code: 'FILE_NOT_READY', statuses: [409], meta: { fileId: resourceId, state: 'SCANNING', statusHref: `/api/v1/files/${resourceId}` } },
  { code: 'OPERATION_ALREADY_REVERSED', statuses: [409], meta: { operationId: resourceId, reversalOperationId: requestId, reversalHref: `/api/v1/inventory/operations/${requestId}` } },
  { code: 'REVERSAL_WOULD_VIOLATE_INVARIANT', statuses: [409], meta: { violations: [{ skuId: resourceId, locationId: requestId, onHand: '1', reserved: '1', delta: '-3', unit: 'PCS' }] } },
  { code: 'REVERSAL_NOT_ALLOWED', statuses: [409], meta: { operationId: resourceId, operationType: 'RECEIPT', currentStatus: 'CANCELLED' } },
  { code: 'CUSTOMER_APPROVAL_STATE_CONFLICT', statuses: [409], meta: { customerId: resourceId, currentCustomerStatus: 'APPROVED', currentVersion: 3 } },
  { code: 'CSRF_FAILED', statuses: [403], meta: { refreshHref: '/api/v1/auth/csrf' } },
  { code: 'DUPLICATE_BUSINESS_KEY', statuses: [409], meta: null },
  { code: 'FILE_TOO_LARGE', statuses: [413], meta: null },
  { code: 'UNSUPPORTED_MEDIA_TYPE', statuses: [415], meta: null },
  { code: 'BUSINESS_RULE_VIOLATION', statuses: [409], meta: null },
  { code: 'DOCUMENT_INVALID', statuses: [409], meta: null },
  { code: 'RATE_LIMITED', statuses: [429], meta: null },
  { code: 'DEPENDENCY_FAILURE', statuses: [502], meta: null },
  { code: 'DEPENDENCY_UNAVAILABLE', statuses: [503], meta: null },
  { code: 'INTERNAL_ERROR', statuses: [500, 502, 503], meta: null },
];

export function problemFixture(testCase: ProblemCase, status: number, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    type: `urn:autoflow:problem:${testCase.code.toLowerCase().replaceAll('_', '-')}`,
    title: testCase.code,
    status,
    code: testCase.code,
    requestId,
    retryable: status >= 500,
    ...(testCase.violations === undefined ? {} : { violations: testCase.violations }),
    meta: testCase.meta,
    ...overrides,
  };
}

export { requestId, resourceId };
