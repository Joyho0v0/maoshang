import type { components } from '../../../../packages/contracts/openapi/generated.js';

import type { SessionRuntime } from './session-runtime';
import type { ApiRequest, HttpResponse, ProblemDetails } from './types';

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
  readonly data: T;
  readonly etag?: string;
  readonly requestId?: string;
}

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
  listCustomers(options?: ListOptions): Promise<ResourcePage<Customer>>;
  getCustomer(id: string): Promise<ResourceResult<Customer>>;
  createCustomer(input: CustomerCreateInput): Promise<ResourceResult<Customer>>;
  updateCustomer(id: string, input: CustomerUpdateInput, etag: string): Promise<ResourceResult<Customer>>;
  commandCustomer(id: string, input: CustomerCommandInput, etag: string): Promise<ResourceResult<Customer>>;

  listProducts(options?: ListOptions): Promise<ResourcePage<Product>>;
  getProduct(id: string): Promise<ResourceResult<Product>>;
  createProduct(input: ProductCreateInput): Promise<ResourceResult<Product>>;
  updateProduct(id: string, input: ProductUpdateInput, etag: string): Promise<ResourceResult<Product>>;
  listSkus(options?: ListOptions): Promise<ResourcePage<Sku>>;
  getSku(id: string): Promise<ResourceResult<Sku>>;
  createSku(input: SkuCreateInput): Promise<ResourceResult<Sku>>;
  updateSku(id: string, input: SkuUpdateInput, etag: string): Promise<ResourceResult<Sku>>;

  listOrders(options?: ListOptions): Promise<ResourcePage<Order>>;
  getOrder(id: string): Promise<ResourceResult<Order>>;
  createOrder(input: OrderCreateInput): Promise<ResourceResult<Order>>;
  updateOrder(id: string, input: OrderUpdateInput, etag: string): Promise<ResourceResult<Order>>;
  transitionOrder(id: string, input: OrderCommandInput, etag: string): Promise<ResourceResult<Order>>;
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
  const candidate = isRecord(error) ? error : {};
  const status = typeof candidate.status === 'number' ? candidate.status : 503;
  const problem: ProblemDetails = {
    type: typeof candidate.type === 'string' ? candidate.type : 'about:blank',
    title: typeof candidate.title === 'string' ? candidate.title : '暂时无法连接业务服务',
    status,
    ...(typeof candidate.code === 'string' ? { code: candidate.code } : {}),
    ...(typeof candidate.requestId === 'string' ? { requestId: candidate.requestId } : {}),
    ...(typeof candidate.detail === 'string' ? { detail: candidate.detail } : {}),
  };
  return new DomainApiError({ problem, cause: error });
}

export type DomainPageState = 'loading' | 'ready' | 'empty' | 'error' | 'forbidden' | 'offline';

export function pageStateForError(error: unknown): Extract<DomainPageState, 'error' | 'forbidden' | 'offline'> {
  const problem = toDomainApiError(error).problem;
  if (problem.status === 401 || problem.status === 503 || problem.status === 502) return 'offline';
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

  const command = async <T>(input: ApiRequest): Promise<ResourceResult<T>> => {
    const response = await runtime.executeCommand(input);
    return responseWithMetadata(response as HttpResponse<T>);
  };

  return {
    get scopeNotice(): string | undefined {
      const scopeSummary = runtime.snapshot.identity?.scopeSummary;
      if (scopeSummary === undefined) return undefined;
      const groupSet = scopeSummary.groupIds ?? scopeSummary.groupSet ?? scopeSummary.businessGroupIds;
      if (Array.isArray(groupSet) && groupSet.length === 0) return '当前身份未分配业务组：可见数据为 0。';
      return '数据仅来自当前身份获准的业务范围，未授权字段不会补齐。';
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
  return { data: response.data, ...(etag ? { etag } : {}), ...(requestId ? { requestId } : {}) };
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
