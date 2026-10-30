export interface RequestHeaderOptions {
  requestId: string;
  csrfToken?: string;
  idempotencyKey?: string;
  etag?: string;
}

export interface SignedTransferRequest {
  url: string;
  method: string;
  body?: BodyInit;
  credentials: 'omit';
  referrerPolicy: 'no-referrer';
  headers: Record<string, string>;
}

export interface SignedTransferOptions {
  method: string;
  body?: BodyInit;
  /** Provider-signed headers only; application credentials are rejected. */
  headers?: Record<string, string>;
}

export interface SignedTransferClient {
  send(url: string, options: SignedTransferOptions): Promise<Response>;
}

export function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `request-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `idempotency-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`);
  return `{${entries.join(',')}}`;
}

export function isSafeApiHref(href: string, appOrigin: string): boolean {
  const value = href.trim();
  if (!value || value.startsWith('//') || /^(?:javascript|data|vbscript):/i.test(value)) {
    return false;
  }

  try {
    const parsed = new URL(value, appOrigin);
    return parsed.origin === appOrigin && parsed.pathname.startsWith('/api/v1/');
  } catch {
    return false;
  }
}

export function assertSafeApiHref(href: string, appOrigin: string): string {
  if (!isSafeApiHref(href, appOrigin)) {
    throw new Error(`Unsafe API href: ${href}`);
  }
  return new URL(href, appOrigin).toString();
}

export function createRequestHeaders(options: RequestHeaderOptions): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Request-Id': options.requestId,
  };
  if (options.csrfToken) headers['X-CSRF-Token'] = options.csrfToken;
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
  if (options.etag) headers['If-Match'] = options.etag;
  return headers;
}

export function createSignedTransferRequest(
  url: string,
  options: SignedTransferOptions,
): SignedTransferRequest {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Signed transfer URL must use HTTP(S)');
  }
  const headers = validateTransferHeaders(options.headers ?? {});

  const request: SignedTransferRequest = {
    url: parsed.toString(),
    method: options.method,
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    headers,
  };
  if (options.body !== undefined) {
    request.body = options.body;
  }
  return request;
}

export function createSignedTransferClient(
  fetcher: typeof fetch = fetch,
): SignedTransferClient {
  return {
    async send(url, options) {
      const request = createSignedTransferRequest(url, options);
      const init: RequestInit = {
        method: request.method,
        credentials: request.credentials,
        referrerPolicy: request.referrerPolicy,
        headers: request.headers,
      };
      if (request.body !== undefined) init.body = request.body;
      return fetcher(request.url, init);
    },
  };
}

function validateTransferHeaders(headers: Record<string, string>): Record<string, string> {
  const forbidden = new Set([
    'authorization',
    'cookie',
    'if-match',
    'idempotency-key',
    'origin',
    'referer',
    'traceparent',
    'tracestate',
    'x-csrf-token',
    'x-request-id',
  ]);
  const validated: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    const normalized = name.trim().toLowerCase();
    if (!normalized || forbidden.has(normalized) || /[\r\n]/.test(name) || /[\r\n]/.test(value)) {
      throw new Error(`Signed transfer contains a forbidden header: ${name}`);
    }
    validated[name] = value;
  }
  return validated;
}
