import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { DomainProblemError } from '../../../common/http/domain-error.js';
import type { AuthorizationPrincipal } from '../../identity/domain/authz.js';
import { assertDecimal } from '../domain/catalog.js';

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
}

export class CatalogService {
  constructor(private readonly store: CatalogStore) {}

  async createProduct(principal: AuthorizationPrincipal, input: ProductCreateInput, requestId: string, client: PoolClient): Promise<ProductRecord> {
    this.requireWrite(principal);
    return this.store.insertProduct(client, { ...input, id: randomUUID(), organizationId: principal.organizationId, actorUserId: principal.userId, requestId });
  }

  async getProduct(principal: AuthorizationPrincipal, id: string): Promise<ProductRecord> { this.requireRead(principal); const value = await this.store.findProduct(principal.organizationId, id); if (value === undefined) throw new DomainProblemError('RESOURCE_NOT_FOUND', 404); return value; }
  async listProducts(principal: AuthorizationPrincipal, filters: { after?: string; size?: number; sort?: string; statuses?: readonly string[] }): Promise<CatalogPage<ProductRecord>> { this.requireRead(principal); return this.store.listProducts(principal, filters); }
  async updateProduct(principal: AuthorizationPrincipal, id: string, expectedVersion: number, input: ProductUpdateInput, requestId: string, client: PoolClient): Promise<ProductRecord> { this.requireWrite(principal); const value = await this.store.findProduct(principal.organizationId, id, client); if (value === undefined) throw new DomainProblemError('RESOURCE_NOT_FOUND', 404); if (value.version !== expectedVersion) throw this.versionConflict('PRODUCT', id, value.version); return this.store.updateProduct(client, { ...input, organizationId: principal.organizationId, id, expectedVersion, actorUserId: principal.userId, requestId }); }

  async createSku(principal: AuthorizationPrincipal, input: SkuCreateInput, requestId: string, client: PoolClient): Promise<SkuRecord> { this.requireWrite(principal); if (input.price !== undefined) input = { ...input, price: assertDecimal(input.price, 4) }; return this.store.insertSku(client, { ...input, id: randomUUID(), organizationId: principal.organizationId, actorUserId: principal.userId, requestId }); }
  async getSku(principal: AuthorizationPrincipal, id: string): Promise<SkuRecord> { this.requireRead(principal); const value = await this.store.findSku(principal.organizationId, id); if (value === undefined) throw new DomainProblemError('RESOURCE_NOT_FOUND', 404); return value; }
  async listSkus(principal: AuthorizationPrincipal, filters: { after?: string; size?: number; sort?: string; statuses?: readonly string[] }): Promise<CatalogPage<SkuRecord>> { this.requireRead(principal); return this.store.listSkus(principal, filters); }
  async updateSku(principal: AuthorizationPrincipal, id: string, expectedVersion: number, input: SkuUpdateInput, requestId: string, client: PoolClient): Promise<SkuRecord> { this.requireWrite(principal); const value = await this.store.findSku(principal.organizationId, id, client); if (value === undefined) throw new DomainProblemError('RESOURCE_NOT_FOUND', 404); if (value.version !== expectedVersion) throw this.versionConflict('SKU', id, value.version); const normalized = input.price === undefined ? input : { ...input, price: assertDecimal(input.price, 4) }; return this.store.updateSku(client, { ...normalized, organizationId: principal.organizationId, id, expectedVersion, actorUserId: principal.userId, requestId }); }

  private requireRead(principal: AuthorizationPrincipal): void { if (principal.status !== 'ACTIVE' || !principal.permissions.has('catalog.read') || principal.scopes.get('ORGANIZATION')?.scopeType !== 'ALL_ORG') throw new DomainProblemError('PERMISSION_DENIED', 403); }
  private requireWrite(principal: AuthorizationPrincipal): void { this.requireRead(principal); if (!principal.permissions.has('catalog.write')) throw new DomainProblemError('PERMISSION_DENIED', 403); }
  private versionConflict(type: string, id: string, currentVersion: number): DomainProblemError { return new DomainProblemError('VERSION_CONFLICT', 409, { currentVersion, currentEtag: `"v${currentVersion}"`, resourceHref: `/api/v1/${type === 'PRODUCT' ? 'products' : 'skus'}/${id}` }); }
}
