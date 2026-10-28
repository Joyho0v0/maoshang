import {
  RequestSafetyPipeline,
  type SafetyRequest,
} from '../../apps/api/src/common/security/request-safety-pipeline.js';

function unsafeRequest(overrides: Partial<SafetyRequest> = {}): SafetyRequest {
  return {
    method: 'POST',
    operationId: 'createCustomer',
    authenticated: true,
    csrfToken: 'csrf-valid',
    expectedCsrfToken: 'csrf-valid',
    idempotencyKey: 'command-key-1',
    requiresIfMatch: false,
    requiresIdempotencyKey: true,
    body: { name: 'Acme' },
    ...overrides,
  };
}

describe('request safety pipeline', () => {
  it('rejects missing or invalid CSRF before any side-effect claim', () => {
    const claims: string[] = [];
    const pipeline = new RequestSafetyPipeline({ claim: (key) => claims.push(key) });

    const { csrfToken: _csrfToken, ...missingCsrf } = unsafeRequest();
    void _csrfToken;
    expect(() => pipeline.validate(missingCsrf)).toThrowError(
      expect.objectContaining({ status: 403, code: 'CSRF_FAILED' }),
    );
    expect(() => pipeline.validate(unsafeRequest({ csrfToken: 'wrong' }))).toThrowError(
      expect.objectContaining({ status: 403, code: 'CSRF_FAILED' }),
    );
    expect(claims).toEqual([]);
  });

  it('returns 428 for missing required idempotency or If-Match headers', () => {
    const pipeline = new RequestSafetyPipeline({ claim: () => undefined });

    const { idempotencyKey: _idempotencyKey, ...missingIdempotency } = unsafeRequest();
    void _idempotencyKey;
    expect(() => pipeline.validate(missingIdempotency)).toThrowError(
      expect.objectContaining({ status: 428, code: 'PRECONDITION_REQUIRED' }),
    );
    expect(() => pipeline.validate(unsafeRequest({ requiresIfMatch: true }))).toThrowError(
      expect.objectContaining({ status: 428, code: 'PRECONDITION_REQUIRED' }),
    );
  });

  it('keeps the frozen order authentication, CSRF, structure, key/hash, then transaction', () => {
    const stages: string[] = [];
    const pipeline = new RequestSafetyPipeline({
      authenticate: () => stages.push('authentication'),
      validateStructure: () => stages.push('structure'),
      claim: () => stages.push('key/hash'),
      verifyTransactionState: () => stages.push('transaction'),
    });

    pipeline.validate(unsafeRequest());

    expect(stages).toEqual(['authentication', 'structure', 'key/hash', 'transaction']);
  });
});
