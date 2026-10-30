import { createContractAdapter, createMockContractAdapter } from './contract-adapter';

describe('contract adapter seam', () => {
  it('delegates the stable seam without importing generated client code', async () => {
    const request = vi.fn(async () => ({ status: 200, data: { ok: true }, headers: {} }));
    const adapter = createContractAdapter({
      bootstrap: async () => ({ authenticated: false }),
      login: async () => ({
        user: { id: '1', organizationId: 'org-1', displayName: 'Sales', role: 'sales' },
        identity: {
          userId: '1',
          organizationId: 'org-1',
          capabilities: [],
          scopeSummary: {},
        },
        csrfToken: 'csrf',
      }),
      logout: async () => undefined,
      rotateCsrf: async () => ({ csrfToken: 'next-csrf' }),
      request,
    });

    await expect(
      adapter.request({ method: 'GET', href: '/api/v1/customers' }, new AbortController().signal),
    ).resolves.toEqual({ status: 200, data: { ok: true }, headers: {} });
    expect(request).toHaveBeenCalledOnce();
  });

  it('ships a clearly temporary in-memory fixture for the shell only', async () => {
    const adapter = createMockContractAdapter();
    const bootstrap = await adapter.bootstrap();

    expect(bootstrap.authenticated).toBe(false);
    await expect(
      adapter.request({ method: 'GET', href: '/api/v1/health' }, new AbortController().signal),
    ).resolves.toMatchObject({ status: 200 });
  });
});
