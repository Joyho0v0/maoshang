import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { firstValueFrom, of } from 'rxjs';
import { ContractResponseValidationInterceptor } from '../../apps/api/src/common/http/contract-response.interceptor.js';
import { createContractValidator } from '../../packages/contracts/openapi/runtime-validator.js';

function executionContext(headers: Record<string, string>, responseHeaders: Record<string, string>, options: { method?: string; url?: string; statusCode?: number } = {}) {
  const request = {
    method: options.method ?? 'GET',
    url: options.url ?? '/api/v1/auth/csrf',
    routeOptions: { url: options.url ?? '/api/v1/auth/csrf' },
    headers,
  };
  const response = {
    statusCode: options.statusCode ?? 200,
    getHeader: (name: string) => responseHeaders[name],
  };
  return { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) } as never;
}

describe('contract response interceptor', () => {
  it('rejects a success response with an unsafe Cache-Control value', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const interceptor = new ContractResponseValidationInterceptor(createContractValidator(document));
    const next = { handle: () => of({ csrfToken: 'csrf-token-value', expiresAt: '2026-10-28T00:00:00.000Z' }) };

    await expect(firstValueFrom(interceptor.intercept(executionContext({}, { 'content-type': 'application/json', 'Cache-Control': 'public, max-age=86400' }), next))).rejects.toMatchObject({ name: 'ProblemError', status: 500 });
  });

  it('rejects a success response with the wrong content type', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const interceptor = new ContractResponseValidationInterceptor(createContractValidator(document));
    const next = { handle: () => of({ csrfToken: 'csrf-token-value', expiresAt: '2026-10-28T00:00:00.000Z' }) };

    await expect(firstValueFrom(interceptor.intercept(executionContext({}, { 'content-type': 'application/problem+json', 'Cache-Control': 'no-store' }), next))).rejects.toMatchObject({ name: 'ProblemError', status: 500 });
  });

  it('rejects a 204 response that carries a body or media type', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const interceptor = new ContractResponseValidationInterceptor(createContractValidator(document));
    const next = { handle: () => of({ unexpected: true }) };

    await expect(firstValueFrom(interceptor.intercept(executionContext({}, { 'content-type': 'application/json' }, { method: 'DELETE', url: '/api/v1/auth/sessions/current', statusCode: 204 }), next))).rejects.toMatchObject({ name: 'ProblemError', status: 500 });
  });
});
