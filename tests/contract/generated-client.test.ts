import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { GeneratedApiClient } from '../../packages/contracts/openapi/generated-client.js';
import { createContractValidator } from '../../packages/contracts/openapi/runtime-validator.js';

describe('generated contract client', () => {
  it('calls a named operation with session credentials and validates its response schema', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const calls: RequestInit[] = [];
    const client = new GeneratedApiClient({
      fetch: async (_input, init) => {
        calls.push(init ?? {});
        return new Response(JSON.stringify({ csrfToken: 'csrf-token-value', expiresAt: '2026-10-28T05:00:00Z' }), { status: 200, headers: { 'content-type': 'application/json' } });
      },
      validator: createContractValidator(document),
    });
    await expect(client.call('getCsrfToken', { responseSchema: 'CsrfToken' })).resolves.toMatchObject({ csrfToken: 'csrf-token-value' });
    expect(calls[0]).toMatchObject({ method: 'GET', credentials: 'include' });
  });
});
