import type { ContractValidator } from './runtime-validator.js';

export type ContractSchema = string | Readonly<Record<string, unknown>>;

export interface OperationParameterContract {
  readonly required: boolean;
  readonly schema?: ContractSchema;
  readonly type?: string;
}

export interface OperationResponseContract {
  readonly schema?: string;
  readonly contentType?: string;
  readonly headers: readonly string[];
  readonly requiredHeaders: readonly string[];
}

export interface GeneratedOperation {
  readonly method: string;
  readonly path: string;
  readonly pathParams: Readonly<Record<string, OperationParameterContract>>;
  readonly queryParams: Readonly<Record<string, OperationParameterContract>>;
  readonly headers: Readonly<Record<string, OperationParameterContract>>;
  readonly requestSchema?: string;
  readonly responses: Readonly<Record<string, OperationResponseContract>>;
}

export interface ClientCallInput {
  pathParams?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  body?: unknown;
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

  protected async execute<TResponse>(operation: GeneratedOperation, input: ClientCallInput = {}): Promise<TResponse> {
    const validator = this.options.validator;
    if (validator === undefined) throw new Error('A contract validator is required for generated API calls.');
    validateOperationRequest(operation, input, validator);
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
      const responseContract = operation.responses[String(response.status)];
      const schema = responseContract?.schema ?? 'Problem';
      if (!validator.validate(schema, payload)) throw new Error(`Invalid ${schema} response.`);
      throw new ApiProblemError(response.status, payload);
    }
    const responseContract = operation.responses[String(response.status)];
    if (responseContract === undefined) throw new Error(`Unexpected HTTP ${response.status} response.`);
    if (responseContract.contentType !== undefined) {
      const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim();
      if (contentType !== responseContract.contentType) throw new Error(`Unexpected response content type: ${contentType ?? 'missing'}.`);
    }
    for (const header of responseContract.requiredHeaders) {
      if (!response.headers.has(header)) throw new Error(`Missing required response header: ${header}`);
    }
    if (responseContract.schema !== undefined && !validator.validate(responseContract.schema, payload)) throw new Error(`Invalid ${responseContract.schema} response.`);
    return payload as TResponse;
  }
}

export function validateOperationRequest(operation: GeneratedOperation, input: ClientCallInput, validator: ContractValidator): void {
  const pathParams = input.pathParams ?? {};
  for (const name of Object.keys(operation.pathParams)) {
    const value = pathParams[name];
    if (value === undefined) throw new Error(`Missing path parameter: ${name}`);
    const schema = operation.pathParams[name]?.schema;
    if (schema !== undefined && !validateSchema(schema, value, validator)) throw new Error(`Invalid path parameter: ${name}`);
  }
  for (const name of Object.keys(pathParams)) {
    if (!(name in operation.pathParams)) throw new Error(`Unknown path parameter: ${name}`);
  }

  const query = input.query ?? {};
  for (const name of Object.keys(operation.queryParams)) {
    const parameter = operation.queryParams[name];
    const value = query[name];
    if (parameter?.required && value === undefined) throw new Error(`Missing query parameter: ${name}`);
    if (value !== undefined && parameter?.schema !== undefined && !validateSchema(parameter.schema, value, validator)) throw new Error(`Invalid query parameter: ${name}`);
  }
  for (const name of Object.keys(query)) {
    if (!(name in operation.queryParams)) throw new Error(`Unknown query parameter: ${name}`);
  }

  const headers = input.headers ?? {};
  for (const [name, parameter] of Object.entries(operation.headers)) {
    const value = findHeader(headers, name);
    if (parameter.required && value === undefined) throw new Error(`Missing required header: ${name}`);
    if (value !== undefined && parameter.schema !== undefined && !validateSchema(parameter.schema, value, validator)) throw new Error(`Invalid header: ${name}`);
  }

  if (operation.requestSchema !== undefined) {
    if (input.body === undefined || !validator.validate(operation.requestSchema, input.body)) throw new Error(`Invalid ${operation.requestSchema} request body.`);
  } else if (input.body !== undefined) {
    throw new Error(`Operation ${operation.path} does not accept a request body.`);
  }
}

function validateSchema(schema: ContractSchema, value: unknown, validator: ContractValidator): boolean {
  return typeof schema === 'string' ? validator.validate(schema, value) : validator.validateSchema(schema, value);
}

function findHeader(headers: Record<string, string>, name: string): string | undefined {
  const expected = name.toLowerCase();
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === expected);
  return entry?.[1];
}

function expandPath(path: string, values: Record<string, string> | undefined): string {
  return path.replace(/\{([^}]+)\}/g, (_match, name: string) => {
    const value = values?.[name];
    if (value === undefined) throw new Error(`Missing path parameter: ${name}`);
    return encodeURIComponent(value);
  });
}
