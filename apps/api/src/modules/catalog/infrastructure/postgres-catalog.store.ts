import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient, QueryResultRow } from 'pg';
import { createCursor, parseCursor, parsePageSize, parseSort } from '../../../common/http/cursor.js';
import { DomainProblemError } from '../../../common/http/domain-error.js';
import type { AuthorizationPrincipal } from '../../identity/domain/authz.js';
import type { CatalogPage, CatalogStore, ProductCreateInput, ProductRecord, ProductUpdateInput, SkuCreateInput, SkuRecord, SkuUpdateInput } from '../application/catalog.service.js';

interface ProductRow extends QueryResultRow { id: string; organization_id: string; version: number | string; created_at: Date; updated_at: Date; name: string; product_code: string; unit: string; description: string | null; category_id: string | null; status: 'ACTIVE' | 'INACTIVE'; metadata: Record<string, unknown> }
interface SkuRow extends QueryResultRow { id: string; organization_id: string; version: number | string; created_at: Date; updated_at: Date; product_id: string; sku_code: string; name: string; unit: string; base_unit: string; tracking_mode: 'NONE' | 'LOT' | 'SERIAL'; low_stock_threshold: string; price: string | null; status: 'ACTIVE' | 'INACTIVE'; metadata: Record<string, unknown> }

export class PostgresCatalogStore implements CatalogStore {
  constructor(private readonly pool: Pool) {}

  async insertProduct(client: PoolClient, input: ProductCreateInput & { id: string; organizationId: string; actorUserId: string; requestId: string }): Promise<ProductRecord> {
    await client.query(`INSERT INTO catalog.product (id, organization_id, product_code, name, unit, description, category_id, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`, [input.id, input.organizationId, input.productCode, input.name, input.unit, input.description ?? null, input.categoryId ?? null, JSON.stringify(input.metadata ?? {})]);
    await audit(client, input.organizationId, input.actorUserId, 'catalog.product.created', 'PRODUCT', input.id, input.requestId);
    await outbox(client, input.organizationId, input.id, 'catalog.product.created', { productId: input.id, requestId: input.requestId });
    const result = await this.findProduct(input.organizationId, input.id, client);
    if (result === undefined) throw new Error('Product insert returned no row.');
    return result;
  }

  async findProduct(organizationId: string, id: string, client?: PoolClient): Promise<ProductRecord | undefined> {
    const result = await (client ?? this.pool).query<ProductRow>(`SELECT id, organization_id, version, created_at, updated_at, name, product_code, unit, description, category_id, status, metadata FROM catalog.product WHERE organization_id = $1 AND id = $2${client === undefined ? '' : ' FOR UPDATE'}`, [organizationId, id]);
    return result.rows[0] === undefined ? undefined : mapProduct(result.rows[0]);
  }

  async listProducts(principal: AuthorizationPrincipal, filters: { after?: string; size?: number; sort?: string; statuses?: readonly string[] }): Promise<CatalogPage<ProductRecord>> {
    const sort = parseSort(filters.sort); const size = parsePageSize(filters.size); const filter = { statuses: filters.statuses ?? [] }; const cursor = parseCursor(filters.after, sort, filter);
    const sortColumn = sort.includes('createdAt') ? 'created_at' : 'updated_at';
    const values: unknown[] = [principal.organizationId]; const conditions = ['organization_id = $1']; let index = 1;
    if (filter.statuses.length > 0) { values.push(filter.statuses); conditions.push(`status = ANY($${++index}::text[])`); }
    if (cursor !== undefined) { values.push(cursor.updatedAt, cursor.id); conditions.push(sort.startsWith('-') ? `(${sortColumn}, id) < ($${++index}::timestamptz, $${++index}::uuid)` : `(${sortColumn}, id) > ($${++index}::timestamptz, $${++index}::uuid)`); }
    values.push(size + 1);
    const result = await this.pool.query<ProductRow>(`SELECT id, organization_id, version, created_at, updated_at, name, product_code, unit, description, category_id, status, metadata FROM catalog.product WHERE ${conditions.join(' AND ')} ORDER BY ${sortColumn} ${sort.startsWith('-') ? 'DESC' : 'ASC'}, id ${sort.startsWith('-') ? 'DESC' : 'ASC'} LIMIT $${++index}`, values);
    const rows = result.rows.slice(0, size); const hasNext = result.rows.length > size; const last = rows.at(-1);
    return { data: rows.map(mapProduct), page: { hasNext, nextCursor: hasNext && last !== undefined ? createCursor({ updatedAt: (sortColumn === 'created_at' ? last.created_at : last.updated_at).toISOString(), id: last.id }, sort, filter) : null } };
  }

  async updateProduct(client: PoolClient, input: ProductUpdateInput & { organizationId: string; id: string; expectedVersion: number; actorUserId: string; requestId: string }): Promise<ProductRecord> {
    const result = await client.query(`UPDATE catalog.product SET name = COALESCE($4, name), unit = COALESCE($5, unit), description = COALESCE($6, description), category_id = COALESCE($7, category_id), metadata = COALESCE($8::jsonb, metadata), version = version + 1, updated_at = clock_timestamp() WHERE organization_id = $1 AND id = $2 AND version = $3`, [input.organizationId, input.id, input.expectedVersion, input.name ?? null, input.unit ?? null, input.description ?? null, input.categoryId ?? null, input.metadata === undefined ? null : JSON.stringify(input.metadata)]);
    if (result.rowCount !== 1) throw await this.versionConflict(input.organizationId, input.id, 'PRODUCT', client);
    await audit(client, input.organizationId, input.actorUserId, 'catalog.product.updated', 'PRODUCT', input.id, input.requestId);
    await outbox(client, input.organizationId, input.id, 'catalog.product.updated', { productId: input.id, requestId: input.requestId });
    const value = await this.findProduct(input.organizationId, input.id, client); if (value === undefined) throw new Error('Updated product disappeared.'); return value;
  }

  async insertSku(client: PoolClient, input: SkuCreateInput & { id: string; organizationId: string; actorUserId: string; requestId: string }): Promise<SkuRecord> {
    const product = await client.query('SELECT id FROM catalog.product WHERE organization_id = $1 AND id = $2 AND status = \'ACTIVE\'', [input.organizationId, input.productId]);
    if (product.rowCount !== 1) throw new DomainProblemError('BUSINESS_RULE_VIOLATION', 409);
    await client.query(`INSERT INTO catalog.sku (id, organization_id, product_id, sku_code, name, unit, base_unit, price, metadata) VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8::jsonb)`, [input.id, input.organizationId, input.productId, input.skuCode, input.name, input.unit, input.price ?? null, JSON.stringify(input.metadata ?? {})]);
    await audit(client, input.organizationId, input.actorUserId, 'catalog.sku.created', 'SKU', input.id, input.requestId);
    await outbox(client, input.organizationId, input.id, 'catalog.sku.created', { skuId: input.id, requestId: input.requestId });
    const value = await this.findSku(input.organizationId, input.id, client); if (value === undefined) throw new Error('SKU insert returned no row.'); return value;
  }

  async findSku(organizationId: string, id: string, client?: PoolClient): Promise<SkuRecord | undefined> {
    const result = await (client ?? this.pool).query<SkuRow>(`SELECT id, organization_id, version, created_at, updated_at, product_id, sku_code, name, unit, base_unit, tracking_mode, low_stock_threshold::text, price::text, status, metadata FROM catalog.sku WHERE organization_id = $1 AND id = $2${client === undefined ? '' : ' FOR UPDATE'}`, [organizationId, id]);
    return result.rows[0] === undefined ? undefined : mapSku(result.rows[0]);
  }

  async listSkus(principal: AuthorizationPrincipal, filters: { after?: string; size?: number; sort?: string; statuses?: readonly string[] }): Promise<CatalogPage<SkuRecord>> {
    const sort = parseSort(filters.sort); const size = parsePageSize(filters.size); const filter = { statuses: filters.statuses ?? [] }; const cursor = parseCursor(filters.after, sort, filter);
    const sortColumn = sort.includes('createdAt') ? 'created_at' : 'updated_at';
    const values: unknown[] = [principal.organizationId]; const conditions = ['organization_id = $1']; let index = 1;
    if (filter.statuses.length > 0) { values.push(filter.statuses); conditions.push(`status = ANY($${++index}::text[])`); }
    if (cursor !== undefined) { values.push(cursor.updatedAt, cursor.id); conditions.push(sort.startsWith('-') ? `(${sortColumn}, id) < ($${++index}::timestamptz, $${++index}::uuid)` : `(${sortColumn}, id) > ($${++index}::timestamptz, $${++index}::uuid)`); }
    values.push(size + 1);
    const result = await this.pool.query<SkuRow>(`SELECT id, organization_id, version, created_at, updated_at, product_id, sku_code, name, unit, base_unit, tracking_mode, low_stock_threshold::text, price::text, status, metadata FROM catalog.sku WHERE ${conditions.join(' AND ')} ORDER BY ${sortColumn} ${sort.startsWith('-') ? 'DESC' : 'ASC'}, id ${sort.startsWith('-') ? 'DESC' : 'ASC'} LIMIT $${++index}`, values);
    const rows = result.rows.slice(0, size); const hasNext = result.rows.length > size; const last = rows.at(-1);
    return { data: rows.map(mapSku), page: { hasNext, nextCursor: hasNext && last !== undefined ? createCursor({ updatedAt: (sortColumn === 'created_at' ? last.created_at : last.updated_at).toISOString(), id: last.id }, sort, filter) : null } };
  }

  async updateSku(client: PoolClient, input: SkuUpdateInput & { organizationId: string; id: string; expectedVersion: number; actorUserId: string; requestId: string }): Promise<SkuRecord> {
    const result = await client.query(`UPDATE catalog.sku SET name = COALESCE($4, name), unit = COALESCE($5, unit), price = COALESCE($6::numeric, price), metadata = COALESCE($7::jsonb, metadata), version = version + 1, updated_at = clock_timestamp() WHERE organization_id = $1 AND id = $2 AND version = $3`, [input.organizationId, input.id, input.expectedVersion, input.name ?? null, input.unit ?? null, input.price ?? null, input.metadata === undefined ? null : JSON.stringify(input.metadata)]);
    if (result.rowCount !== 1) throw await this.versionConflict(input.organizationId, input.id, 'SKU', client);
    await audit(client, input.organizationId, input.actorUserId, 'catalog.sku.updated', 'SKU', input.id, input.requestId);
    await outbox(client, input.organizationId, input.id, 'catalog.sku.updated', { skuId: input.id, requestId: input.requestId });
    const value = await this.findSku(input.organizationId, input.id, client); if (value === undefined) throw new Error('Updated SKU disappeared.'); return value;
  }

  private async versionConflict(organizationId: string, id: string, type: 'PRODUCT' | 'SKU', client: PoolClient): Promise<DomainProblemError> { const result = await client.query<{ version: number }>(`SELECT version FROM catalog.${type === 'PRODUCT' ? 'product' : 'sku'} WHERE organization_id = $1 AND id = $2`, [organizationId, id]); const version = result.rows[0]?.version; return version === undefined ? new DomainProblemError('RESOURCE_NOT_FOUND', 404) : new DomainProblemError('VERSION_CONFLICT', 409, { currentVersion: version, currentEtag: `"v${version}"`, resourceHref: `/api/v1/${type === 'PRODUCT' ? 'products' : 'skus'}/${id}` }); }
}

function mapProduct(row: ProductRow): ProductRecord { return { id: row.id, organizationId: row.organization_id, version: Number(row.version), createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(), name: row.name, productCode: row.product_code, unit: row.unit, ...(row.description === null ? {} : { description: row.description }), ...(row.category_id === null ? {} : { categoryId: row.category_id }), status: row.status, metadata: row.metadata }; }
function mapSku(row: SkuRow): SkuRecord { return { id: row.id, organizationId: row.organization_id, version: Number(row.version), createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(), productId: row.product_id, skuCode: row.sku_code, name: row.name, unit: row.unit, baseUnit: row.base_unit, trackingMode: row.tracking_mode, lowStockThreshold: row.low_stock_threshold, ...(row.price === null ? {} : { price: row.price }), status: row.status, metadata: row.metadata }; }
async function audit(client: PoolClient, organizationId: string, actorUserId: string, action: string, resourceType: string, resourceId: string, requestId: string): Promise<void> { await client.query(`INSERT INTO audit.audit_event (id, organization_id, actor_user_id, action, resource_type, resource_id, outcome, request_id) VALUES ($1, $2, $3, $4, $5, $6, 'SUCCEEDED', $7)`, [randomUUID(), organizationId, actorUserId, action, resourceType, resourceId, requestId]); }
async function outbox(client: PoolClient, organizationId: string, aggregateId: string, eventType: string, payload: Record<string, unknown>): Promise<void> { await client.query(`INSERT INTO integration.outbox_event (id, organization_id, aggregate_type, aggregate_id, event_type, payload) VALUES ($1, $2, $3, $4, $5, $6::jsonb)`, [randomUUID(), organizationId, 'CATALOG', aggregateId, eventType, JSON.stringify(payload)]); }
