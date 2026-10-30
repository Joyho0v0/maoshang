import {
  assertSafeApiHref,
  createRequestHeaders,
  createSignedTransferClient,
  createSignedTransferRequest,
  isSafeApiHref,
  stableStringify,
} from './security';

describe('API URL and request security boundaries', () => {
  const origin = 'https://crm.example.test';

  it('accepts only same-origin versioned API paths', () => {
    expect(isSafeApiHref('/api/v1/customers', origin)).toBe(true);
    expect(isSafeApiHref(`${origin}/api/v1/orders/42`, origin)).toBe(true);
    expect(isSafeApiHref('/api/v2/orders', origin)).toBe(false);
    expect(isSafeApiHref('https://evil.example/api/v1/orders', origin)).toBe(false);
    expect(isSafeApiHref('//evil.example/api/v1/orders', origin)).toBe(false);
    expect(isSafeApiHref('//crm.example.test/api/v1/orders', origin)).toBe(false);
    expect(isSafeApiHref('javascript:alert(1)', origin)).toBe(false);
    expect(isSafeApiHref('data:text/html,<script>alert(1)</script>', origin)).toBe(false);
  });

  it('throws a typed error when an application href crosses the boundary', () => {
    expect(() => assertSafeApiHref('javascript:alert(1)', origin)).toThrow(
      'Unsafe API href',
    );
  });

  it('serializes canonical bodies deterministically without using storage', () => {
    expect(stableStringify({ z: 1, nested: { b: true, a: 'x' }, a: 2 })).toBe(
      '{"a":2,"nested":{"a":"x","b":true},"z":1}',
    );
    expect(window.localStorage.length).toBe(0);
  });

  it('builds request metadata without logging or persisting sensitive values', () => {
    const headers = createRequestHeaders({
      requestId: 'request-1',
      csrfToken: 'csrf-secret',
      idempotencyKey: 'idem-1',
      etag: '"version-2"',
    });

    expect(headers).toEqual({
      'X-Request-Id': 'request-1',
      'X-CSRF-Token': 'csrf-secret',
      'Idempotency-Key': 'idem-1',
      'If-Match': '"version-2"',
    });
    expect(window.localStorage.length).toBe(0);
  });

  it('isolates signed transfer requests from application credentials', () => {
    const request = createSignedTransferRequest('https://files.example.test/signed-url', {
      method: 'PUT',
      body: 'file-bytes',
    });

    expect(request.credentials).toBe('omit');
    expect(request.headers).not.toHaveProperty('Cookie');
    expect(request.headers).not.toHaveProperty('X-CSRF-Token');
    expect(request.url).toBe('https://files.example.test/signed-url');
  });

  it('keeps the signed transfer fetch client separate from application credentials', async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      void url;
      void init;
      return new Response(null, { status: 204 });
    });
    const client = createSignedTransferClient(fetcher);

    await client.send('https://files.example.test/signed-url', { method: 'PUT', body: 'bytes' });

    expect(fetcher).toHaveBeenCalledWith(
      'https://files.example.test/signed-url',
      expect.objectContaining({ credentials: 'omit', method: 'PUT', body: 'bytes' }),
    );
    const init = fetcher.mock.calls[0]?.[1];
    expect(init?.headers).not.toHaveProperty('Cookie');
    expect(init?.headers).not.toHaveProperty('X-CSRF-Token');
  });

  it('passes binary signed transfer bodies through without JSON serialization', async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      void url;
      void init;
      return new Response(null, { status: 204 });
    });
    const client = createSignedTransferClient(fetcher);
    const body = new Blob(['binary-payload'], { type: 'application/octet-stream' });

    await client.send('https://files.example.test/signed-url', { method: 'PUT', body });

    expect(fetcher.mock.calls[0]?.[1]?.body).toBe(body);
  });
});
