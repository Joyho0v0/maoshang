import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient, QueryResultRow } from 'pg';
import { createCursor, parseCursor, parsePageSize, parseSort } from '../../../common/http/cursor.js';
import { DomainProblemError } from '../../../common/http/domain-error.js';
import type { AuthorizationPrincipal } from '../../identity/domain/authz.js';
import { multiplyDecimalStrings } from '../../catalog/domain/catalog.js';
import { statusForStage, type OrderStage } from '../domain/orders.js';
import type { CustomerVisibility } from '../../crm/domain/crm.js';
import type { OrderLineInput, OrderPage, OrderRecord, OrdersStore } from '../application/orders.service.js';

interface OrderRow extends QueryResultRow { id: string; organization_id: string; version: number | string; created_at: Date; updated_at: Date; customer_id: string; order_no: string; owner_user_id: string; business_group_id: string | null; currency: string; status: OrderRecord['status']; stage: OrderStage; total_amount: string; metadata: Record<string, unknown>; }
interface ItemRow extends QueryResultRow { sku_id: string; quantity: string; unit_price: string; }

export class PostgresOrdersStore implements OrdersStore {
  constructor(private readonly pool: Pool) {}

  async resolvePrimaryBusinessGroup(client: PoolClient, organizationId: string, userId: string): Promise<string | undefined> {
    const result = await client.query<{ business_group_id: string }>(`SELECT business_group_id FROM org.membership WHERE organization_id = $1 AND user_id = $2 AND status = 'ACTIVE' AND valid_to IS NULL ORDER BY is_primary DESC, id LIMIT 1`, [organizationId, userId]);
    return result.rows[0]?.business_group_id;
  }

  async findCustomerVisibility(organizationId: string, customerId: string, client: PoolClient): Promise<CustomerVisibility | undefined> {
    const result = await client.query<{ organization_id: string; owner_user_id: string; business_group_id: string | null }>('SELECT organization_id, owner_user_id, business_group_id FROM crm.customer WHERE organization_id = $1 AND id = $2', [organizationId, customerId]);
    const row = result.rows[0];
    return row === undefined ? undefined : { organizationId: row.organization_id, ownerUserId: row.owner_user_id, ...(row.business_group_id === null ? {} : { businessGroupId: row.business_group_id }) };
  }

  async findOrder(organizationId: string, id: string, client?: PoolClient): Promise<OrderRecord | undefined> {
    const executor = client ?? this.pool;
    const result = await executor.query<OrderRow>(`SELECT id, organization_id, version, created_at, updated_at, customer_id, order_no, owner_user_id, business_group_id, currency, status, stage, total_amount::text, metadata FROM orders.order_header WHERE organization_id = $1 AND id = $2${client === undefined ? '' : ' FOR UPDATE'}`, [organizationId, id]);
    const row = result.rows[0]; if (row === undefined) return undefined;
    const items = await executor.query<ItemRow>(`SELECT sku_id, quantity::text, unit_price::text FROM orders.order_item WHERE organization_id = $1 AND order_id = $2 ORDER BY line_no, id`, [organizationId, id]);
    return mapOrder(row, items.rows.map((item) => ({ skuId: item.sku_id, quantity: item.quantity, unitPrice: item.unit_price })));
  }

  async listOrders(principal: AuthorizationPrincipal, filters: { after?: string; size?: number; sort?: string; statuses?: readonly string[] }): Promise<OrderPage> {
    const sort = parseSort(filters.sort); const size = parsePageSize(filters.size); const filter = { statuses: filters.statuses ?? [] }; const cursor = parseCursor(filters.after, sort, filter); const sortColumn = sort.includes('createdAt') ? 'created_at' : 'updated_at';
    const values: unknown[] = [principal.organizationId]; const conditions = ['o.organization_id = $1']; let index = 1;
    const scope = principal.scopes.get('ORDER');
    if (scope === undefined || (scope.scopeType === 'GROUP_SET' && scope.groupIds.length === 0)) conditions.push('1 = 0');
    else if (scope.scopeType === 'OWN') { values.push(principal.userId); conditions.push(`o.owner_user_id = $${++index}`); }
    else if (scope.scopeType === 'GROUP_SET') { values.push(scope.groupIds); conditions.push(`o.business_group_id = ANY($${++index}::uuid[])`); }
    if (filter.statuses.length > 0) { values.push(filter.statuses); conditions.push(`o.status = ANY($${++index}::text[])`); }
    if (cursor !== undefined) { values.push(cursor.updatedAt, cursor.id); conditions.push(sort.startsWith('-') ? `(o.${sortColumn}, o.id) < ($${++index}::timestamptz, $${++index}::uuid)` : `(o.${sortColumn}, o.id) > ($${++index}::timestamptz, $${++index}::uuid)`); }
    values.push(size + 1);
    const result = await this.pool.query<OrderRow>(`SELECT o.id, o.organization_id, o.version, o.created_at, o.updated_at, o.customer_id, o.order_no, o.owner_user_id, o.business_group_id, o.currency, o.status, o.stage, o.total_amount::text, o.metadata FROM orders.order_header AS o WHERE ${conditions.join(' AND ')} ORDER BY o.${sortColumn} ${sort.startsWith('-') ? 'DESC' : 'ASC'}, o.id ${sort.startsWith('-') ? 'DESC' : 'ASC'} LIMIT $${++index}`, values);
    const rows = result.rows.slice(0, size); const hasNext = result.rows.length > size; const data: OrderRecord[] = [];
    for (const row of rows) { const items = await this.pool.query<ItemRow>(`SELECT sku_id, quantity::text, unit_price::text FROM orders.order_item WHERE organization_id = $1 AND order_id = $2 ORDER BY line_no, id`, [principal.organizationId, row.id]); data.push(mapOrder(row, items.rows.map((item) => ({ skuId: item.sku_id, quantity: item.quantity, unitPrice: item.unit_price })))); }
    const last = rows.at(-1);
    return { data, page: { hasNext, nextCursor: hasNext && last !== undefined ? createCursor({ updatedAt: (sortColumn === 'created_at' ? last.created_at : last.updated_at).toISOString(), id: last.id }, sort, filter) : null } };
  }

  async insertOrder(client: PoolClient, input: { id: string; organizationId: string; customerId: string; orderNo: string; ownerUserId: string; businessGroupId?: string; currency: string; stage: OrderStage; totalAmount: string; metadata: Record<string, unknown>; lines: readonly OrderLineInput[]; actorUserId: string; requestId: string }): Promise<OrderRecord> {
    await client.query(`INSERT INTO orders.order_header (id, organization_id, customer_id, order_no, owner_user_id, business_group_id, currency, stage, total_amount, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::numeric, $10::jsonb)`, [input.id, input.organizationId, input.customerId, input.orderNo, input.ownerUserId, input.businessGroupId ?? null, input.currency, input.stage, input.totalAmount, JSON.stringify(input.metadata)]);
    for (const [index, line] of input.lines.entries()) {
      const sku = await client.query<{ id: string; name: string; unit: string; sku_code: string }>('SELECT id, name, unit, sku_code FROM catalog.sku WHERE organization_id = $1 AND id = $2 AND status = \'ACTIVE\'', [input.organizationId, line.skuId]);
      const skuRow = sku.rows[0]; if (skuRow === undefined) throw new DomainProblemError('BUSINESS_RULE_VIOLATION', 409);
      const snapshotId = randomUUID();
      await client.query(`INSERT INTO catalog.price_snapshot (id, organization_id, sku_id, currency, unit_price, snapshot) VALUES ($1, $2, $3, $4, $5::numeric, $6::jsonb)`, [snapshotId, input.organizationId, line.skuId, input.currency, line.unitPrice, JSON.stringify({ skuId: line.skuId, skuCode: skuRow.sku_code, name: skuRow.name, unit: skuRow.unit, capturedBy: input.actorUserId })]);
      await client.query(`INSERT INTO orders.order_item (id, organization_id, order_id, line_no, item_kind, sku_id, item_name, unit, quantity, unit_price, line_amount, currency, price_snapshot_id, product_snapshot) VALUES ($1, $2, $3, $4, 'STANDARD', $5, $6, $7, $8::numeric, $9::numeric, $10::numeric, $11, $12, $13::jsonb)`, [randomUUID(), input.organizationId, input.id, index + 1, line.skuId, skuRow.name, skuRow.unit, line.quantity, line.unitPrice, multiplyDecimalStrings(line.quantity, line.unitPrice), input.currency, snapshotId, JSON.stringify({ skuId: line.skuId, skuCode: skuRow.sku_code, name: skuRow.name, unit: skuRow.unit })]);
    }
    await client.query(`INSERT INTO orders.stage_history (id, organization_id, order_id, from_stage, to_stage, actor_user_id, reason) VALUES ($1, $2, $3, NULL, $4, $5, 'Order created')`, [randomUUID(), input.organizationId, input.id, input.stage, input.actorUserId]);
    await client.query(`INSERT INTO orders.ownership_history (id, organization_id, order_id, to_owner_user_id, to_business_group_id, actor_user_id, reason) VALUES ($1, $2, $3, $4, $5, $6, 'Order created')`, [randomUUID(), input.organizationId, input.id, input.ownerUserId, input.businessGroupId ?? null, input.actorUserId]);
    await audit(client, input.organizationId, input.actorUserId, 'order.created', input.id, input.requestId, { status: 'DRAFT', stage: input.stage });
    await outbox(client, input.organizationId, input.id, 'order.created', { orderId: input.id, requestId: input.requestId });
    const value = await this.findOrder(input.organizationId, input.id, client); if (value === undefined) throw new Error('Order insert returned no row.'); return value;
  }

  async updateOrder(client: PoolClient, input: { organizationId: string; id: string; expectedVersion: number; status?: OrderRecord['status']; metadata?: Record<string, unknown>; actorUserId: string; requestId: string }): Promise<OrderRecord> {
    const result = await client.query(`UPDATE orders.order_header SET status = COALESCE($4, status), metadata = COALESCE($5::jsonb, metadata), version = version + 1, updated_at = clock_timestamp() WHERE organization_id = $1 AND id = $2 AND version = $3`, [input.organizationId, input.id, input.expectedVersion, input.status ?? null, input.metadata === undefined ? null : JSON.stringify(input.metadata)]);
    if (result.rowCount !== 1) throw await this.versionConflict(client, input.organizationId, input.id);
    await audit(client, input.organizationId, input.actorUserId, 'order.updated', input.id, input.requestId, input.status === undefined ? {} : { status: input.status });
    await outbox(client, input.organizationId, input.id, 'order.updated', { orderId: input.id, requestId: input.requestId });
    const value = await this.findOrder(input.organizationId, input.id, client); if (value === undefined) throw new Error('Updated order disappeared.'); return value;
  }

  async transitionOrder(client: PoolClient, input: { organizationId: string; id: string; expectedVersion: number; action: string; reason?: string; actorUserId: string; requestId: string }): Promise<OrderRecord> {
    const current = await this.findOrder(input.organizationId, input.id, client); if (current === undefined) throw new DomainProblemError('RESOURCE_NOT_FOUND', 404); if (current.version !== input.expectedVersion) throw await this.versionConflict(client, input.organizationId, input.id);
    if (input.action === 'CANCEL') {
      await client.query(`UPDATE orders.order_header SET status = 'CANCELLED', version = version + 1, updated_at = clock_timestamp() WHERE organization_id = $1 AND id = $2 AND version = $3`, [input.organizationId, input.id, input.expectedVersion]);
    } else {
      const next = input.action as OrderStage; await client.query(`UPDATE orders.order_header SET stage = $4, status = $5, version = version + 1, updated_at = clock_timestamp() WHERE organization_id = $1 AND id = $2 AND version = $3`, [input.organizationId, input.id, input.expectedVersion, next, statusForStage(next)]);
      await client.query(`INSERT INTO orders.stage_history (id, organization_id, order_id, from_stage, to_stage, actor_user_id, reason) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [randomUUID(), input.organizationId, input.id, current.stage, next, input.actorUserId, input.reason ?? null]);
    }
    await audit(client, input.organizationId, input.actorUserId, input.action === 'CANCEL' ? 'order.cancelled' : 'order.transitioned', input.id, input.requestId, { action: input.action });
    await outbox(client, input.organizationId, input.id, input.action === 'CANCEL' ? 'order.cancelled' : 'order.transitioned', { orderId: input.id, action: input.action, requestId: input.requestId });
    const value = await this.findOrder(input.organizationId, input.id, client); if (value === undefined) throw new Error('Transitioned order disappeared.'); return value;
  }

  private async versionConflict(client: PoolClient, organizationId: string, id: string): Promise<DomainProblemError> { const result = await client.query<{ version: number }>('SELECT version FROM orders.order_header WHERE organization_id = $1 AND id = $2', [organizationId, id]); const version = result.rows[0]?.version; return version === undefined ? new DomainProblemError('RESOURCE_NOT_FOUND', 404) : new DomainProblemError('VERSION_CONFLICT', 409, { currentVersion: version, currentEtag: `"v${version}"`, resourceHref: `/api/v1/orders/${id}` }); }
}

function mapOrder(row: OrderRow, lines: readonly OrderLineInput[]): OrderRecord { return { id: row.id, organizationId: row.organization_id, version: Number(row.version), createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(), customerId: row.customer_id, orderNo: row.order_no, ownerUserId: row.owner_user_id, ...(row.business_group_id === null ? {} : { businessGroupId: row.business_group_id }), currency: row.currency, status: row.status, stage: row.stage, lines, totalAmount: row.total_amount, metadata: row.metadata }; }
async function audit(client: PoolClient, organizationId: string, actorUserId: string, action: string, resourceId: string, requestId: string, after: Record<string, unknown>): Promise<void> { await client.query(`INSERT INTO audit.audit_event (id, organization_id, actor_user_id, action, resource_type, resource_id, outcome, request_id, after_summary) VALUES ($1, $2, $3, $4, 'ORDER', $5, 'SUCCEEDED', $6, $7::jsonb)`, [randomUUID(), organizationId, actorUserId, action, resourceId, requestId, JSON.stringify(after)]); }
async function outbox(client: PoolClient, organizationId: string, aggregateId: string, eventType: string, payload: Record<string, unknown>): Promise<void> { await client.query(`INSERT INTO integration.outbox_event (id, organization_id, aggregate_type, aggregate_id, event_type, payload) VALUES ($1, $2, 'ORDER', $3, $4, $5::jsonb)`, [randomUUID(), organizationId, aggregateId, eventType, JSON.stringify(payload)]); }
