import type { ContractValidator } from './runtime-validator.js';

export interface GeneratedOperation {
  readonly method: string;
  readonly path: string;
}

export interface ClientCallInput {
  pathParams?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  body?: unknown;
  responseSchema?: string;
}

export interface ContractApiClientOptions {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
  validator?: ContractValidator;
}

export class ApiProblemError extends Error {
  constructor(readonly status: number, readonly problem: unknown) {
    super('API request failed.');
    this.name = 'ApiProblemError';
  }
}

export class ContractApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof globalThis.fetch;

  constructor(private readonly options: ContractApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? '/api/v1').replace(/\/$/, '');
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async execute<TResponse>(operation: GeneratedOperation, input: ClientCallInput = {}): Promise<TResponse> {
    const path = expandPath(operation.path, input.pathParams);
    const absoluteBase = /^https?:\/\//i.test(this.baseUrl);
    const url = absoluteBase ? new URL(`${this.baseUrl}${path}`) : new URL(`${this.baseUrl}${path}`, 'http://contract-client.invalid');
    for (const [key, value] of Object.entries(input.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const headers = new Headers({ Accept: 'application/json', ...input.headers });
    const hasBody = input.body !== undefined;
    if (hasBody && !headers.has('content-type')) headers.set('content-type', 'application/json');
    const requestUrl = absoluteBase ? url.toString() : `${url.pathname}${url.search}`;
    const response = await this.fetchImpl(requestUrl, {
      method: operation.method.toUpperCase(),
      credentials: 'include',
      headers,
      ...(hasBody ? { body: JSON.stringify(input.body) } : {}),
    });
    const text = await response.text();
    const payload: unknown = text.length === 0 ? undefined : JSON.parse(text) as unknown;
    if (!response.ok) {
      if (this.options.validator !== undefined && !this.options.validator.validate('Problem', payload)) throw new Error('Invalid Problem response.');
      throw new ApiProblemError(response.status, payload);
    }
    if (input.responseSchema !== undefined && this.options.validator !== undefined && !this.options.validator.validate(input.responseSchema, payload)) {
      throw new Error(`Invalid ${input.responseSchema} response.`);
    }
    return payload as TResponse;
  }
}

function expandPath(path: string, values: Record<string, string> | undefined): string {
  return path.replace(/\{([^}]+)\}/g, (_match, name: string) => {
    const value = values?.[name];
    if (value === undefined) throw new Error(`Missing path parameter: ${name}`);
    return encodeURIComponent(value);
  });
}
