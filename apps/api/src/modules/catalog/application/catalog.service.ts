import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { DomainProblemError } from '../../../common/http/domain-error.js';
import type { AuthorizationPrincipal } from '../../identity/domain/authz.js';
import { assertDecimal, isDecimalStringError } from '../domain/catalog.js';

export interface ProductRecord { id: string; organizationId: string; version: number; createdAt: string; updatedAt: string; name: string; productCode: string; unit: string; description?: string; categoryId?: string; status: 'ACTIVE' | 'INACTIVE'; metadata: Record<string, unknown> }
export interface SkuRecord { id: string; organizationId: string; version: number; createdAt: string; updatedAt: string; productId: string; skuCode: string; name: string; unit: string; baseUnit: string; trackingMode: 'NONE' | 'LOT' | 'SERIAL'; lowStockThreshold: string; price?: string; status: 'ACTIVE' | 'INACTIVE'; metadata: Record<string, unknown> }
export interface CatalogPage<T> { data: readonly T[]; page: { nextCursor: string | null; hasNext: boolean } }
export interface ProductCreateInput { name: string; productCode: string; unit: string; description?: string; categoryId?: string; metadata?: Record<string, unknown> }
export interface ProductUpdateInput { name?: string; unit?: string; description?: string; categoryId?: string; metadata?: Record<string, unknown> }
export interface SkuCreateInput { productId: string; skuCode: string; name: string; unit: string; price?: string; metadata?: Record<string, unknown> }
export interface SkuUpdateInput { name?: string; unit?: string; price?: string; metadata?: Record<string, unknown> }

export interface CatalogStore {
  insertProduct(client: PoolClient, input: ProductCreateInput & { id: string; organizationId: string; actorUserId: string; requestId: string }): Promise<ProductRecord>;
  findProduct(organizationId: string, id: string, client?: PoolClient): Promise<ProductRecord | undefined>;
  listProducts(principal: AuthorizationPrincipal, filters: { after?: string; size?: number; sort?: string; statuses?: readonly string[] }): Promise<CatalogPage<ProductRecord>>;
  updateProduct(client: PoolClient, input: ProductUpdateInput & { organizationId: string; id: string; expectedVersion: number; actorUserId: string; requestId: string }): Promise<ProductRecord>;
  insertSku(client: PoolClient, input: SkuCreateInput & { id: string; organizationId: string; actorUserId: string; requestId: string }): Promise<SkuRecord>;
  findSku(organizationId: string, id: string, client?: PoolClient): Promise<SkuRecord | undefined>;
  listSkus(principal: AuthorizationPrincipal, filters: { after?: string; size?: number; sort?: string; statuses?: readonly string[] }): Promise<CatalogPage<SkuRecord>>;
  updateSku(client: PoolClient, input: SkuUpdateInput & { organizationId: string; id: string; expectedVersion: number; actorUserId: string; requestId: string }): Promise<SkuRecord>;
  recordAudit?(input: { organizationId: string; actorUserId: string; action: string; resourceType: string; resourceId?: string; outcome: 'DENIED' | 'FAILED'; requestId: string; reason: string }): Promise<void>;
}

export class CatalogService {
  constructor(private readonly store: CatalogStore) {}

  async createProduct(principal: AuthorizationPrincipal, input: ProductCreateInput, requestId: string, client: PoolClient): Promise<ProductRecord> {
    await this.requireWrite(principal, requestId, undefined, 'catalog.product.create');
    return this.store.insertProduct(client, { ...input, id: randomUUID(), organizationId: principal.organizationId, actorUserId: principal.userId, requestId });
  }

  async getProduct(principal: AuthorizationPrincipal, id: string, requestId = '00000000-0000-4000-8000-000000000000'): Promise<ProductRecord> { await this.requireRead(principal, requestId, id, 'catalog.product.read'); const value = await this.store.findProduct(principal.organizationId, id); if (value === undefined) { await this.recordDenied(principal, 'catalog.product.read', id, requestId, 'resource-not-found'); throw new DomainProblemError('RESOURCE_NOT_FOUND', 404); } return value; }
  async listProducts(principal: AuthorizationPrincipal, filters: { after?: string; size?: number; sort?: string; statuses?: readonly string[] }, requestId = '00000000-0000-4000-8000-000000000000'): Promise<CatalogPage<ProductRecord>> { await this.requireRead(principal, requestId, undefined, 'catalog.product.read'); return this.store.listProducts(principal, filters); }
  async updateProduct(principal: AuthorizationPrincipal, id: string, expectedVersion: number, input: ProductUpdateInput, requestId: string, client: PoolClient): Promise<ProductRecord> { await this.requireWrite(principal, requestId, id, 'catalog.product.update'); const value = await this.store.findProduct(principal.organizationId, id, client); if (value === undefined) { await this.recordDenied(principal, 'catalog.product.update', id, requestId, 'resource-not-found'); throw new DomainProblemError('RESOURCE_NOT_FOUND', 404); } if (value.version !== expectedVersion) throw await this.versionConflict(principal, 'PRODUCT', id, value.version, requestId); return this.store.updateProduct(client, { ...input, organizationId: principal.organizationId, id, expectedVersion, actorUserId: principal.userId, requestId }); }

  async createSku(principal: AuthorizationPrincipal, input: SkuCreateInput, requestId: string, client: PoolClient): Promise<SkuRecord> {
    await this.requireWrite(principal, requestId, undefined, 'catalog.sku.create');
    try { if (input.price !== undefined) input = { ...input, price: assertDecimal(input.price, 4, false, true) }; }
    catch (error) { if (isDecimalStringError(error)) throw new DomainProblemError('VALIDATION_FAILED', 400, { violations: [{ field: 'price', code: error.code, message: 'DecimalString value is invalid.' }] }); throw error; }
    return this.store.insertSku(client, { ...input, id: randomUUID(), organizationId: principal.organizationId, actorUserId: principal.userId, requestId });
  }
  async getSku(principal: AuthorizationPrincipal, id: string, requestId = '00000000-0000-4000-8000-000000000000'): Promise<SkuRecord> { await this.requireRead(principal, requestId, id, 'catalog.sku.read'); const value = await this.store.findSku(principal.organizationId, id); if (value === undefined) { await this.recordDenied(principal, 'catalog.sku.read', id, requestId, 'resource-not-found'); throw new DomainProblemError('RESOURCE_NOT_FOUND', 404); } return value; }
  async listSkus(principal: AuthorizationPrincipal, filters: { after?: string; size?: number; sort?: string; statuses?: readonly string[] }, requestId = '00000000-0000-4000-8000-000000000000'): Promise<CatalogPage<SkuRecord>> { await this.requireRead(principal, requestId, undefined, 'catalog.sku.read'); return this.store.listSkus(principal, filters); }
  async updateSku(principal: AuthorizationPrincipal, id: string, expectedVersion: number, input: SkuUpdateInput, requestId: string, client: PoolClient): Promise<SkuRecord> {
    await this.requireWrite(principal, requestId, id, 'catalog.sku.update'); const value = await this.store.findSku(principal.organizationId, id, client); if (value === undefined) { await this.recordDenied(principal, 'catalog.sku.update', id, requestId, 'resource-not-found'); throw new DomainProblemError('RESOURCE_NOT_FOUND', 404); } if (value.version !== expectedVersion) throw await this.versionConflict(principal, 'SKU', id, value.version, requestId);
    try { const normalized = input.price === undefined ? input : { ...input, price: assertDecimal(input.price, 4, false, true) }; return this.store.updateSku(client, { ...normalized, organizationId: principal.organizationId, id, expectedVersion, actorUserId: principal.userId, requestId }); }
    catch (error) { if (isDecimalStringError(error)) throw new DomainProblemError('VALIDATION_FAILED', 400, { violations: [{ field: 'price', code: error.code, message: 'DecimalString value is invalid.' }] }); throw error; }
  }

  private async requireRead(principal: AuthorizationPrincipal, requestId: string, resourceId: string | undefined, action: string): Promise<void> { if (principal.status !== 'ACTIVE' || !principal.permissions.has('catalog.read') || principal.scopes.get('ORGANIZATION')?.scopeType !== 'ALL_ORG') { await this.recordDenied(principal, action, resourceId, requestId, 'permission-denied'); throw new DomainProblemError('PERMISSION_DENIED', 403); } }
  private async requireWrite(principal: AuthorizationPrincipal, requestId: string, resourceId: string | undefined, action: string): Promise<void> { await this.requireRead(principal, requestId, resourceId, action); if (!principal.permissions.has('catalog.write')) { await this.recordDenied(principal, action, resourceId, requestId, 'permission-denied'); throw new DomainProblemError('PERMISSION_DENIED', 403); } }
  private async versionConflict(principal: AuthorizationPrincipal, type: string, id: string, currentVersion: number, requestId: string): Promise<DomainProblemError> { await this.recordDenied(principal, `catalog.${type.toLowerCase()}.update`, id, requestId, 'version-conflict', 'FAILED'); return new DomainProblemError('VERSION_CONFLICT', 409, { currentVersion, currentEtag: `"v${currentVersion}"`, resourceHref: `/api/v1/${type === 'PRODUCT' ? 'products' : 'skus'}/${id}` }); }
  private async recordDenied(principal: AuthorizationPrincipal, action: string, resourceId: string | undefined, requestId: string, reason: string, outcome: 'DENIED' | 'FAILED' = 'DENIED'): Promise<void> { await this.store.recordAudit?.({ organizationId: principal.organizationId, actorUserId: principal.userId, action, resourceType: action.includes('.sku.') ? 'SKU' : 'PRODUCT', ...(resourceId === undefined ? {} : { resourceId }), outcome, requestId, reason }); }
}
