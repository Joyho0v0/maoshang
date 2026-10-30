import type {
  Customer,
  CustomerCommandInput,
  CustomerCreateInput,
  CustomerUpdateInput,
  DomainApi,
  ListOptions,
  Order,
  OrderUpdateInput,
  Product,
  ProductUpdateInput,
  ResourcePage,
  ResourceResult,
  Sku,
  SkuUpdateInput,
} from './domain-api';
import { DomainApiError } from './domain-api';

export type FixtureScenario = 'ready' | 'reference-pages' | 'empty' | 'empty-group' | 'forbidden' | 'offline' | 'error' | 'conflict' | 'precondition';

export interface FixtureDomainApiOptions {
  readonly scenario?: FixtureScenario;
  readonly actorUserId?: string;
}

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const OWNER_ID = '00000000-0000-4000-8000-000000000002';
const APPROVER_ID = '00000000-0000-4000-8000-000000000003';
const CUSTOMER_ID = '00000000-0000-4000-8000-000000000101';
const CUSTOMER_REJECTED_ID = '00000000-0000-4000-8000-000000000102';
const PRODUCT_ID = '00000000-0000-4000-8000-000000000201';
const SKU_ID = '00000000-0000-4000-8000-000000000301';
const ORDER_ID = '00000000-0000-4000-8000-000000000401';

const now = '2026-10-30T08:00:00.000Z';
const later = '2026-10-30T10:00:00.000Z';

function capabilitiesForActor(actorUserId: string): readonly string[] {
  return actorUserId === APPROVER_ID
    ? ['customer.read', 'customer.create', 'customer.update', 'customer.submitApproval', 'customer.approve', 'customer.reject', 'customer.reassign', 'order.read', 'order.create', 'order.update', 'order.transition', 'product.read', 'product.create', 'product.update', 'sku.read', 'sku.create', 'sku.update']
    : ['customer.read', 'customer.create', 'customer.update', 'customer.submitApproval', 'customer.reassign', 'order.read', 'order.create', 'order.update', 'order.transition', 'product.read', 'product.create', 'product.update', 'sku.read', 'sku.create', 'sku.update'];
}

export function createFixtureDomainApi(options: FixtureDomainApiOptions = {}): DomainApi {
  let scenario = options.scenario ?? 'ready';
  const actorUserId = options.actorUserId ?? APPROVER_ID;
  const actorCapabilities = capabilitiesForActor(actorUserId);
  let customers: Customer[] = [
    {
      id: CUSTOMER_ID,
      name: '北方星辰贸易',
      organizationId: ORG_ID,
      version: 4,
      createdAt: now,
      updatedAt: later,
      status: 'PENDING_APPROVAL',
      ownerUserId: OWNER_ID,
      businessGroupId: ORG_ID,
      contacts: [{ name: '已授权联系人', email: 'contact@example.test' }],
      approvalSummary: {
        latestOutcome: 'PENDING',
        attemptId: '00000000-0000-4000-8000-000000000501',
        attemptNo: 1,
        canResubmit: false,
      },
      capabilities: ['customer.read', 'customer.approve', 'customer.reject'],
      allowedTransitions: ['APPROVE', 'REJECT'],
    },
    {
      id: CUSTOMER_REJECTED_ID,
      name: '远山设备有限公司',
      organizationId: ORG_ID,
      version: 2,
      createdAt: now,
      updatedAt: now,
      status: 'DRAFT',
      ownerUserId: OWNER_ID,
      businessGroupId: ORG_ID,
      approvalSummary: {
        latestOutcome: 'REJECTED',
        attemptId: '00000000-0000-4000-8000-000000000502',
        attemptNo: 1,
        reason: '请补充最终收货主体。',
        canResubmit: true,
      },
      capabilities: ['customer.read', 'customer.update', 'customer.submitApproval', 'customer.reassign'],
      allowedTransitions: ['SUBMIT_APPROVAL', 'REASSIGN'],
    },
  ];
  const products: Product[] = [{
    id: PRODUCT_ID,
    organizationId: ORG_ID,
    version: 3,
    createdAt: now,
    updatedAt: later,
    name: '不锈钢连接件',
    productCode: 'CONN-SS',
    unit: '件',
    description: '标准目录件；库存数量由后续 Inventory 纵切提供。',
    status: 'ACTIVE',
  }];
  const skus: Sku[] = [{
    id: SKU_ID,
    organizationId: ORG_ID,
    version: 2,
    createdAt: now,
    updatedAt: later,
    productId: PRODUCT_ID,
    skuCode: 'CONN-SS-01',
    name: '不锈钢连接件 01',
    unit: '件',
    baseUnit: '件',
    trackingMode: 'LOT',
    lowStockThreshold: '100.000',
    price: '18.50',
    status: 'ACTIVE',
  }];
  const orders: Order[] = [{
    id: ORDER_ID,
    organizationId: ORG_ID,
    version: 5,
    createdAt: now,
    updatedAt: later,
    customerId: CUSTOMER_ID,
    orderNo: 'SO-20261030-001',
    currency: 'CNY',
    status: 'DRAFT',
    lines: [{ skuId: SKU_ID, quantity: '120.000', unitPrice: '18.50' }],
    totalAmount: '2220.000',
    allowedTransitions: ['CONFIRM', 'CANCEL'],
    itemSnapshots: [{ skuId: SKU_ID, quantity: '120.000', unitPrice: '18.50', skuName: '不锈钢连接件 01', productName: '不锈钢连接件' }],
    history: [{ action: 'CREATED', at: now, status: 'DRAFT' }],
  }];

  if (scenario === 'reference-pages') {
    const customerTemplate = customers[0];
    const productTemplate = products[0];
    const skuTemplate = skus[0];
    if (customerTemplate && productTemplate && skuTemplate) {
      customers.push(...Array.from({ length: 20 }, (_, index) => ({
        ...customerTemplate,
        id: `00000000-0000-4000-8000-${String(600 + index).padStart(12, '0')}`,
        name: `授权客户 ${index + 2}`,
      })));
      products.push(...Array.from({ length: 20 }, (_, index) => ({
        ...productTemplate,
        id: `00000000-0000-4000-8000-${String(700 + index).padStart(12, '0')}`,
        name: `授权商品 ${index + 2}`,
        productCode: `AUTH-${String(index + 2).padStart(2, '0')}`,
      })));
      skus.push(...Array.from({ length: 20 }, (_, index) => ({
        ...skuTemplate,
        id: `00000000-0000-4000-8000-${String(800 + index).padStart(12, '0')}`,
        name: `授权 SKU ${index + 2}`,
        skuCode: `AUTH-SKU-${String(index + 2).padStart(2, '0')}`,
      })));
    }
  }

  const api: DomainApi = {
    get scopeNotice() {
      return scenario === 'empty-group' ? '当前身份未分配业务组：可见数据为 0。' : '数据仅来自当前身份获准的业务范围，未授权字段不会补齐。';
    },
    get capabilities() {
      return actorCapabilities;
    },
    async listCustomers(options) {
      if (isEmptyScope()) return page([], options);
      failIfNeeded();
      return page(filterByStatus(customers, options), options);
    },
    async getCustomer(id) {
      failIfNeeded();
      return result(findById(customers, id));
    },
    async createCustomer(input) {
      failIfNeeded(true);
      requireCapability('customer.create');
      const customer = makeCustomer(input, customers.length + 1);
      customers = [customer, ...customers];
      return result(customer);
    },
    async updateCustomer(id, input, etag) {
      failIfNeeded(true);
      requireCapability('customer.update');
      const current = findById(customers, id);
      assertEtag(current, etag);
      customers = customers.map((customer) => customer.id === id ? updateCustomerRecord(customer, input) : customer);
      return result(findById(customers, id));
    },
    async commandCustomer(id, input, etag) {
      failIfNeeded(true);
      const current = findById(customers, id);
      assertEtag(current, etag);
      customers = customers.map((customer) => customer.id === id ? applyCustomerCommand(customer, input, actorUserId, actorCapabilities) : customer);
      return result(findById(customers, id));
    },

    async listProducts(options) {
      if (isEmptyScope()) return page([], options);
      failIfNeeded();
      return page(filterByStatus(products, options), options);
    },
    async getProduct(id) {
      failIfNeeded();
      return result(findById(products, id));
    },
    async createProduct(input) {
      failIfNeeded(true);
      requireCapability('product.create');
      const product: Product = { ...input, id: `00000000-0000-4000-8000-${String(500 + products.length).padStart(12, '0')}`, organizationId: ORG_ID, version: 1, createdAt: now, updatedAt: now, status: 'ACTIVE' };
      products.unshift(product);
      return result(product);
    },
    async updateProduct(id, input, etag) {
      failIfNeeded(true);
      requireCapability('product.update');
      const index = products.findIndex((item) => item.id === id);
      if (index < 0) throw notFound(id);
      const current = products[index];
      if (!current) throw notFound(id);
      assertEtag(current, etag);
      const next = updateProductRecord(current, input);
      products[index] = next;
      return result(next);
    },
    async listSkus(options) {
      if (isEmptyScope()) return page([], options);
      failIfNeeded();
      return page(filterByStatus(skus, options), options);
    },
    async getSku(id) {
      failIfNeeded();
      return result(findById(skus, id));
    },
    async createSku(input) {
      failIfNeeded(true);
      requireCapability('sku.create');
      const sku: Sku = { ...input, id: `00000000-0000-4000-8000-${String(600 + skus.length).padStart(12, '0')}`, organizationId: ORG_ID, version: 1, createdAt: now, updatedAt: now, baseUnit: input.unit, trackingMode: 'NONE', lowStockThreshold: '0', status: 'ACTIVE' };
      skus.unshift(sku);
      return result(sku);
    },
    async updateSku(id, input, etag) {
      failIfNeeded(true);
      requireCapability('sku.update');
      const index = skus.findIndex((item) => item.id === id);
      if (index < 0) throw notFound(id);
      const current = skus[index];
      if (!current) throw notFound(id);
      assertEtag(current, etag);
      const next = updateSkuRecord(current, input);
      skus[index] = next;
      return result(next);
    },

    async listOrders(options) {
      if (isEmptyScope()) return page([], options);
      failIfNeeded();
      return page(filterByStatus(orders, options), options);
    },
    async getOrder(id) {
      failIfNeeded();
      return result(findById(orders, id));
    },
    async createOrder(input) {
      failIfNeeded(true);
      requireCapability('order.create');
      const order: Order = { ...input, id: `00000000-0000-4000-8000-${String(700 + orders.length).padStart(12, '0')}`, organizationId: ORG_ID, version: 1, createdAt: now, updatedAt: now, status: 'DRAFT', totalAmount: '0', allowedTransitions: ['CONFIRM', 'CANCEL'], history: [{ action: 'CREATED', at: now, status: 'DRAFT' }] };
      orders.unshift(order);
      return result(order);
    },
    async updateOrder(id, input, etag) {
      failIfNeeded(true);
      requireCapability('order.update');
      const index = orders.findIndex((item) => item.id === id);
      if (index < 0) throw notFound(id);
      const current = orders[index];
      if (!current) throw notFound(id);
      assertEtag(current, etag);
      const next = updateOrderRecord(current, input);
      orders[index] = next;
      return result(next);
    },
    async transitionOrder(id, input, etag) {
      failIfNeeded(true);
      requireCapability('order.transition');
      const index = orders.findIndex((item) => item.id === id);
      if (index < 0) throw notFound(id);
      const current = orders[index];
      if (!current) throw notFound(id);
      assertEtag(current, etag);
      const allowed = current.allowedTransitions ?? [];
      if (!allowed.includes(input.action)) throw new DomainApiError({ problem: problem(409, 'ORDER_TRANSITION_NOT_ALLOWED', '订单当前阶段不允许此动作。') });
      const status = transitionStatus(input.action, current.status);
      const next: Order = { ...current, status, version: current.version + 1, updatedAt: later, allowedTransitions: status === 'DRAFT' ? ['CONFIRM', 'CANCEL'] : status === 'CONFIRMED' ? ['FULFILL', 'CANCEL'] : [], history: [...(current.history ?? []), { action: input.action, at: later, status }] };
      orders[index] = next;
      return result(next);
    },
  };

  Object.defineProperty(api, 'setScenario', { value: (next: FixtureScenario) => { scenario = next; } });
  return api;

  function isEmptyScope(): boolean {
    return scenario === 'empty' || scenario === 'empty-group';
  }

  function failIfNeeded(mutation = false): void {
    if (scenario === 'empty' || scenario === 'empty-group') {
      if (!mutation) throw notFound('scope');
      throw new DomainApiError({ problem: problem(403, 'PERMISSION_DENIED', '当前身份未获准执行此操作。') });
    }
    if (scenario === 'forbidden') throw new DomainApiError({ problem: problem(403, 'PERMISSION_DENIED', '当前身份没有访问此业务范围的权限。') });
    if (scenario === 'offline') throw new DomainApiError({ problem: problem(503, 'DEPENDENCY_UNAVAILABLE', '业务服务暂时不可用。') });
    if (scenario === 'error') throw new DomainApiError({ problem: problem(500, 'INTERNAL_ERROR', '业务服务返回了无法处理的错误。') });
    if (mutation && scenario === 'conflict') throw new DomainApiError({ problem: problem(409, 'VERSION_CONFLICT', '内容已被其他人更新，请刷新后重做。') });
    if (mutation && scenario === 'precondition') throw new DomainApiError({ problem: problem(428, 'PRECONDITION_REQUIRED', '此操作需要最新版本标识，请先刷新。') });
  }

  function requireCapability(capability: string): void {
    if (!actorCapabilities.includes(capability)) {
      throw new DomainApiError({ problem: problem(403, 'CAPABILITY_REQUIRED', '当前身份不能执行此操作。') });
    }
  }
}

function page<T>(items: readonly T[], options: ListOptions | undefined): ResourcePage<T> {
  const pageSize = 20;
  const start = options?.cursor === 'fixture-next' ? pageSize : 0;
  const data = items.slice(start, start + pageSize);
  const hasNext = start + data.length < items.length;
  return { data, page: { nextCursor: hasNext ? 'fixture-next' : null, hasNext } };
}

function filterByStatus<T extends { status: string }>(items: readonly T[], options: ListOptions | undefined): readonly T[] {
  const filtered = options?.status ? items.filter((item) => item.status === options.status) : [...items];
  const sort = options?.sort;
  if (!sort) return filtered;
  const clauses = sort.split(',').map((clause) => ({
    descending: clause.startsWith('-'),
    key: clause.startsWith('-') ? clause.slice(1) : clause,
  }));
  const sorted = [...filtered];
  sorted.sort((left: T, right: T) => {
    for (const clause of clauses) {
      const leftValue = String((left as Record<string, unknown>)[clause.key] ?? '');
      const rightValue = String((right as Record<string, unknown>)[clause.key] ?? '');
      if (leftValue === rightValue) continue;
      const direction = leftValue < rightValue ? -1 : 1;
      return clause.descending ? -direction : direction;
    }
    return 0;
  });
  return sorted;
}

function result<T>(data: T): ResourceResult<T> {
  return { kind: 'resource', data, etag: `"v${(data as { version?: number }).version ?? 1}"`, requestId: '00000000-0000-4000-8000-000000000999' };
}

function assertEtag(resource: { version?: number }, etag: string): void {
  if (!etag) throw new DomainApiError({ problem: problem(428, 'PRECONDITION_REQUIRED', '此操作需要最新版本标识，请先刷新。') });
  const expected = `"v${resource.version ?? 1}"`;
  if (etag !== expected) throw new DomainApiError({ problem: problem(409, 'VERSION_CONFLICT', '内容已被其他人更新，请刷新后重做。') });
}

function findById<T extends { id: string }>(items: readonly T[], id: string): T {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw notFound(id);
  return item;
}

function notFound(id: string): DomainApiError {
  return new DomainApiError({ problem: problem(404, 'RESOURCE_NOT_FOUND', `没有找到资源 ${id}。`) });
}

function problem(status: number, code: string, title: string): { type: string; title: string; status: number; code: string; retryable: boolean } {
  return { type: `urn:autoflow:problem:${code.toLowerCase()}`, title, status, code, retryable: status >= 500 };
}

function makeCustomer(input: CustomerCreateInput, attemptNo: number): Customer {
  return {
    ...input,
    id: `00000000-0000-4000-8000-${String(800 + attemptNo).padStart(12, '0')}`,
    organizationId: ORG_ID,
    version: 1,
    createdAt: now,
    updatedAt: now,
    status: 'DRAFT',
    name: input.name,
    capabilities: ['customer.read', 'customer.update', 'customer.submitApproval'],
    allowedTransitions: ['SUBMIT_APPROVAL'],
  };
}

function applyCustomerCommand(customer: Customer, input: CustomerCommandInput, actorUserId: string, actorCapabilities: readonly string[]): Customer {
  const requiredCapability: Record<CustomerCommandInput['action'], string> = {
    SUBMIT_APPROVAL: 'customer.submitApproval',
    APPROVE: 'customer.approve',
    REJECT: 'customer.reject',
    REASSIGN: 'customer.reassign',
  };
  if (!customer.allowedTransitions?.includes(input.action)) {
    throw new DomainApiError({ problem: problem(409, 'CUSTOMER_TRANSITION_NOT_ALLOWED', '客户当前状态不允许此动作。') });
  }
  if (!actorCapabilities.includes(requiredCapability[input.action]) || !customer.capabilities?.includes(requiredCapability[input.action])) {
    throw new DomainApiError({ problem: problem(403, 'CAPABILITY_REQUIRED', '当前身份不能执行此客户动作。') });
  }
  if ((input.action === 'APPROVE' || input.action === 'REJECT') && customer.ownerUserId === actorUserId) {
    throw new DomainApiError({ problem: problem(403, 'SELF_APPROVAL_NOT_ALLOWED', '提交者不能审批自己的客户。') });
  }
  if (input.action === 'REJECT' && !input.reason?.trim()) {
    throw new DomainApiError({ problem: problem(422, 'REASON_REQUIRED', '驳回必须填写原因。') });
  }
  if (input.action === 'REASSIGN' && (!input.assigneeUserId || input.assigneeUserId === customer.ownerUserId)) {
    throw new DomainApiError({ problem: problem(422, 'ASSIGNEE_REQUIRED', '交接必须选择不同的负责人。') });
  }
  if (input.action === 'REASSIGN') {
    return { ...customer, ...(input.assigneeUserId ? { ownerUserId: input.assigneeUserId } : {}), version: customer.version + 1, updatedAt: later };
  }
  if (input.action === 'SUBMIT_APPROVAL') {
    return { ...customer, status: 'PENDING_APPROVAL', version: customer.version + 1, updatedAt: later, approvalSummary: { latestOutcome: 'PENDING', attemptId: customer.approvalSummary?.attemptId ?? '00000000-0000-4000-8000-000000000599', attemptNo: (customer.approvalSummary?.attemptNo ?? 0) + 1, canResubmit: false }, allowedTransitions: ['APPROVE', 'REJECT'] };
  }
  if (input.action === 'APPROVE') {
    return { ...customer, status: 'APPROVED', version: customer.version + 1, updatedAt: later, ...(customer.approvalSummary ? { approvalSummary: { ...customer.approvalSummary, latestOutcome: 'APPROVED', canResubmit: false } } : {}), allowedTransitions: [] };
  }
  return { ...customer, status: 'DRAFT', version: customer.version + 1, updatedAt: later, ...(customer.approvalSummary ? { approvalSummary: { ...customer.approvalSummary, latestOutcome: 'REJECTED', ...(input.reason ? { reason: input.reason } : {}), canResubmit: true } } : {}), allowedTransitions: ['SUBMIT_APPROVAL', 'REASSIGN'] };
}

function updateCustomerRecord(customer: Customer, input: CustomerUpdateInput): Customer {
  return {
    ...customer,
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.ownerUserId !== undefined ? { ownerUserId: input.ownerUserId } : {}),
    ...(input.businessGroupId !== undefined ? { businessGroupId: input.businessGroupId } : {}),
    ...(input.contacts !== undefined ? { contacts: input.contacts } : {}),
    version: customer.version + 1,
    updatedAt: later,
  };
}

function updateProductRecord(product: Product, input: ProductUpdateInput): Product {
  return {
    ...product,
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.unit !== undefined ? { unit: input.unit } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
    ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    version: product.version + 1,
    updatedAt: later,
  };
}

function updateSkuRecord(sku: Sku, input: SkuUpdateInput): Sku {
  return {
    ...sku,
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.unit !== undefined ? { unit: input.unit } : {}),
    ...(input.price !== undefined ? { price: input.price } : {}),
    ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    version: sku.version + 1,
    updatedAt: later,
  };
}

function updateOrderRecord(order: Order, input: OrderUpdateInput): Order {
  return {
    ...order,
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    version: order.version + 1,
    updatedAt: later,
  };
}

function transitionStatus(action: string, current: Order['status']): Order['status'] {
  if (action === 'CONFIRM' && current === 'DRAFT') return 'CONFIRMED';
  if (action === 'FULFILL' && current === 'CONFIRMED') return 'FULFILLED';
  if (action === 'CANCEL' && current !== 'FULFILLED') return 'CANCELLED';
  return current;
}
