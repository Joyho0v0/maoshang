import { describe, expect, it, vi } from 'vitest';
import type { PoolClient } from 'pg';
import type { AuthorizationPrincipal } from '../../apps/api/src/modules/identity/domain/authz.js';
import { CrmService, type CrmStore, toCustomerApi } from '../../apps/api/src/modules/crm/application/crm.service.js';
import { CatalogService, type CatalogStore } from '../../apps/api/src/modules/catalog/application/catalog.service.js';
import { calculateOrderTotal, OrdersService, type OrdersStore } from '../../apps/api/src/modules/orders/application/orders.service.js';
import { PostgresOrdersStore } from '../../apps/api/src/modules/orders/infrastructure/postgres-orders.store.js';

const orgId = '00000000-0000-4000-8000-000000000001';
const actorId = '00000000-0000-4000-8000-000000000002';
const groupId = '00000000-0000-4000-8000-000000000003';
const attackerId = '00000000-0000-4000-8000-000000000004';

function principal(overrides: Partial<AuthorizationPrincipal> = {}): AuthorizationPrincipal {
  return {
    userId: actorId,
    organizationId: orgId,
    status: 'ACTIVE',
    permissions: new Set(['customer.create', 'customer.read', 'catalog.read', 'catalog.write']),
    scopes: new Map([
      ['CUSTOMER', { resourceType: 'CUSTOMER', scopeType: 'OWN', groupIds: [] }],
      ['ORGANIZATION', { resourceType: 'ORGANIZATION', scopeType: 'ALL_ORG', groupIds: [] }],
    ]),
    authzVersion: 1,
    sessionEpoch: 1,
    ...overrides,
  };
}

function orderPrincipal(overrides: Partial<AuthorizationPrincipal> = {}): AuthorizationPrincipal {
  return principal({
    permissions: new Set(['order.read', 'order.create', 'order.update']),
    scopes: new Map([
      ['ORDER', { resourceType: 'ORDER', scopeType: 'ALL_ORG', groupIds: [] }],
      ['CUSTOMER', { resourceType: 'CUSTOMER', scopeType: 'ALL_ORG', groupIds: [] }],
      ['ORGANIZATION', { resourceType: 'ORGANIZATION', scopeType: 'ALL_ORG', groupIds: [] }],
    ]),
    ...overrides,
  });
}

function orderRecord(overrides: Partial<NonNullable<Awaited<ReturnType<OrdersStore['findOrder']>>>> = {}) {
  return {
    id: '00000000-0000-4000-8000-000000000010', organizationId: orgId, version: 1,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    customerId: '00000000-0000-4000-8000-000000000011', orderNo: 'O-1', ownerUserId: actorId,
    businessGroupId: groupId, currency: 'CNY', status: 'DRAFT' as const, stage: 'INITIAL_CONTACT' as const,
    lines: [], totalAmount: '0.0000', ...overrides,
  };
}

describe('CRM/Catalog/Orders application services', () => {
  it('derives customer owner and group from the authenticated session', async () => {
    const store = {
      resolvePrimaryBusinessGroup: vi.fn().mockResolvedValue(groupId),
      insertCustomer: vi.fn().mockResolvedValue({ id: 'customer-1', ownerUserId: actorId, businessGroupId: groupId }),
    } as unknown as CrmStore;
    const service = new CrmService(store);

    await service.createCustomer(principal(), { name: 'Acme', ownerUserId: attackerId, businessGroupId: attackerId, contacts: [] }, '00000000-0000-4000-8000-000000000005', {} as PoolClient);

    expect(store.insertCustomer).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ ownerUserId: actorId, businessGroupId: groupId }));
    expect(store.insertCustomer).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ ownerUserId: attackerId, businessGroupId: attackerId }));
  });

  it('keeps catalog writes behind the catalog.write permission', async () => {
    const store = { insertProduct: vi.fn().mockResolvedValue({ id: 'product-1' }) } as unknown as CatalogStore;
    const service = new CatalogService(store);

    await expect(service.createProduct(principal({ permissions: new Set(['catalog.read']) }), { name: 'Widget', productCode: 'W-1', unit: 'PCS' }, 'request-1', {} as PoolClient)).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
    expect(store.insertProduct).not.toHaveBeenCalled();
  });

  it('records permission and version denials without exposing a write path', async () => {
    const audit = vi.fn().mockResolvedValue(undefined);
    const store = {
      insertProduct: vi.fn(),
      recordAudit: audit,
      findProduct: vi.fn().mockResolvedValue({ id: 'product-1', organizationId: orgId, version: 3 }),
    } as unknown as CatalogStore;
    const service = new CatalogService(store);
    await expect(service.createProduct(principal({ permissions: new Set(['catalog.read']) }), { name: 'Widget', productCode: 'W-1', unit: 'PCS' }, 'request-denied', {} as PoolClient)).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
    await expect(service.updateProduct(principal(), 'product-1', 2, { name: 'New' }, 'request-conflict', {} as PoolClient)).rejects.toMatchObject({ code: 'VERSION_CONFLICT' });
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'DENIED', reason: 'permission-denied', requestId: 'request-denied' }));
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'FAILED', reason: 'version-conflict', requestId: 'request-conflict' }));
  });

  it('sums order line amounts using DecimalString arithmetic', () => {
    expect(calculateOrderTotal([
      { skuId: 'sku-1', quantity: '0.10', unitPrice: '0.20' },
      { skuId: 'sku-2', quantity: '2', unitPrice: '3.50' },
    ])).toBe('7.0200');
  });

  it('rejects direct order status writes and terminal order transitions', async () => {
    const cancelled = orderRecord({ status: 'CANCELLED', stage: 'INITIAL_CONTACT' });
    const store = {
      findOrder: vi.fn().mockResolvedValue(cancelled),
      updateOrder: vi.fn(),
      transitionOrder: vi.fn(),
    } as unknown as OrdersStore;
    const service = new OrdersService(store);

    await expect(service.updateOrder(orderPrincipal(), cancelled.id, 1, { status: 'CONFIRMED' }, 'request-1', {} as PoolClient))
      .rejects.toMatchObject({ code: 'STATE_CONFLICT' });
    await expect(service.transitionOrder(orderPrincipal(), cancelled.id, 1, { action: 'QUOTE_FOLLOW_UP' }, 'request-2', {} as PoolClient))
      .rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
    expect(store.updateOrder).not.toHaveBeenCalled();
    expect(store.transitionOrder).not.toHaveBeenCalled();
  });

  it('projects cancelled orders as terminal and never exposes allowed transitions', async () => {
    const cancelled = orderRecord({ status: 'CANCELLED' });
    const store = { findOrder: vi.fn().mockResolvedValue(cancelled) } as unknown as OrdersStore;
    const projected = await new OrdersService(store).getOrder(orderPrincipal(), cancelled.id);
    expect(projected.allowedTransitions).toEqual([]);
    expect(projected.capabilities).toEqual([]);
  });

  it('projects the same customer fields for list and detail without sensitive approval fields', async () => {
    const customer = {
      id: 'customer-1', organizationId: orgId, name: 'Acme', ownerUserId: actorId, businessGroupId: groupId,
      status: 'PENDING_APPROVAL' as const, contacts: [], version: 1,
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
      approvalSummary: { latestOutcome: 'PENDING', attemptId: 'attempt-1', attemptNo: 2, reason: 'secret', decidedAt: '2026-01-01T00:00:00.000Z', decidedBy: 'approver', canResubmit: false },
    };
    const store = { listCustomers: vi.fn().mockResolvedValue({ data: [customer], page: { nextCursor: null, hasNext: false } }), findCustomer: vi.fn().mockResolvedValue(customer) } as unknown as CrmStore;
    const readOnly = principal({ permissions: new Set(['customer.read']), scopes: new Map([['CUSTOMER', { resourceType: 'CUSTOMER', scopeType: 'ALL_ORG', groupIds: [] }]]) });
    const service = new CrmService(store);
    const listed = await service.listCustomers(readOnly, {});
    const fetched = await service.getCustomer(readOnly, customer.id);
    expect(listed.data[0]?.approvalSummary).toEqual({ latestOutcome: 'PENDING', attemptId: 'attempt-1', attemptNo: 2, canResubmit: false });
    expect(fetched.approvalSummary).toEqual(listed.data[0]?.approvalSummary);
    expect(toCustomerApi(fetched, readOnly)).toMatchObject({ name: 'Acme' });
    expect(toCustomerApi(fetched, readOnly).approvalSummary).not.toHaveProperty('reason');
  });

  it('maps deterministic decimal input failures to validation problems', async () => {
    const catalogStore = { insertSku: vi.fn() } as unknown as CatalogStore;
    const catalog = new CatalogService(catalogStore);
    await expect(catalog.createSku(principal(), { productId: 'p', skuCode: 'S', name: 'Sku', unit: 'PCS', price: '-1' }, 'request-3', {} as PoolClient))
      .rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 400 });
    expect(catalogStore.insertSku).not.toHaveBeenCalled();

    const orderStore = { findCustomerVisibility: vi.fn().mockResolvedValue({ organizationId: orgId, ownerUserId: actorId, businessGroupId: groupId }), resolvePrimaryBusinessGroup: vi.fn().mockResolvedValue(groupId), insertOrder: vi.fn() } as unknown as OrdersStore;
    const orders = new OrdersService(orderStore);
    await expect(orders.createOrder(orderPrincipal(), { customerId: 'customer-1', orderNo: 'O-2', currency: 'CNY', lines: [{ skuId: 'sku-1', quantity: '0', unitPrice: '1.00000' }] }, 'request-4', {} as PoolClient))
      .rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 400 });
    expect(orderStore.insertOrder).not.toHaveBeenCalled();
  });

  it('loads order lines in one batch query for a page instead of one query per order', async () => {
    const rows = [1, 2].map((index) => ({ id: `00000000-0000-4000-8000-00000000001${index}`, organization_id: orgId, version: 1, created_at: new Date('2026-01-01T00:00:00.000Z'), updated_at: new Date('2026-01-01T00:00:00.000Z'), customer_id: 'customer-1', order_no: `O-${index}`, owner_user_id: actorId, business_group_id: groupId, currency: 'CNY', status: 'DRAFT', stage: 'INITIAL_CONTACT', total_amount: '1.0000', metadata: {} }));
    const query = vi.fn(async (text: string) => text.includes('orders.order_header') ? { rows, rowCount: rows.length } : { rows: rows.map((row) => ({ order_id: row.id, sku_id: 'sku-1', quantity: '1.000000', unit_price: '1.0000' })), rowCount: rows.length });
    const store = new PostgresOrdersStore({ query } as never);
    const page = await store.listOrders(orderPrincipal(), { size: 2 });
    expect(page.data).toHaveLength(2);
    expect(page.data.every((order) => order.lines.length === 1)).toBe(true);
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[1]?.[0]).toContain('order_id = ANY');
  });
});
