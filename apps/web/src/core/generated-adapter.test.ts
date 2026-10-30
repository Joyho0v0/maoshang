import { createGeneratedContractAdapter, createTransferExecutor } from './contract-adapter';

function jsonResponse(status: number, body: unknown, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function problemResponse(status: number, code: string, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({
    type: `urn:autoflow:problem:${code.toLowerCase()}`,
    title: code,
    status,
    code,
    requestId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
    retryable: status === 429 || status >= 500,
    meta: null,
  }), {
    status,
    headers: { 'content-type': 'application/problem+json', 'X-Request-ID': 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', ...headers },
  });
}

describe('generated contract adapter', () => {
  it('exposes the frozen generated TransferExecutor for validated intent transfers', () => {
    const executor = createTransferExecutor({ fetch: vi.fn() });

    expect(executor).toBeInstanceOf(Object);
    expect(typeof executor.upload).toBe('function');
    expect(typeof executor.download).toBe('function');
  });

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
            data: { resourceType: 'USER', name: 'Sales User', role: 'sales', organizationId: 'fixture-org' },
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
      organizationId: 'fixture-org',
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

  it('preserves the frozen session identity context and capability scope', async () => {
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
            data: {
              resourceType: 'USER',
              name: 'Sales User',
              role: 'sales',
              organizationId: '11111111-1111-4111-8111-111111111111',
            },
          },
          capabilities: ['product.read', 'order.create'],
          scopeSummary: { organizationId: '11111111-1111-4111-8111-111111111111', region: 'CN' },
          csrfToken: 'd'.repeat(32),
          authzVersion: 7,
          sessionEpoch: 3,
        }, {
          'X-Request-ID': 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
          'Cache-Control': 'no-store',
        }),
      );
    const adapter = createGeneratedContractAdapter({ fetch: fetcher });

    const credentials = await adapter.login({ email: 'sales@example.test', password: 'password' });

    expect(credentials.identity).toEqual({
      userId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
      organizationId: '11111111-1111-4111-8111-111111111111',
      capabilities: ['product.read', 'order.create'],
      scopeSummary: { organizationId: '11111111-1111-4111-8111-111111111111', region: 'CN' },
      authzVersion: 7,
      serverSessionEpoch: 3,
    });
  });

  it('coerces typed query parameters and rejects an operation identity mismatch', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse(200, { data: [], page: { nextCursor: null, hasNext: false } }, {
        'X-Request-ID': 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
      }),
    );
    const adapter = createGeneratedContractAdapter({ fetch: fetcher });

    await adapter.request({
      method: 'GET',
      href: '/api/v1/products?page[size]=20&filter[status]=ACTIVE&filter[status]=DRAFT',
      operationId: 'listProducts',
    }, new AbortController().signal);

    expect(fetcher).toHaveBeenCalledOnce();
    expect(String(fetcher.mock.calls[0]?.[0])).toContain('page%5Bsize%5D=20');
    expect(String(fetcher.mock.calls[0]?.[0])).toContain('filter%5Bstatus%5D=ACTIVE');
    expect(String(fetcher.mock.calls[0]?.[0])).toContain('filter%5Bstatus%5D=DRAFT');

    await expect(adapter.request({
      method: 'GET',
      href: '/api/v1/auth/csrf',
      operationId: 'deleteCurrentSession',
    }, new AbortController().signal)).rejects.toThrow('does not match');
  });

  it('fails closed before fetch for an invalid typed query and an unknown query key', async () => {
    const fetcher = vi.fn();
    const adapter = createGeneratedContractAdapter({ fetch: fetcher });

    await expect(adapter.request({
      method: 'GET',
      href: '/api/v1/products?page[size]=not-an-integer',
      operationId: 'listProducts',
    }, new AbortController().signal)).rejects.toThrow('Invalid integer query parameter');
    await expect(adapter.request({
      method: 'GET',
      href: '/api/v1/products?unknown=value',
      operationId: 'listProducts',
    }, new AbortController().signal)).rejects.toThrow('Unknown query parameter');
    await expect(adapter.request({
      method: 'GET',
      href: '/api/v1/products?page[size]=20&page[size]=21',
      operationId: 'listProducts',
    }, new AbortController().signal)).rejects.toThrow('Repeated scalar query parameter');
    expect(fetcher).not.toHaveBeenCalled();
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

  it('keeps the generated error matrix and required retry metadata fail-closed at the adapter seam', async () => {
    const fetcher = vi.fn();
    const adapter = createGeneratedContractAdapter({ fetch: fetcher });
    const productId = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2';
    const readFailures = [
      [401, 'AUTHENTICATION_REQUIRED', {}],
      [404, 'RESOURCE_NOT_FOUND', {}],
      [429, 'RATE_LIMITED', { 'Retry-After': '1' }],
      [502, 'DEPENDENCY_FAILURE', {}],
      [503, 'DEPENDENCY_UNAVAILABLE', {}],
    ] as const;

    for (const [status, code, headers] of readFailures) {
      fetcher.mockResolvedValueOnce(problemResponse(status, code, headers));
      await expect(adapter.request({
        method: 'GET',
        href: `/api/v1/products/${productId}`,
        operationId: 'getProduct',
      }, new AbortController().signal)).rejects.toMatchObject({ status, problem: { status, code } });
    }

    for (const [status, code] of [[403, 'PERMISSION_DENIED'], [409, 'DUPLICATE_BUSINESS_KEY'], [428, 'PRECONDITION_REQUIRED']] as const) {
      fetcher.mockResolvedValueOnce(problemResponse(status, code));
      await expect(adapter.request({
        method: 'PATCH',
        href: `/api/v1/products/${productId}`,
        operationId: 'updateProduct',
        headers: { 'X-CSRF-Token': 'c'.repeat(32), 'Idempotency-Key': 'idem-1', 'If-Match': '"v1"' },
        body: { name: 'Updated' },
      }, new AbortController().signal)).rejects.toMatchObject({ status, problem: { status, code } });
    }

    fetcher.mockResolvedValueOnce(new Response('{"status":503}', {
      status: 503,
      headers: { 'content-type': 'text/plain', 'X-Request-ID': 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2' },
    }));
    await expect(adapter.request({ method: 'GET', href: `/api/v1/products/${productId}`, operationId: 'getProduct' }, new AbortController().signal))
      .rejects.toThrow('Unexpected response content type');
  });
});
