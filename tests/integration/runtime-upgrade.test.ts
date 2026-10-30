import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { createApp } from '../../apps/api/src/main.js';
import { GeneratedApiClient } from '../../packages/contracts/openapi/generated-client.js';
import { createContractValidator } from '../../packages/contracts/openapi/runtime-validator.js';

const runtimeConfig = {
  nodeEnv: 'test' as const,
  databaseUrl: 'postgres://localhost/test',
  sessionSecret: 's'.repeat(32),
};

describe('Nest 12 and Fastify 5 runtime regressions', () => {
  it('keeps GET/HEAD and absolute-form targets stable while rejecting malformed path forms', async () => {
    const app = await createApp({ config: runtimeConfig });
    await app.init();
    try {
      const get = await app.getHttpAdapter().getInstance().inject({ method: 'GET', url: '/api/v1/auth/csrf' });
      expect(get.statusCode).toBe(200);

      const head = await app.getHttpAdapter().getInstance().inject({ method: 'HEAD', url: '/api/v1/auth/csrf' });
      expect(head.statusCode).toBe(200);
      expect(head.body).toBe('');

      const absoluteForm = await app.getHttpAdapter().getInstance().inject({ method: 'GET', url: 'http://example.test/api/v1/auth/csrf' });
      expect(absoluteForm.statusCode).toBe(200);

      const trailingSlash = await app.getHttpAdapter().getInstance().inject({ method: 'GET', url: '/api/v1/auth/csrf/' });
      expect(trailingSlash.statusCode).toBe(404);
      const duplicateSlash = await app.getHttpAdapter().getInstance().inject({ method: 'GET', url: '/api/v1//auth/csrf' });
      expect(duplicateSlash.statusCode).toBe(404);
      const malformedTarget = await app.getHttpAdapter().getInstance().inject({ method: 'GET', url: '/api/v1/auth/csrf/%ZZ' });
      expect(malformedTarget.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });

  it('keeps cookie parsing ahead of CSRF validation with a tab-prefixed Content-Type', async () => {
    const app = await createApp({ config: runtimeConfig });
    await app.init();
    try {
      const csrf = await app.getHttpAdapter().getInstance().inject({ method: 'GET', url: '/api/v1/auth/csrf' });
      const cookie = Array.isArray(csrf.headers['set-cookie']) ? csrf.headers['set-cookie'][0] : csrf.headers['set-cookie'];
      const response = await app.getHttpAdapter().getInstance().inject({
        method: 'POST',
        url: '/api/v1/auth/sessions',
        headers: {
          'content-type': '\tapplication/json',
          'x-csrf-token': csrf.json().csrfToken,
          cookie,
        },
        payload: { provider: 'NOT_ALLOWED' },
      });
      expect(response.statusCode).toBe(400);
      expect(response.headers['content-type']).toContain('application/problem+json');
      expect(response.json()).toMatchObject({ code: 'VALIDATION_FAILED', status: 400 });
    } finally {
      await app.close();
    }
  });

  it('preserves absolute-host query serialization and negative-offset date-time validation', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const validator = createContractValidator(document, { now: () => new Date('2026-10-30T12:00:00Z') });
    let requested = '';
    const client = new GeneratedApiClient({
      baseUrl: 'https://example.test/api/v1',
      validator,
      fetch: async (input) => {
        requested = String(input);
        return new Response(JSON.stringify({ data: [], page: { nextCursor: null, hasNext: false } }), {
          status: 200,
          headers: { 'content-type': 'application/json', 'x-request-id': 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', 'cache-control': 'no-store' },
        });
      },
    });

    await client.call('listProducts', { query: { 'filter[status]': ['ACTIVE', 'INACTIVE'] } });
    expect(requested).toContain('https://example.test/api/v1/products?');
    expect(requested).toContain('sort=-updatedAt%2C-id');
    expect(requested.match(/filter%5Bstatus%5D=/g)).toHaveLength(2);

    const fileId = '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019';
    const intent = {
      file: {
        id: fileId,
        href: `/api/v1/files/${fileId}`,
        organizationId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
        version: 1,
        createdAt: '2026-10-28T05:00:00Z',
        updatedAt: '2026-10-28T05:00:00Z',
        fileName: 'invoice.pdf',
        contentType: 'application/pdf',
        sizeBytes: 128,
        status: 'PENDING_UPLOAD',
      },
      href: `/api/v1/files/${fileId}`,
      transfer: {
        kind: 'HTTP_PUT',
        method: 'PUT',
        locator: 'https://uploads.example.test/signed-put?token=opaque',
        expiresAt: '2026-10-30T08:00:00-05:00',
        headers: { 'Content-Type': 'application/pdf' },
      },
    };
    expect(validator.validate('UploadIntent', intent)).toBe(true);
    expect(validator.validate('UploadIntent', {
      ...intent,
      transfer: { ...intent.transfer, expiresAt: '2026-10-30T06:00:00-05:00' },
    })).toBe(false);
  });
});
