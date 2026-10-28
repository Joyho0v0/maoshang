import { createApp } from '../../apps/api/src/main.js';

describe('Fastify API entry point', () => {
  it('serves a no-store session-bound CSRF bootstrap response', async () => {
    const app = await createApp();
    await app.init();
    try {
      const response = await app.getHttpAdapter().getInstance().inject({ method: 'GET', url: '/api/v1/auth/csrf' });
      expect(response.statusCode).toBe(200);
      expect(response.headers['cache-control']).toBe('no-store');
      expect(response.json()).toEqual(expect.objectContaining({ csrfToken: expect.any(String), expiresAt: expect.any(String) }));
    } finally {
      await app.close();
    }
  });

  it('fails closed on command status lookup without an authenticated principal', async () => {
    const app = await createApp();
    await app.init();
    try {
      const response = await app.getHttpAdapter().getInstance().inject({ method: 'GET', url: '/api/v1/commands/status', headers: { 'idempotency-key': 'key-1', 'x-command-operation': 'reviewPayment' } });
      expect(response.statusCode).toBe(401);
      expect(response.headers['content-type']).toContain('application/problem+json');
      expect(response.json()).toMatchObject({ code: 'AUTHENTICATION_REQUIRED', status: 401 });
    } finally {
      await app.close();
    }
  });
});
