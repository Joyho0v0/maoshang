import { createGeneratedContractAdapter } from './contract-adapter';

function jsonResponse(status: number, body: unknown, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

describe('generated contract adapter', () => {
  it('uses the frozen generated client for CSRF bootstrap and login', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { csrfToken: 'c'.repeat(32), expiresAt: '2030-01-01T00:00:00.000Z' }, {
          'X-Request-ID': 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
          'Cache-Control': 'no-store',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(201, {
          user: {
            id: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
            version: 1,
            href: '/api/v1/users/f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
            data: { resourceType: 'USER', name: 'Sales User', role: 'sales' },
          },
          capabilities: [],
          scopeSummary: {},
          csrfToken: 'd'.repeat(32),
          sessionEpoch: 1,
        }, {
          'X-Request-ID': 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
          'Cache-Control': 'no-store',
        }),
      );
    const adapter = createGeneratedContractAdapter({ fetch: fetcher });

    const credentials = await adapter.login({ email: 'sales@example.test', password: 'password' });

    expect(credentials.user).toEqual({
      id: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
      displayName: 'Sales User',
      role: 'sales',
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1]?.[1]).toMatchObject({
      method: 'POST',
      credentials: 'include',
    });
    expect(new Headers(fetcher.mock.calls[1]?.[1]?.headers).get('X-CSRF-Token')).toBe('c'.repeat(32));
  });

  it('maps typed problem responses and keeps required response metadata fail-closed', async () => {
    const problem = {
      type: 'urn:autoflow:problem:csrf-failed',
      title: 'CSRF failed',
      status: 403,
      code: 'CSRF_FAILED',
      requestId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
      retryable: true,
      meta: { refreshHref: '/api/v1/auth/csrf' },
    };
    const adapter = createGeneratedContractAdapter({
      fetch: vi.fn().mockResolvedValue(
        new Response(JSON.stringify(problem), {
          status: 403,
          headers: {
            'content-type': 'application/problem+json',
            'X-Request-ID': problem.requestId,
          },
        }),
      ),
    });

    await expect(adapter.request({
      method: 'POST',
      href: '/api/v1/auth/sessions',
      headers: { 'X-CSRF-Token': 'c'.repeat(32) },
      body: { provider: 'LOCAL_PASSWORD' },
    }, new AbortController().signal))
      .rejects.toMatchObject({ status: 403, problem });
  });
});
