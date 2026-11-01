import { RequestSafetyGuard } from '../../apps/api/src/common/security/request-safety.guard.js';
import { CsrfService } from '../../apps/api/src/modules/auth/csrf/csrf.service.js';
import { createContractValidator } from '../../packages/contracts/openapi/runtime-validator.js';
import { parse } from 'yaml';
import { readFile } from 'node:fs/promises';

function context(request: Record<string, unknown>) {
  return { switchToHttp: () => ({ getRequest: () => request }) } as never;
}

describe('request safety guard operation coverage', () => {
  it('validates safe-operation path and query input before a controller runs', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const guard = new RequestSafetyGuard(new CsrfService(), createContractValidator(document));
    await expect(guard.canActivate(context({
      method: 'GET',
      url: '/api/v1/products/not-a-uuid?page%5Bsize%5D=101',
      routeOptions: { url: '/api/v1/products/:id' },
      params: { id: 'not-a-uuid' },
      query: { 'page[size]': 101 },
      headers: {},
      user: { id: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', organizationId: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' },
    }))).rejects.toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
  });

  it('does not claim idempotency in a guard that cannot own the business transaction', async () => {
    const csrf = new CsrfService();
    const sessionId = 'session-1';
    const csrfToken = csrf.bootstrap(`session:${sessionId}`).csrfToken;
    const guard = new RequestSafetyGuard(csrf, createContractValidator(parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>));
    await expect(guard.canActivate(context({
      method: 'POST',
      url: '/api/v1/customers',
      routeOptions: { url: '/api/v1/customers' },
      params: {},
      query: {},
      headers: { 'x-csrf-token': csrfToken, 'idempotency-key': 'key-1' },
      body: { name: 'Acme', ownerUserId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2' },
      user: { id: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', organizationId: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' },
      cookies: { session_id: sessionId },
    }))).resolves.toBe(true);
  });
});
