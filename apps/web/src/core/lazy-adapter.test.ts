import { createLazyGeneratedContractAdapter } from './lazy-adapter';

describe('lazy generated adapter', () => {
  it('loads the generated production adapter on first API use', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ csrfToken: 'c'.repeat(32), expiresAt: '2030-01-01T00:00:00.000Z' }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'X-Request-ID': 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
          'Cache-Control': 'no-store',
        },
      }),
    );
    const adapter = createLazyGeneratedContractAdapter({ fetch: fetcher });

    await expect(adapter.rotateCsrf()).resolves.toEqual({ csrfToken: 'c'.repeat(32) });
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
