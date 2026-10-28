import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { ApiProblemError } from '../../packages/contracts/openapi/client.js';
import { GeneratedApiClient } from '../../packages/contracts/openapi/generated-client.js';
import { createContractValidator } from '../../packages/contracts/openapi/runtime-validator.js';
import { problemCases, problemFixture, typedMetaCases, requestId } from './problem-fixtures.js';

describe('generated contract client', () => {
  it('calls a named operation with session credentials and validates its generated response contract', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const calls: RequestInit[] = [];
    const client = new GeneratedApiClient({
      fetch: async (_input, init) => {
        calls.push(init ?? {});
        return new Response(JSON.stringify({ csrfToken: 'csrf-token-value', expiresAt: '2026-10-28T05:00:00Z' }), { status: 200, headers: { 'content-type': 'application/json', 'x-request-id': 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', 'cache-control': 'no-store' } });
      },
      validator: createContractValidator(document),
    });
    await expect(client.call('getCsrfToken', {})).resolves.toMatchObject({ data: { csrfToken: 'csrf-token-value' }, status: 200, headers: { 'Cache-Control': 'no-store' } });
    expect(calls[0]).toMatchObject({ method: 'GET', credentials: 'include' });
  });

  it('rejects a malformed generated response without a caller-selected schema', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    let fetchCalls = 0;
    const client = new GeneratedApiClient({
      fetch: async () => {
        fetchCalls += 1;
        return new Response(JSON.stringify({ unexpected: true }), { status: 200, headers: { 'content-type': 'application/json', 'x-request-id': 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', 'cache-control': 'no-store' } });
      },
      validator: createContractValidator(document),
    });

    await expect(client.call('getCsrfToken', {})).rejects.toThrow(/Invalid CsrfToken response/);
    expect(fetchCalls).toBe(1);
  });

  it('validates an operation-specific Problem response by status and media type', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const client = new GeneratedApiClient({
      fetch: async () => new Response(JSON.stringify({ type: 'urn:autoflow:problem:csrf-failed', title: 'CSRF failed', status: 403, code: 'CSRF_FAILED', requestId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', retryable: true, meta: { refreshHref: '/api/v1/auth/csrf' } }), { status: 403, headers: { 'content-type': 'application/problem+json', 'x-request-id': 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2' } }),
      validator: createContractValidator(document),
    });

    await expect(client.call('createSession', { headers: { 'X-CSRF-Token': 'csrf-token-value' }, body: { provider: 'LOCAL_PASSWORD' } })).rejects.toBeInstanceOf(ApiProblemError);
  });

  it('rejects createSession CSRF problems without the required refresh metadata', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    for (const body of [
      { type: 'urn:autoflow:problem:csrf-failed', title: 'CSRF failed', status: 403, code: 'CSRF_FAILED', requestId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', retryable: true },
      { type: 'urn:autoflow:problem:csrf-failed', title: 'CSRF failed', status: 403, code: 'CSRF_FAILED', requestId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', retryable: true, meta: { refreshHref: '/api/v1/auth/other' } },
    ]) {
      const client = new GeneratedApiClient({
        fetch: async () => new Response(JSON.stringify(body), { status: 403, headers: { 'content-type': 'application/problem+json', 'x-request-id': 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2' } }),
        validator: createContractValidator(document),
      });
      await expect(client.call('createSession', { headers: { 'X-CSRF-Token': 'csrf-token-value' }, body: { provider: 'LOCAL_PASSWORD' } })).rejects.toThrow(/Invalid CsrfFailedProblem response/);
    }
  });

  it('rejects an unknown Problem code at the generated client boundary instead of creating ApiProblemError', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const client = new GeneratedApiClient({
      fetch: async () => new Response(JSON.stringify({
        type: 'urn:autoflow:problem:unknown',
        title: 'Unknown problem',
        status: 401,
        code: 'TOTALLY_UNKNOWN',
        requestId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
        retryable: false,
        meta: null,
      }), { status: 401, headers: { 'content-type': 'application/problem+json', 'x-request-id': 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2' } }),
      validator: createContractValidator(document),
    });

    await expect(client.call('createSession', { headers: { 'X-CSRF-Token': 'csrf-token-value' }, body: { provider: 'LOCAL_PASSWORD' } }))
      .rejects.toSatisfy((error: unknown) => error instanceof Error && !(error instanceof ApiProblemError) && /Invalid Problem response/.test(error.message));
  });

  it('accepts a permission problem on a permission-capable mutation', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const client = new GeneratedApiClient({
      fetch: async () => new Response(JSON.stringify({
        type: 'urn:autoflow:problem:permission-denied',
        title: 'Permission denied',
        status: 403,
        code: 'PERMISSION_DENIED',
        requestId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
        retryable: false,
        meta: null,
      }), { status: 403, headers: { 'content-type': 'application/problem+json', 'x-request-id': 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2' } }),
      validator: createContractValidator(document),
    });

    await expect(client.call('createCustomer', {
      headers: { 'X-CSRF-Token': 'csrf-token-value', 'Idempotency-Key': 'permission-key' },
      body: { name: 'Acme', ownerUserId: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' },
    })).rejects.toBeInstanceOf(ApiProblemError);
  });

  it('accepts typed permission and CSRF problems across representative permission-capable operations', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const requestId = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2';
    const csrfProblem = {
      type: 'urn:autoflow:problem:csrf-failed',
      title: 'CSRF failed',
      status: 403,
      code: 'CSRF_FAILED',
      requestId,
      retryable: true,
      meta: { refreshHref: '/api/v1/auth/csrf' },
    };
    const permissionProblem = {
      type: 'urn:autoflow:problem:permission-denied',
      title: 'Permission denied',
      status: 403,
      code: 'PERMISSION_DENIED',
      requestId,
      retryable: false,
      meta: null,
    };
    const cases = [
      { operationId: 'createUser', input: { pathParams: { id: requestId }, headers: { 'X-CSRF-Token': 'csrf-token-value', 'Idempotency-Key': 'permission-user' }, body: { username: 'alice', role: 'USER' } } },
      { operationId: 'createCustomer', input: { headers: { 'X-CSRF-Token': 'csrf-token-value', 'Idempotency-Key': 'permission-customer' }, body: { name: 'Acme', ownerUserId: requestId } } },
      { operationId: 'reverseInventoryOperation', input: { pathParams: { operationId: requestId }, headers: { 'X-CSRF-Token': 'csrf-token-value', 'Idempotency-Key': 'permission-reverse', 'If-Match': '"v1"' }, body: { operationType: 'REVERSAL', lines: [{ skuId: requestId, quantity: '1' }] } } },
      { operationId: 'createDownloadIntent', input: { pathParams: { id: requestId }, headers: { 'X-CSRF-Token': 'csrf-token-value' } } },
    ] as const;

    for (const testCase of cases) {
      for (const problem of [csrfProblem, permissionProblem]) {
        const client = new GeneratedApiClient({
          fetch: async () => new Response(JSON.stringify(problem), { status: 403, headers: { 'content-type': 'application/problem+json', 'x-request-id': requestId } }),
          validator: createContractValidator(document),
        });
        await expect(client.call(testCase.operationId, testCase.input as never)).rejects.toMatchObject({ name: 'ApiProblemError', status: 403, problem: { code: problem.code } });
      }
    }
  });

  it('rejects a permission problem whose status does not match the HTTP response on every representative operation', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const requestId = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2';
    const cases = [
      { operationId: 'createUser', input: { pathParams: { id: requestId }, headers: { 'X-CSRF-Token': 'csrf-token-value', 'Idempotency-Key': 'mismatch-user' }, body: { username: 'alice', role: 'USER' } } },
      { operationId: 'createCustomer', input: { headers: { 'X-CSRF-Token': 'csrf-token-value', 'Idempotency-Key': 'mismatch-customer' }, body: { name: 'Acme', ownerUserId: requestId } } },
      { operationId: 'reverseInventoryOperation', input: { pathParams: { operationId: requestId }, headers: { 'X-CSRF-Token': 'csrf-token-value', 'Idempotency-Key': 'mismatch-reverse', 'If-Match': '"v1"' }, body: { operationType: 'REVERSAL', lines: [{ skuId: requestId, quantity: '1' }] } } },
      { operationId: 'createDownloadIntent', input: { pathParams: { id: requestId }, headers: { 'X-CSRF-Token': 'csrf-token-value' } } },
    ] as const;
    for (const testCase of cases) {
      const client = new GeneratedApiClient({
        fetch: async () => new Response(JSON.stringify({ type: 'urn:autoflow:problem:permission-denied', title: 'Permission denied', status: 401, code: 'PERMISSION_DENIED', requestId, retryable: false, meta: null }), { status: 403, headers: { 'content-type': 'application/problem+json', 'x-request-id': requestId } }),
        validator: createContractValidator(document),
      });
      await expect(client.call(testCase.operationId, testCase.input as never)).rejects.toThrow(/status does not match/);
    }
  });

  it('exposes a declared dependency failure as a typed Problem instead of an undeclared-status error', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const client = new GeneratedApiClient({
      fetch: async () => new Response(JSON.stringify({ type: 'urn:autoflow:problem:dependency-unavailable', title: 'Dependency unavailable', status: 503, code: 'DEPENDENCY_UNAVAILABLE', requestId: 'f8b6e3a9-3a0a-4c1c-b3f3-8a8225e7f019', retryable: true }), { status: 503, headers: { 'content-type': 'application/problem+json', 'x-request-id': 'f8b6e3a9-3a0a-4c1c-b3f3-8a8225e7f019' } }),
      validator: createContractValidator(document),
    });

    await expect(client.call('createSession', { headers: { 'X-CSRF-Token': 'csrf-token-value' }, body: { provider: 'LOCAL_PASSWORD' } })).rejects.toBeInstanceOf(ApiProblemError);
  });

  it('preserves a terminal replay marker and resource headers in the typed response envelope', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const client = new GeneratedApiClient({
      fetch: async () => new Response(JSON.stringify({
        id: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
        organizationId: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019',
        version: 1,
        createdAt: '2026-10-28T05:00:00Z',
        updatedAt: '2026-10-28T05:00:00Z',
        name: 'Widget',
        productCode: 'WIDGET-001',
        unit: 'piece',
        status: 'ACTIVE',
      }), { status: 201, headers: {
        'content-type': 'application/json',
        'x-request-id': 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
        etag: '"v1"',
        location: '/api/v1/products/f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
        'idempotent-replay': 'true',
      } }),
      validator: createContractValidator(document),
    });

    await expect(client.call('createProduct', {
      headers: { 'X-CSRF-Token': 'csrf-token-value', 'Idempotency-Key': 'replay-key' },
      body: { name: 'Widget', productCode: 'WIDGET-001', unit: 'piece' },
    })).resolves.toMatchObject({
      status: 201,
      headers: {
        ETag: '"v1"',
        Location: '/api/v1/products/f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
        'Idempotent-Replay': 'true',
      },
    });
  });

  it('rejects an unexpected media type on a 204 response', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const client = new GeneratedApiClient({
      fetch: async () => new Response(null, { status: 204, headers: { 'content-type': 'application/json' } }),
      validator: createContractValidator(document),
    });

    await expect(client.call('deleteCurrentSession', { headers: { 'X-CSRF-Token': 'csrf-token-value' } })).rejects.toThrow(/unexpected response content type/i);
  });

  it('exposes the typed Retry-After header on a rate-limit Problem', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const client = new GeneratedApiClient({
      fetch: async () => new Response(JSON.stringify({ type: 'urn:autoflow:problem:rate-limited', title: 'Rate limited', status: 429, code: 'RATE_LIMITED', requestId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', retryable: true, meta: null }), { status: 429, headers: { 'content-type': 'application/problem+json', 'x-request-id': 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', 'retry-after': '60' } }),
      validator: createContractValidator(document),
    });

    await expect(client.call('listProducts', {})).rejects.toMatchObject({
      name: 'ApiProblemError',
      status: 429,
      headers: { 'X-Request-ID': 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', 'Retry-After': '60' },
    });
  });

  it('rejects invalid path, body, and required safety headers before fetch', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    let fetchCalls = 0;
    const client = new GeneratedApiClient({
      fetch: async () => {
        fetchCalls += 1;
        return new Response('{}', { status: 201, headers: { 'content-type': 'application/json' } });
      },
      validator: createContractValidator(document),
    });

    await expect(client.call('createDocument', {
      pathParams: { orderId: 'not-a-uuid' },
      body: {} as never,
    } as never)).rejects.toThrow(/Invalid path parameter|Missing required header|Invalid DocumentCreateRequest/);
    expect(fetchCalls).toBe(0);
  });

  it('rejects query values outside the frozen page contract before fetch', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    let fetchCalls = 0;
    const client = new GeneratedApiClient({
      fetch: async () => {
        fetchCalls += 1;
        return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
      },
      validator: createContractValidator(document),
    });

    await expect(client.call('listProducts', { query: { 'page[size]': 101 } })).rejects.toThrow(/Invalid query parameter/);
    expect(fetchCalls).toBe(0);
  });

  it('transports every declared Problem v1 status/code combination through the generated client', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const transportCases = problemCases.flatMap((testCase) => testCase.statuses.filter((status) => status !== 422).map((status) => ({ testCase, status })));
    expect(transportCases).toHaveLength(32);

    for (const { testCase, status } of transportCases) {
      const operationId = status === 404 ? 'getCustomer' : status === 413 || status === 415 ? 'createUploadIntent' : 'createCustomer';
      const input = operationId === 'getCustomer'
        ? { pathParams: { id: requestId } }
        : operationId === 'createUploadIntent'
          ? { headers: { 'X-CSRF-Token': 'csrf-token-value', 'Idempotency-Key': `transport-${testCase.code}` }, body: { fileName: 'invoice.pdf', contentType: 'application/pdf', sizeBytes: 128 } }
          : { headers: { 'X-CSRF-Token': 'csrf-token-value', 'Idempotency-Key': `transport-${testCase.code}` }, body: { name: 'Acme', ownerUserId: requestId } };
      const responseHeaders: Record<string, string> = { 'content-type': 'application/problem+json', 'x-request-id': requestId };
      if (status === 429) responseHeaders['retry-after'] = '60';
      const client = new GeneratedApiClient({
        fetch: async () => new Response(JSON.stringify(problemFixture(testCase, status)), { status, headers: responseHeaders }),
        validator: createContractValidator(document),
      });
      await expect(client.call(operationId, input as never), `${testCase.code} ${status}`).rejects.toMatchObject({ name: 'ApiProblemError', status, problem: { code: testCase.code, status } });
    }
  });

  it('rejects declared Problem transport mismatches and malformed typed metadata before ApiProblemError', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const transportCases = problemCases.flatMap((testCase) => testCase.statuses.filter((status) => status !== 422).map((status) => ({ testCase, status })));
    for (const { testCase, status } of transportCases) {
      const operationId = status === 404 ? 'getCustomer' : status === 413 || status === 415 ? 'createUploadIntent' : 'createCustomer';
      const input = operationId === 'getCustomer'
        ? { pathParams: { id: requestId } }
        : operationId === 'createUploadIntent'
          ? { headers: { 'X-CSRF-Token': 'csrf-token-value', 'Idempotency-Key': `mismatch-${testCase.code}` }, body: { fileName: 'invoice.pdf', contentType: 'application/pdf', sizeBytes: 128 } }
          : { headers: { 'X-CSRF-Token': 'csrf-token-value', 'Idempotency-Key': `mismatch-${testCase.code}` }, body: { name: 'Acme', ownerUserId: requestId } };
      const wrongStatus = status === 400 ? 409 : 400;
      const client = new GeneratedApiClient({
        fetch: async () => new Response(JSON.stringify(problemFixture(testCase, wrongStatus)), { status, headers: { 'content-type': 'application/problem+json', 'x-request-id': requestId, ...(status === 429 ? { 'retry-after': '60' } : {}) } }),
        validator: createContractValidator(document),
      });
      await expect(client.call(operationId, input as never), `${testCase.code} ${status}`).rejects.toThrow(/status does not match/);
    }

    for (const testCase of problemCases.filter((candidate) => typedMetaCases.has(candidate.code))) {
      const status = testCase.statuses[0]!;
      if (status === 422) continue;
      const operationId = status === 413 || status === 415 ? 'createUploadIntent' : 'createCustomer';
      const input = operationId === 'createUploadIntent'
        ? { headers: { 'X-CSRF-Token': 'csrf-token-value', 'Idempotency-Key': `meta-${testCase.code}` }, body: { fileName: 'invoice.pdf', contentType: 'application/pdf', sizeBytes: 128 } }
        : { headers: { 'X-CSRF-Token': 'csrf-token-value', 'Idempotency-Key': `meta-${testCase.code}` }, body: { name: 'Acme', ownerUserId: requestId } };
      const client = new GeneratedApiClient({
        fetch: async () => new Response(JSON.stringify(problemFixture(testCase, status, { meta: undefined })), { status, headers: { 'content-type': 'application/problem+json', 'x-request-id': requestId } }),
        validator: createContractValidator(document),
      });
      await expect(client.call(operationId, input as never), `${testCase.code} missing meta`).rejects.toThrow(/Invalid .* response/);
    }

    const unknown = new GeneratedApiClient({
      fetch: async () => new Response(JSON.stringify(problemFixture(problemCases[0]!, 400, { code: 'TOTALLY_UNKNOWN' })), { status: 400, headers: { 'content-type': 'application/problem+json', 'x-request-id': requestId } }),
      validator: createContractValidator(document),
    });
    await expect(unknown.call('createCustomer', { headers: { 'X-CSRF-Token': 'csrf-token-value', 'Idempotency-Key': 'unknown-problem' }, body: { name: 'Acme', ownerUserId: requestId } })).rejects.toSatisfy((error: unknown) => error instanceof Error && !(error instanceof ApiProblemError) && /Invalid Problem response/.test(error.message));

    const undeclared = new GeneratedApiClient({
      fetch: async () => new Response(JSON.stringify(problemFixture(problemCases.find((candidate) => candidate.code === 'VALIDATION_FAILED')!, 422)), { status: 422, headers: { 'content-type': 'application/problem+json', 'x-request-id': requestId } }),
      validator: createContractValidator(document),
    });
    await expect(undeclared.call('createUploadIntent', { headers: { 'X-CSRF-Token': 'csrf-token-value', 'Idempotency-Key': 'undeclared-problem' }, body: { fileName: 'invoice.pdf', contentType: 'application/pdf', sizeBytes: 128 } })).rejects.toThrow(/Unexpected HTTP 422/);
  });
});
