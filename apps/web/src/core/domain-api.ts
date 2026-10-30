import { ApiProblemError } from '../../../../packages/contracts/openapi/client.js';
import type { components } from '../../../../packages/contracts/openapi/generated.js';

import type { SessionRuntime } from './session-runtime';
import { createIdempotencyKey } from './security';
import type { ApiRequest, CommandExecutionResponse, HttpResponse, ProblemDetails } from './types';

export type Customer = components['schemas']['Customer'] & {
  /** Customer name is an allowed contract extension in JC1-IS01. */
  readonly name?: string;
  readonly allowedTransitions?: readonly string[];
};
export type Product = components['schemas']['Product'];
export type Sku = components['schemas']['Sku'];
export type Order = components['schemas']['Order'] & {
  readonly allowedTransitions?: readonly string[];
  readonly history?: readonly OrderHistoryEntry[];
  readonly itemSnapshots?: readonly OrderItemSnapshot[];
};
export type OrderLine = components['schemas']['Order']['lines'][number];
export type OrderItemSnapshot = OrderLine & {
  readonly productName?: string;
  readonly skuName?: string;
};
export interface OrderHistoryEntry {
  readonly action: string;
  readonly at: string;
  readonly status: string;
}

export type PageMeta = components['schemas']['PageMeta'];
export interface ResourcePage<T> {
  readonly data: readonly T[];
  readonly page: PageMeta;
}

export interface ListOptions {
  readonly status?: string | undefined;
  readonly sort?: string | undefined;
  readonly cursor?: string | undefined;
}

export interface ResourceResult<T> {
  readonly kind?: 'resource';
  readonly data: T;
  readonly etag?: string;
  readonly requestId?: string;
}

export interface PendingMutation<T> {
  readonly kind: 'pending';
  readonly commandId: string;
  readonly operationId: string;
  readonly idempotencyKey: string;
  readonly canonicalBody?: string;
  readonly etag?: string;
  readonly state: 'IN_PROGRESS' | 'RECOVERY_REQUIRED' | 'RESULT_UNKNOWN';
  readonly recover: () => Promise<DomainMutationResult<T>>;
}

export type DomainMutationResult<T> = ResourceResult<T> | PendingMutation<T>;

export type CustomerCreateInput = components['schemas']['CustomerCreateRequest'];
export type CustomerUpdateInput = components['schemas']['CustomerUpdateRequest'];
export type CustomerCommandInput = components['schemas']['CustomerCommandRequest'];
export type ProductCreateInput = components['schemas']['ProductCreateRequest'];
export type ProductUpdateInput = components['schemas']['ProductUpdateRequest'];
export type SkuCreateInput = components['schemas']['SkuCreateRequest'];
export type SkuUpdateInput = components['schemas']['SkuUpdateRequest'];
export type OrderCreateInput = components['schemas']['OrderCreateRequest'];
export type OrderUpdateInput = components['schemas']['OrderUpdateRequest'];
export type OrderCommandInput = components['schemas']['OrderCommandRequest'];

export interface DomainApi {
  readonly scopeNotice?: string | undefined;
  readonly capabilities?: readonly string[] | undefined;
  listCustomers(options?: ListOptions): Promise<ResourcePage<Customer>>;
  getCustomer(id: string): Promise<ResourceResult<Customer>>;
  createCustomer(input: CustomerCreateInput): Promise<DomainMutationResult<Customer>>;
  updateCustomer(id: string, input: CustomerUpdateInput, etag: string): Promise<DomainMutationResult<Customer>>;
  commandCustomer(id: string, input: CustomerCommandInput, etag: string): Promise<DomainMutationResult<Customer>>;

  listProducts(options?: ListOptions): Promise<ResourcePage<Product>>;
  getProduct(id: string): Promise<ResourceResult<Product>>;
  createProduct(input: ProductCreateInput): Promise<DomainMutationResult<Product>>;
  updateProduct(id: string, input: ProductUpdateInput, etag: string): Promise<DomainMutationResult<Product>>;
  listSkus(options?: ListOptions): Promise<ResourcePage<Sku>>;
  getSku(id: string): Promise<ResourceResult<Sku>>;
  createSku(input: SkuCreateInput): Promise<DomainMutationResult<Sku>>;
  updateSku(id: string, input: SkuUpdateInput, etag: string): Promise<DomainMutationResult<Sku>>;

  listOrders(options?: ListOptions): Promise<ResourcePage<Order>>;
  getOrder(id: string): Promise<ResourceResult<Order>>;
  createOrder(input: OrderCreateInput): Promise<DomainMutationResult<Order>>;
  updateOrder(id: string, input: OrderUpdateInput, etag: string): Promise<DomainMutationResult<Order>>;
  transitionOrder(id: string, input: OrderCommandInput, etag: string): Promise<DomainMutationResult<Order>>;
}

export interface DomainApiErrorOptions {
  readonly problem: ProblemDetails;
  readonly cause?: unknown;
}

export class DomainApiError extends Error {
  readonly problem: ProblemDetails;
  readonly status: number;

  constructor(options: DomainApiErrorOptions) {
    super(options.problem.title, { cause: options.cause });
    this.name = 'DomainApiError';
    this.problem = options.problem;
    this.status = options.problem.status;
  }
}

export function toDomainApiError(error: unknown): DomainApiError {
  if (error instanceof DomainApiError) return error;
  if (error instanceof ApiProblemError) {
    const requestId = error.problem.requestId ?? error.headers['X-Request-ID'] ?? error.headers['X-Request-Id'];
    return new DomainApiError({
      problem: {
        ...error.problem,
        ...(requestId === undefined ? {} : { requestId }),
        headers: { ...error.headers },
      },
      cause: error,
    });
  }
  const candidate = isRecord(error) ? error : {};
  const nested = isRecord(candidate.problem) ? candidate.problem : undefined;
  const source = nested ?? candidate;
  const status = typeof source.status === 'number' ? source.status : 503;
  const problem: ProblemDetails = {
    type: typeof source.type === 'string' ? source.type : 'about:blank',
    title: typeof source.title === 'string' ? source.title : '暂时无法连接业务服务',
    status,
    ...(typeof source.code === 'string' ? { code: source.code } : {}),
    ...(typeof source.requestId === 'string' ? { requestId: source.requestId } : {}),
    ...(typeof source.detail === 'string' ? { detail: source.detail } : {}),
    ...(typeof source.retryable === 'boolean' ? { retryable: source.retryable } : {}),
    ...(isRecord(source.meta) ? { meta: source.meta } : {}),
    ...(Array.isArray(source.violations) ? { violations: source.violations as NonNullable<ProblemDetails['violations']> } : {}),
    ...(isRecord(candidate.headers) ? { headers: candidate.headers as Record<string, string> } : {}),
  };
  return new DomainApiError({ problem, cause: error });
}

export type DomainPageState = 'loading' | 'ready' | 'empty' | 'error' | 'forbidden' | 'offline';

export function pageStateForError(error: unknown): Extract<DomainPageState, 'error' | 'forbidden' | 'offline'> {
  const problem = toDomainApiError(error).problem;
  if (problem.status === 503 || problem.status === 502) return 'offline';
  if (problem.status === 403) return 'forbidden';
  return 'error';
}

export function isConflictError(error: unknown): boolean {
  const status = toDomainApiError(error).problem.status;
  return status === 409 || status === 428;
}

export const DOMAIN_API_KEY = Symbol('domain-api');

export function createProductionDomainApi(runtime: SessionRuntime): DomainApi {
  const request = async <T>(input: ApiRequest, cacheKey: string): Promise<ResourceResult<T>> => {
    void cacheKey;
    const response = await runtime.request<T>(input);
    return responseWithMetadata(response);
  };

  const command = async <T>(input: ApiRequest): Promise<DomainMutationResult<T>> => {
    const idempotencyKey = input.idempotencyKey ?? createIdempotencyKey();
    try {
      const response = await runtime.executeCommand({ ...input, idempotencyKey });
      return mutationFromResponse(runtime, response as CommandExecutionResponse<T>);
    } catch (error) {
      const pending = runtime.pendingCommands.findByIdempotencyKey(idempotencyKey);
      if (pending?.status === 'in-flight' && (pending.state === 'result-unknown' || pending.state === 'querying-status')) {
        return pendingMutation(runtime, pending, 'RESULT_UNKNOWN');
      }
      throw error;
    }
  };

  return {
    get scopeNotice(): string | undefined {
      const scopeSummary = runtime.snapshot.identity?.scopeSummary;
      if (scopeSummary === undefined) return undefined;
      const groupSet = scopeSummary.groupIds ?? scopeSummary.groupSet ?? scopeSummary.businessGroupIds;
      if (Array.isArray(groupSet) && groupSet.length === 0) return '当前身份未分配业务组：可见数据为 0。';
      return '数据仅来自当前身份获准的业务范围，未授权字段不会补齐。';
    },
    get capabilities(): readonly string[] | undefined {
      return runtime.snapshot.identity?.capabilities;
    },
    async listCustomers(options) {
      return requestPage<Customer>(runtime, 'listCustomers', '/api/v1/customers', options);
    },
    getCustomer: (id) => request<Customer>({ method: 'GET', href: `/api/v1/customers/${encodeURIComponent(id)}`, operationId: 'getCustomer' }, `customer:${id}`),
    createCustomer: (input) => command<Customer>({ method: 'POST', href: '/api/v1/customers', operationId: 'createCustomer', body: input }),
    updateCustomer: (id, input, etag) => command<Customer>({ method: 'PATCH', href: `/api/v1/customers/${encodeURIComponent(id)}`, operationId: 'updateCustomer', body: input, etag }),
    commandCustomer: (id, input, etag) => command<Customer>({ method: 'POST', href: commandHref(id, input.action), operationId: customerOperation(input.action), body: input, etag }),

    async listProducts(options) {
      return requestPage<Product>(runtime, 'listProducts', '/api/v1/products', options);
    },
    getProduct: (id) => request<Product>({ method: 'GET', href: `/api/v1/products/${encodeURIComponent(id)}`, operationId: 'getProduct' }, `product:${id}`),
    createProduct: (input) => command<Product>({ method: 'POST', href: '/api/v1/products', operationId: 'createProduct', body: input }),
    updateProduct: (id, input, etag) => command<Product>({ method: 'PATCH', href: `/api/v1/products/${encodeURIComponent(id)}`, operationId: 'updateProduct', body: input, etag }),
    async listSkus(options) {
      return requestPage<Sku>(runtime, 'listSkus', '/api/v1/skus', options);
    },
    getSku: (id) => request<Sku>({ method: 'GET', href: `/api/v1/skus/${encodeURIComponent(id)}`, operationId: 'getSku' }, `sku:${id}`),
    createSku: (input) => command<Sku>({ method: 'POST', href: '/api/v1/skus', operationId: 'createSku', body: input }),
    updateSku: (id, input, etag) => command<Sku>({ method: 'PATCH', href: `/api/v1/skus/${encodeURIComponent(id)}`, operationId: 'updateSku', body: input, etag }),

    async listOrders(options) {
      return requestPage<Order>(runtime, 'listOrders', '/api/v1/orders', options);
    },
    getOrder: (id) => request<Order>({ method: 'GET', href: `/api/v1/orders/${encodeURIComponent(id)}`, operationId: 'getOrder' }, `order:${id}`),
    createOrder: (input) => command<Order>({ method: 'POST', href: '/api/v1/orders', operationId: 'createOrder', body: input }),
    updateOrder: (id, input, etag) => command<Order>({ method: 'PATCH', href: `/api/v1/orders/${encodeURIComponent(id)}`, operationId: 'updateOrder', body: input, etag }),
    transitionOrder: (id, input, etag) => command<Order>({ method: 'POST', href: `/api/v1/orders/${encodeURIComponent(id)}/transitions`, operationId: 'transitionOrder', body: input, etag }),
  };
}

async function requestPage<T>(
  runtime: SessionRuntime,
  operationId: string,
  path: string,
  options: ListOptions | undefined,
): Promise<ResourcePage<T>> {
  const query = new URLSearchParams();
  query.set('page[size]', '20');
  if (options?.cursor) query.set('page[after]', options.cursor);
  if (options?.sort) query.set('sort', options.sort);
  if (options?.status) query.set('filter[status]', options.status);
  const href = `${path}?${query.toString()}`;
  return runtime.query<ResourcePage<T>>(`${operationId}:${href}`, { method: 'GET', href, operationId });
}

function responseWithMetadata<T>(response: HttpResponse<T>): ResourceResult<T> {
  const etag = response.headers.ETag ?? response.headers.etag;
  const requestId = response.headers['X-Request-ID'] ?? response.headers['X-Request-Id'];
  return { kind: 'resource', data: response.data, ...(etag ? { etag } : {}), ...(requestId ? { requestId } : {}) };
}

function mutationFromResponse<T>(
  runtime: SessionRuntime,
  response: CommandExecutionResponse<T>,
): DomainMutationResult<T> {
  if (response.status !== 202) return responseWithMetadata(response);
  const pending = runtime.pendingCommands.get(response.commandId);
  if (pending === undefined) throw new Error('The accepted command was not retained for recovery.');
  return pendingMutation(runtime, pending, 'IN_PROGRESS');
}

function pendingMutation<T>(
  runtime: SessionRuntime,
  command: NonNullable<ReturnType<SessionRuntime['pendingCommands']['get']>>,
  state: PendingMutation<T>['state'],
): PendingMutation<T> {
  return {
    kind: 'pending',
    commandId: command.id,
    operationId: command.operationId ?? '',
    idempotencyKey: command.idempotencyKey,
    ...(command.canonicalBody === undefined ? {} : { canonicalBody: command.canonicalBody }),
    ...(command.etag === undefined ? {} : { etag: command.etag }),
    state,
    recover: async () => {
      const response = await runtime.recoverPendingCommand(command.id);
      if (response.status === 202) {
        const current = runtime.pendingCommands.get(command.id);
        if (current === undefined) throw new Error('The pending command disappeared during recovery.');
        return pendingMutation<T>(runtime, current, 'IN_PROGRESS');
      }
      return responseWithMetadata(response as HttpResponse<T>);
    },
  };
}

function commandHref(id: string, action: CustomerCommandInput['action']): string {
  const suffix: Record<CustomerCommandInput['action'], string> = {
    SUBMIT_APPROVAL: 'submit-approval',
    APPROVE: 'approve',
    REJECT: 'reject',
    REASSIGN: 'reassign',
  };
  return `/api/v1/customers/${encodeURIComponent(id)}/${suffix[action]}`;
}

function customerOperation(action: CustomerCommandInput['action']): string {
  const operation: Record<CustomerCommandInput['action'], string> = {
    SUBMIT_APPROVAL: 'submitCustomerApproval',
    APPROVE: 'approveCustomer',
    REJECT: 'rejectCustomer',
    REASSIGN: 'reassignCustomer',
  };
  return operation[action];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
