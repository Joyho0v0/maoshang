import {
  ApiProblemError,
  type ClientCallInput,
} from '../../../../packages/contracts/openapi/client.js';
import {
  GeneratedApiClient,
  operations,
  TransferExecutor,
  type OperationId,
  type OperationInputMap,
  type OperationResponseMap,
  type TransferExecutorOptions,
} from '../../../../packages/contracts/openapi/generated-client.js';
import type { OperationParameterContract } from '../../../../packages/contracts/openapi/client.js';
import { createContractValidator } from '../../../../packages/contracts/openapi/runtime-validator.js';
import type { components } from '../../../../packages/contracts/openapi/generated.js';
import { frozenOpenApiDocument } from './contract-document';
import type {
  ApiRequest,
  ContractAdapter,
  HttpResponse,
  LoginInput,
  SessionBootstrapResponse,
  SessionCredentials,
  SessionIdentity,
  SessionUser,
} from './types';

const contractValidator = createContractValidator(frozenOpenApiDocument);
const API_PREFIX = '/api/v1';

export interface GeneratedContractAdapterOptions {
  readonly baseUrl?: string;
  readonly fetch?: typeof globalThis.fetch;
}

/**
 * Production API boundary. Every application request is dispatched through
 * the frozen generated operation table and its runtime validator.
 */
export function createGeneratedContractAdapter(
  options: GeneratedContractAdapterOptions = {},
): ContractAdapter {
  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  let csrfToken: string | undefined;

  async function call<Id extends OperationId>(
    operationId: Id,
    input: OperationInputMap[Id],
    signal?: AbortSignal,
  ): Promise<OperationResponseMap[Id]> {
    const client = new GeneratedApiClient({
      baseUrl: options.baseUrl ?? API_PREFIX,
      validator: contractValidator,
      fetch: async (inputUrl, init) => {
        const requestInit: RequestInit = { ...init };
        if (signal !== undefined) requestInit.signal = signal;
        return fetchImpl(inputUrl, requestInit);
      },
    });
    return client.call(operationId, input as never) as Promise<OperationResponseMap[Id]>;
  }

  return {
    async bootstrap(signal): Promise<SessionBootstrapResponse> {
      const csrf = await call('getCsrfToken', {}, signal);
      csrfToken = csrf.data.csrfToken;
      try {
        const session = await call('getCurrentSession', {}, signal);
        csrfToken = session.data.csrfToken;
        return {
          authenticated: true,
          user: mapSessionUser(session.data),
          identity: mapSessionIdentity(session.data),
          csrfToken: session.data.csrfToken,
        };
      } catch (error) {
        if (error instanceof ApiProblemError && error.status === 401) {
          return { authenticated: false, csrfToken: csrf.data.csrfToken };
        }
        throw error;
      }
    },

    async login(input: LoginInput, signal): Promise<SessionCredentials> {
      const csrf = await call('getCsrfToken', {}, signal);
      csrfToken = csrf.data.csrfToken;
      const session = await call('createSession', {
        headers: { 'X-CSRF-Token': csrfToken },
        body: {
          provider: 'LOCAL_PASSWORD',
          username: input.email,
          password: input.password,
        },
      }, signal);
      csrfToken = session.data.csrfToken;
      return {
        user: mapSessionUser(session.data),
        identity: mapSessionIdentity(session.data),
        csrfToken: session.data.csrfToken,
      };
    },

    async logout(signal, currentCsrfToken): Promise<void> {
      const token = currentCsrfToken ?? csrfToken;
      if (token === undefined) throw new Error('CSRF token is required before logout.');
      await call('deleteCurrentSession', {
        headers: { 'X-CSRF-Token': token },
      }, signal);
      csrfToken = undefined;
    },

    async rotateCsrf(signal): Promise<{ csrfToken: string }> {
      const response = await call('getCsrfToken', {}, signal);
      csrfToken = response.data.csrfToken;
      return { csrfToken: response.data.csrfToken };
    },

    async request(request: ApiRequest, signal: AbortSignal): Promise<HttpResponse<unknown>> {
      const resolved = resolveOperation(request);
      const response = await call(resolved.operationId, resolved.input, signal);
      return response as HttpResponse<unknown>;
    },
  };
}

/** Test-only seam for focused runtime tests. */
export function createContractAdapter(implementation: ContractAdapter): ContractAdapter {
  return implementation;
}

/**
 * The only production transfer seam. Generated intent validation owns the
 * provider header allowlist, locator, expiry, credentials and referrer rules.
 */
export function createTransferExecutor(options: TransferExecutorOptions = {}): TransferExecutor {
  return new TransferExecutor(options);
}

/** Temporary in-memory fixture for adapter and shell tests only. */
export function createMockContractAdapter(): ContractAdapter {
  return {
    bootstrap: async () => ({ authenticated: false }),
    login: async () => ({
      user: { id: 'fixture-sales', organizationId: 'fixture-org', displayName: '演示销售', role: 'sales' },
      identity: {
        userId: 'fixture-sales',
        organizationId: 'fixture-org',
        capabilities: [],
        scopeSummary: {},
        authzVersion: 1,
        serverSessionEpoch: 1,
      },
      csrfToken: 'fixture-csrf',
    }),
    logout: async () => undefined,
    rotateCsrf: async () => ({ csrfToken: 'fixture-csrf-rotated' }),
    request: async (): Promise<HttpResponse<unknown>> => ({
      status: 200,
      data: { ok: true },
      headers: { 'X-Request-Id': 'fixture-request' },
    }),
  };
}

interface ResolvedRequest {
  readonly operationId: OperationId;
  readonly input: ClientCallInput;
}

function resolveOperation(request: ApiRequest): ResolvedRequest {
  const origin = typeof location === 'undefined' ? 'http://localhost' : location.origin;
  const url = new URL(request.href, origin);
  if (url.origin !== origin || !url.pathname.startsWith(`${API_PREFIX}/`)) {
    throw new Error(`Unsafe API href: ${request.href}`);
  }
  const path = url.pathname.slice(API_PREFIX.length) || '/';
  const method = request.method.toLowerCase();
  const entries = Object.entries(operations) as [OperationId, (typeof operations)[OperationId]][];
  const requestedOperation = request.operationId === undefined
    ? undefined
    : entries.find(([operationId]) => operationId === request.operationId);
  if (request.operationId !== undefined && requestedOperation === undefined) {
    throw new Error(`Unknown generated operationId: ${request.operationId}.`);
  }
  const candidates = requestedOperation === undefined ? entries : [requestedOperation];
  const match = candidates
    .sort((left, right) => right[1].path.length - left[1].path.length)
    .map(([operationId, operation]) => ({ operationId, operation, match: matchPath(operation.path, path) }))
    .find((entry) => entry.operation.method.toLowerCase() === method && entry.match !== undefined);
  if (match === undefined || match.match === undefined) {
    if (request.operationId !== undefined) {
      throw new Error(`operationId ${request.operationId} does not match ${request.method} ${path}.`);
    }
    throw new Error(`No generated operation matches ${request.method} ${path}.`);
  }

  const query = collectQuery(url.searchParams, match.operation.queryParams);
  const body = request.body === undefined
    ? undefined
    : typeof request.body === 'string'
      ? parseCanonicalBody(request.body)
      : request.body;
  const input: ClientCallInput = {
    pathParams: match.match,
    ...(Object.keys(query).length > 0 ? { query } : {}),
    ...(request.headers !== undefined ? { headers: request.headers } : {}),
    ...(body !== undefined ? { body } : {}),
  };
  return { operationId: match.operationId, input };
}

function matchPath(template: string, path: string): Record<string, string> | undefined {
  const names: string[] = [];
  const pattern = template.split('/').map((segment) => {
    if (segment.startsWith('{') && segment.endsWith('}')) {
      names.push(segment.slice(1, -1));
      return '([^/]+)';
    }
    return escapeRegExp(segment);
  }).join('/');
  const result = new RegExp(`^${pattern}$`).exec(path);
  if (result === null) return undefined;
  return Object.fromEntries(names.map((name, index) => [name, decodeURIComponent(result[index + 1] ?? '')]));
}

function collectQuery(
  searchParams: URLSearchParams,
  parameters: Readonly<Record<string, OperationParameterContract>>,
): Record<string, string | number | boolean | readonly (string | number | boolean)[]> {
  const raw: Record<string, string | string[]> = {};
  for (const [name, value] of searchParams.entries()) {
    if (!(name in parameters)) throw new Error(`Unknown query parameter: ${name}`);
    const current = raw[name];
    if (current === undefined) raw[name] = value;
    else if (Array.isArray(current)) current.push(value);
    else raw[name] = [current, value];
  }
  return Object.fromEntries(Object.entries(raw).map(([name, value]) => [
    name,
    coerceQueryValue(value, parameters[name], name),
  ]));
}

function coerceQueryValue(
  value: string | string[],
  parameter: OperationParameterContract | undefined,
  parameterName: string,
): string | number | boolean | readonly (string | number | boolean)[] {
  if (parameter === undefined) throw new Error('Unknown query parameter.');
  const schema = parameter.schema;
  const schemaRecord = isRecord(schema) ? schema : undefined;
  const type = parameter.type ?? (typeof schemaRecord?.type === 'string' ? schemaRecord.type : undefined);
  if (type === 'array') {
    const values = Array.isArray(value) ? value : [value];
    const itemSchema = isRecord(schemaRecord?.items) ? schemaRecord.items : undefined;
    const itemType = typeof itemSchema?.type === 'string' ? itemSchema.type : 'string';
    return values.map((item) => coerceScalar(item, itemType, parameterName));
  }
  if (Array.isArray(value)) throw new Error(`Repeated scalar query parameter: ${parameterName}`);
  return coerceScalar(Array.isArray(value) ? value[0] ?? '' : value, type ?? 'string', parameterName);
}

function coerceScalar(value: string, type: string, parameterName: string): string | number | boolean {
  if (type === 'integer') {
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) throw new Error(`Invalid integer query parameter: ${parameterName}`);
    return parsed;
  }
  if (type === 'number') {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error(`Invalid number query parameter: ${parameterName}`);
    return parsed;
  }
  if (type === 'boolean') {
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new Error(`Invalid boolean query parameter: ${parameterName}`);
  }
  return value;
}

function parseCanonicalBody(body: string): unknown {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new Error('Canonical request body is not valid JSON.');
  }
}

function mapSessionUser(session: components['schemas']['Session']): SessionUser {
  const data = session.user.data;
  const role = normalizeRole(data.role);
  const displayName = firstString(data.displayName, data.name, data.username);
  if (displayName === undefined) throw new Error('Session user is missing a display name.');
  return {
    id: session.user.id,
    organizationId: session.organizationId,
    displayName,
    ...(role === undefined ? {} : { role }),
  };
}

function mapSessionIdentity(session: components['schemas']['Session']): SessionIdentity {
  return {
    userId: session.user.id,
    organizationId: session.organizationId,
    capabilities: [...session.capabilities],
    scopeSummary: { ...session.scopeSummary },
    authzVersion: session.authzVersion,
    serverSessionEpoch: session.sessionEpoch,
  };
}

function normalizeRole(value: unknown): SessionUser['role'] {
  if (value === 'super-admin' || value === 'team-admin' || value === 'sales' || value === 'customer') return value;
  if (value === 'SUPER_ADMIN') return 'super-admin';
  if (value === 'GROUP_LEADER' || value === 'TEAM_ADMIN') return 'team-admin';
  return undefined;
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === 'string' && value.length > 0);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
