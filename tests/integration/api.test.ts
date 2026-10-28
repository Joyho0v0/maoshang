import { createApp } from '../../apps/api/src/main.js';

describe('Fastify API entry point', () => {
  it('serves a no-store session-bound CSRF bootstrap response', async () => {
    const app = await createApp({ config: { nodeEnv: 'test', databaseUrl: 'postgres://localhost/test', sessionSecret: 's'.repeat(32) } });
    await app.init();
    try {
      const response = await app.getHttpAdapter().getInstance().inject({ method: 'GET', url: '/api/v1/auth/csrf' });
      expect(response.statusCode).toBe(200);
      expect(response.headers['cache-control']).toBe('no-store');
      expect(response.json()).toEqual(expect.objectContaining({ csrfToken: expect.any(String), expiresAt: expect.any(String) }));
      const secondClient = await app.getHttpAdapter().getInstance().inject({ method: 'GET', url: '/api/v1/auth/csrf' });
      expect(secondClient.headers['set-cookie']).toBeDefined();
      expect(secondClient.json().csrfToken).not.toBe(response.json().csrfToken);
    } finally {
      await app.close();
    }
  });

  it('fails closed on command status lookup without an authenticated principal', async () => {
    const app = await createApp({ config: { nodeEnv: 'test', databaseUrl: 'postgres://localhost/test', sessionSecret: 's'.repeat(32) } });
    await app.init();
    try {
      const response = await app.getHttpAdapter().getInstance().inject({ method: 'GET', url: '/api/v1/commands/status', headers: { 'idempotency-key': 'key-1', 'x-command-operation': 'reviewPayment' } });
      expect(response.statusCode).toBe(401);
      expect(response.headers['content-type']).toContain('application/problem+json');
      expect(response.headers['cache-control']).toBe('no-store');
      expect(response.json()).toMatchObject({ code: 'AUTHENTICATION_REQUIRED', status: 401 });
    } finally {
      await app.close();
    }
  });

  it('maps unknown routes and framework exceptions to RFC 9457 problems', async () => {
    const app = await createApp({ config: { nodeEnv: 'test', databaseUrl: 'postgres://localhost/test', sessionSecret: 's'.repeat(32) } });
    await app.init();
    try {
      const response = await app.getHttpAdapter().getInstance().inject({ method: 'GET', url: '/api/v1/does-not-exist' });
      expect(response.statusCode).toBe(404);
      expect(response.headers['content-type']).toContain('application/problem+json');
      expect(response.json()).toMatchObject({ code: 'RESOURCE_NOT_FOUND', status: 404 });
      expect(response.json()).not.toHaveProperty('stack');
      expect(response.json().type).toMatch(/^urn:/);
    } finally {
      await app.close();
    }
  });

  it('fails closed before listening when runtime configuration is absent', async () => {
    await expect(createApp({ env: { NODE_ENV: 'test' } })).rejects.toThrow(/DATABASE_URL/);
  });

  it('runs the real safety guard before an unsafe controller can execute', async () => {
    const app = await createApp({ config: { nodeEnv: 'test', databaseUrl: 'postgres://localhost/test', sessionSecret: 's'.repeat(32) } });
    await app.init();
    try {
      const response = await app.getHttpAdapter().getInstance().inject({ method: 'POST', url: '/api/v1/auth/sessions', payload: { provider: 'LOCAL_PASSWORD' } });
      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({ code: 'CSRF_FAILED', status: 403 });
      expect(response.json().meta).toEqual({ refreshHref: '/api/v1/auth/csrf' });
    } finally {
      await app.close();
    }
  });

  it('rejects an invalid session DTO after CSRF and before the controller', async () => {
    const app = await createApp({ config: { nodeEnv: 'test', databaseUrl: 'postgres://localhost/test', sessionSecret: 's'.repeat(32) } });
    await app.init();
    try {
      const csrfResponse = await app.getHttpAdapter().getInstance().inject({ method: 'GET', url: '/api/v1/auth/csrf' });
      const csrfToken = csrfResponse.json().csrfToken as string;
      const cookie = csrfResponse.headers['set-cookie'];
      const response = await app.getHttpAdapter().getInstance().inject({
        method: 'POST',
        url: '/api/v1/auth/sessions',
        headers: { 'x-csrf-token': csrfToken, cookie: Array.isArray(cookie) ? cookie[0] : cookie },
        payload: { provider: 'NOT_ALLOWED', unexpected: true },
      });
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ code: 'VALIDATION_FAILED', status: 400 });
    } finally {
      await app.close();
    }
  });
});
