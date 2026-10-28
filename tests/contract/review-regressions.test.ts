import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { ApiProblemError } from '../../packages/contracts/openapi/client.js';
import { GeneratedApiClient } from '../../packages/contracts/openapi/generated-client.js';
import type { components } from '../../packages/contracts/openapi/generated.js';
import { createContractValidator } from '../../packages/contracts/openapi/runtime-validator.js';

const requestId = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2';
const resourceId = '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019';

const typedProblemFixture = {
  type: 'urn:autoflow:problem:business-rule-violation',
  title: 'Rule',
  status: 409,
  code: 'BUSINESS_RULE_VIOLATION',
  requestId,
  retryable: false,
  meta: null,
} satisfies components['schemas']['Problem'];

const typedVersionConflictFixture = {
  type: 'urn:autoflow:problem:version-conflict',
  title: 'Version conflict',
  status: 409,
  code: 'VERSION_CONFLICT',
  requestId,
  retryable: false,
  meta: { currentVersion: 2, currentEtag: '"v2"', resourceHref: `/api/v1/products/${resourceId}` },
} satisfies components['schemas']['Problem'];

function versionConflictEtag(problem: components['schemas']['Problem']): string | undefined {
  if (problem.code !== 'VERSION_CONFLICT') return undefined;
  return problem.meta.currentEtag;
}

const narrowedVersionConflictEtag: string | undefined = versionConflictEtag(typedVersionConflictFixture);

async function contract() {
  return parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
}

describe('third-review contract regressions', () => {
  it('returns a status/data/header envelope and validates header values on success', async () => {
    const validator = createContractValidator(await contract());
    const client = new GeneratedApiClient({
      fetch: async () => new Response(JSON.stringify({ csrfToken: 'csrf-token-value', expiresAt: '2026-10-28T05:00:00Z' }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'x-request-id': requestId, 'cache-control': 'no-store' },
      }),
      validator,
    });

    await expect(client.call('getCsrfToken', {})).resolves.toEqual({
      status: 200,
      data: { csrfToken: 'csrf-token-value', expiresAt: '2026-10-28T05:00:00Z' },
      headers: { 'X-Request-ID': requestId, 'Cache-Control': 'no-store' },
    });

    const badClient = new GeneratedApiClient({
      fetch: async () => new Response(JSON.stringify({ csrfToken: 'csrf-token-value', expiresAt: '2026-10-28T05:00:00Z' }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'x-request-id': requestId, 'cache-control': 'public, max-age=86400' },
      }),
      validator,
    });
    await expect(badClient.call('getCsrfToken', {})).rejects.toThrow(/Invalid response header Cache-Control/);
  });

  it('rejects undeclared error statuses, bad problem media types, and body status mismatches', async () => {
    const validator = createContractValidator(await contract());
    const problem = { type: 'urn:autoflow:problem:business-rule-violation', title: 'Conflict', status: 409, code: 'BUSINESS_RULE_VIOLATION', requestId, retryable: false };
    const input = { headers: { 'X-CSRF-Token': 'csrf-token-value', 'Idempotency-Key': 'key-1' }, body: { name: 'Acme', ownerUserId: resourceId } };
    const badMediaClient = new GeneratedApiClient({
      fetch: async () => new Response(JSON.stringify(problem), { status: 409, headers: { 'content-type': 'application/json', 'x-request-id': requestId } }),
      validator,
    });
    await expect(badMediaClient.call('createCustomer', input)).rejects.toThrow(/Unexpected response content type/);

    const mismatched = new GeneratedApiClient({
      fetch: async () => new Response(JSON.stringify({ ...problem, status: 500 }), { status: 409, headers: { 'content-type': 'application/problem+json', 'x-request-id': requestId } }),
      validator,
    });
    await expect(mismatched.call('createCustomer', input)).rejects.toThrow(/status does not match/);

    const undeclared = new GeneratedApiClient({
      fetch: async () => new Response(JSON.stringify(problem), { status: 418, headers: { 'content-type': 'application/problem+json' } }),
      validator,
    });
    await expect(undeclared.call('createCustomer', input)).rejects.toThrow(/Unexpected HTTP 418/);
  });

  it('preserves repeated query keys and freezes the default sort', async () => {
    const validator = createContractValidator(await contract());
    let requested = '';
    const client = new GeneratedApiClient({
      fetch: async (input) => {
        requested = String(input);
        return new Response(JSON.stringify({ data: [], page: { nextCursor: null, hasNext: false } }), {
          status: 200,
          headers: { 'content-type': 'application/json', 'x-request-id': requestId, 'cache-control': 'no-store' },
        });
      },
      validator,
    });
    await client.call('listProducts', { query: { 'filter[status]': ['ACTIVE', 'INACTIVE'] } });
    expect(requested).toContain('sort=-updatedAt%2C-id');
    expect(requested.match(/filter%5Bstatus%5D=/g)).toHaveLength(2);
  });

  it('keeps Problem and CommandStatus closed and status-consistent at runtime', async () => {
    const validator = createContractValidator(await contract());
    expect(validator.validate('Problem', { type: 'urn:test', title: 'Auth', status: 500, code: 'AUTHENTICATION_REQUIRED', requestId, retryable: false })).toBe(false);
    expect(validator.validate('Problem', { type: 'urn:test', title: 'Unknown', status: 409, code: 'TOTALLY_UNKNOWN', requestId, retryable: false })).toBe(false);
    expect(validator.validate('Problem', { type: 'urn:test', title: 'Rule', status: 409, code: 'BUSINESS_RULE_VIOLATION', requestId, retryable: false })).toBe(true);
    const base = { commandId: requestId, operationId: 'createCustomer', startedAt: '2026-10-28T05:00:00Z', expiresAt: '2026-10-29T05:00:00Z', attemptCount: 1 };
    expect(validator.validate('CommandStatus', { ...base, state: 'SUCCEEDED', completedAt: '2026-10-28T05:01:00Z', retryAfterMs: 0, httpStatus: 201, resource: { type: 'CUSTOMER', id: resourceId, href: `/api/v1/customers/${resourceId}` }, resultHref: null, problem: null, unexpected: true })).toBe(false);
    expect(validator.validate('CommandStatus', { ...base, state: 'FAILED', completedAt: '2026-10-28T05:01:00Z', retryAfterMs: 0, httpStatus: 409, resource: { type: 'CUSTOMER', id: resourceId, href: `/api/v1/customers/${resourceId}` }, resultHref: null, problem: null })).toBe(false);
    expect(validator.validate('CommandStatus', { ...base, state: 'FAILED', completedAt: '2026-10-28T05:01:00Z', retryAfterMs: 0, httpStatus: 409, resource: null, resultHref: `/api/v1/customers/${resourceId}`, problem: { type: 'urn:autoflow:problem:business-rule-violation', title: 'Conflict', status: 409, code: 'BUSINESS_RULE_VIOLATION', requestId, retryable: false } })).toBe(false);
  });

  it('rejects cross-domain create payloads and requires domain response fields', async () => {
    const validator = createContractValidator(await contract());
    expect(validator.validate('ProductCreateRequest', { resourceType: 'TASK', name: 'not-a-product' })).toBe(false);
    expect(validator.validate('ProductCreateRequest', { name: 'Widget', productCode: 'P-001', unit: 'PCS' })).toBe(true);
    expect(validator.validate('Product', { id: resourceId, organizationId: resourceId, version: 1, createdAt: '2026-10-28T05:00:00Z', updatedAt: '2026-10-28T05:00:00Z', name: 'Widget', productCode: 'P-001', unit: 'PCS', status: 'ACTIVE' })).toBe(true);
    expect(validator.validate('Product', { id: resourceId, organizationId: resourceId, version: 1, createdAt: '2026-10-28T05:00:00Z', updatedAt: '2026-10-28T05:00:00Z' })).toBe(false);
  });

  it('exposes a typed Problem on ApiProblemError', () => {
    const error = new ApiProblemError(409, typedProblemFixture);
    expect(error.problem.code).toBe('BUSINESS_RULE_VIOLATION');
    expect(narrowedVersionConflictEtag).toBe('"v2"');
  });
});
