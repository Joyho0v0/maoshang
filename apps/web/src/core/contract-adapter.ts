import {
  ApiProblemError,
  type ClientCallInput,
} from '../../../../packages/contracts/openapi/client.js';
import {
  GeneratedApiClient,
  operations,
  type OperationId,
  type OperationInputMap,
  type OperationResponseMap,
} from '../../../../packages/contracts/openapi/generated-client.js';
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

/** Temporary in-memory fixture for adapter and shell tests only. */
export function createMockContractAdapter(): ContractAdapter {
  return {
    bootstrap: async () => ({ authenticated: false }),
    login: async () => ({
      user: { id: 'fixture-sales', displayName: '演示销售', role: 'sales' },
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
  const match = entries
    .sort((left, right) => right[1].path.length - left[1].path.length)
    .map(([operationId, operation]) => ({ operationId, operation, match: matchPath(operation.path, path) }))
    .find((entry) => entry.operation.method.toLowerCase() === method && entry.match !== undefined);
  if (match === undefined || match.match === undefined) {
    throw new Error(`No generated operation matches ${request.method} ${path}.`);
  }

  const query = collectQuery(url.searchParams);
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

function collectQuery(searchParams: URLSearchParams): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};
  for (const [name, value] of searchParams.entries()) {
    const current = query[name];
    if (current === undefined) query[name] = value;
    else if (Array.isArray(current)) current.push(value);
    else query[name] = [current, value];
  }
  return query;
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
  return { id: session.user.id, displayName, role };
}

function normalizeRole(value: unknown): SessionUser['role'] {
  if (value === 'super-admin' || value === 'team-admin' || value === 'sales' || value === 'customer') return value;
  if (value === 'SUPER_ADMIN') return 'super-admin';
  if (value === 'GROUP_LEADER' || value === 'TEAM_ADMIN') return 'team-admin';
  throw new Error('Session user contains an unsupported role.');
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === 'string' && value.length > 0);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
