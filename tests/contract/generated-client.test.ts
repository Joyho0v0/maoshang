import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { GeneratedApiClient } from '../../packages/contracts/openapi/generated-client.js';
import { createContractValidator } from '../../packages/contracts/openapi/runtime-validator.js';

describe('generated contract client', () => {
  it('calls a named operation with session credentials and validates its generated response contract', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const calls: RequestInit[] = [];
    const client = new GeneratedApiClient({
      fetch: async (_input, init) => {
        calls.push(init ?? {});
        return new Response(JSON.stringify({ csrfToken: 'csrf-token-value', expiresAt: '2026-10-28T05:00:00Z' }), { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
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
        return new Response(JSON.stringify({ unexpected: true }), { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
      },
      validator: createContractValidator(document),
    });

    await expect(client.call('getCsrfToken', {})).rejects.toThrow(/Invalid CsrfToken response/);
    expect(fetchCalls).toBe(1);
  });

  it('validates an operation-specific Problem response by status and media type', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const client = new GeneratedApiClient({
      fetch: async () => new Response(JSON.stringify({ type: 'urn:autoflow:problem:csrf-failed', title: 'CSRF failed', status: 403, code: 'CSRF_FAILED', requestId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', retryable: true }), { status: 403, headers: { 'content-type': 'application/problem+json' } }),
      validator: createContractValidator(document),
    });

    await expect(client.call('createSession', { headers: { 'X-CSRF-Token': 'csrf-token-value' }, body: { provider: 'LOCAL_PASSWORD' } })).rejects.toThrow(/Invalid CsrfFailedProblem response/);
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
});
