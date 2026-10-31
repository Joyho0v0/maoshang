import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { DomainProblemError } from '../../../common/http/domain-error.js';
import type { AuthorizationPrincipal } from '../../identity/domain/authz.js';
import { addDecimalStrings, multiplyDecimalStrings, parseDecimalString } from '../../catalog/domain/catalog.js';
import { assertOrderStageTransition, type OrderStage, statusForStage } from '../domain/orders.js';
import { canSeeCustomer, type CustomerVisibility } from '../../crm/domain/crm.js';

export interface OrderLineInput { skuId: string; quantity: string; unitPrice: string }
export interface OrderRecord { id: string; organizationId: string; version: number; createdAt: string; updatedAt: string; customerId: string; orderNo: string; ownerUserId?: string; businessGroupId?: string; currency: string; status: 'DRAFT' | 'CONFIRMED' | 'FULFILLED' | 'CANCELLED'; stage: OrderStage; lines: readonly OrderLineInput[]; totalAmount: string; metadata?: Record<string, unknown>; capabilities?: readonly string[]; allowedTransitions?: readonly string[] }
export interface OrderPage { data: readonly OrderRecord[]; page: { nextCursor: string | null; hasNext: boolean } }
export interface OrdersStore {
  resolvePrimaryBusinessGroup(client: PoolClient, organizationId: string, userId: string): Promise<string | undefined>;
  findCustomerVisibility(organizationId: string, customerId: string, client: PoolClient): Promise<CustomerVisibility | undefined>;
  findOrder(organizationId: string, id: string, client?: PoolClient): Promise<OrderRecord | undefined>;
  listOrders(principal: AuthorizationPrincipal, filters: { after?: string; size?: number; sort?: string; statuses?: readonly string[] }): Promise<OrderPage>;
  insertOrder(client: PoolClient, input: { id: string; organizationId: string; customerId: string; orderNo: string; ownerUserId: string; businessGroupId?: string; currency: string; stage: OrderStage; totalAmount: string; metadata: Record<string, unknown>; lines: readonly OrderLineInput[]; actorUserId: string; requestId: string }): Promise<OrderRecord>;
  updateOrder(client: PoolClient, input: { organizationId: string; id: string; expectedVersion: number; status?: OrderRecord['status']; metadata?: Record<string, unknown>; actorUserId: string; requestId: string }): Promise<OrderRecord>;
  transitionOrder(client: PoolClient, input: { organizationId: string; id: string; expectedVersion: number; action: string; reason?: string; actorUserId: string; requestId: string }): Promise<OrderRecord>;
}

export class OrdersService {
  constructor(private readonly store: OrdersStore) {}

  async getOrder(principal: AuthorizationPrincipal, id: string): Promise<OrderRecord> { this.require(principal, 'order.read'); const order = await this.store.findOrder(principal.organizationId, id); if (order === undefined || !this.visible(principal, order)) throw new DomainProblemError('RESOURCE_NOT_FOUND', 404); return this.project(principal, order); }
  async listOrders(principal: AuthorizationPrincipal, filters: { after?: string; size?: number; sort?: string; statuses?: readonly string[] }): Promise<OrderPage> { this.require(principal, 'order.read'); return this.store.listOrders(principal, filters); }
  async createOrder(principal: AuthorizationPrincipal, input: { customerId: string; orderNo: string; currency: string; lines: readonly OrderLineInput[]; metadata?: Record<string, unknown> }, requestId: string, client: PoolClient): Promise<OrderRecord> {
    this.require(principal, 'order.create');
    if (input.lines.length === 0) throw new DomainProblemError('VALIDATION_FAILED', 400);
    for (const line of input.lines) { parseDecimalString(line.quantity, { maxScale: 6, positive: true }); parseDecimalString(line.unitPrice, { maxScale: 4 }); }
    const group = principal.scopes.get('ORDER');
    if (group === undefined || (group.scopeType === 'GROUP_SET' && group.groupIds.length === 0)) throw new DomainProblemError('PERMISSION_DENIED', 403);
    const customer = await this.store.findCustomerVisibility(principal.organizationId, input.customerId, client);
    if (customer === undefined || !canSeeCustomer(principal, customer)) throw new DomainProblemError('BUSINESS_RULE_VIOLATION', 409);
    const businessGroupId = await this.store.resolvePrimaryBusinessGroup(client, principal.organizationId, principal.userId);
    if (businessGroupId === undefined) throw new DomainProblemError('PERMISSION_DENIED', 403);
    const stage: OrderStage = 'INITIAL_CONTACT';
    return this.store.insertOrder(client, { id: randomUUID(), organizationId: principal.organizationId, customerId: input.customerId, orderNo: input.orderNo.trim(), ownerUserId: principal.userId, businessGroupId, currency: input.currency, stage, totalAmount: calculateOrderTotal(input.lines), metadata: input.metadata ?? {}, lines: input.lines, actorUserId: principal.userId, requestId });
  }
  async updateOrder(principal: AuthorizationPrincipal, id: string, expectedVersion: number, input: { status?: OrderRecord['status']; metadata?: Record<string, unknown> }, requestId: string, client: PoolClient): Promise<OrderRecord> { this.require(principal, 'order.update'); const order = await this.requireOrder(principal, id, client); if (order.version !== expectedVersion) throw this.versionConflict(order); if (input.status === 'FULFILLED' && order.stage !== 'CLOSED') throw new DomainProblemError('STATE_CONFLICT', 409, { resourceType: 'ORDER', resourceId: id, currentState: order.stage }); return this.store.updateOrder(client, { organizationId: principal.organizationId, id, expectedVersion, ...input, actorUserId: principal.userId, requestId }); }
  async transitionOrder(principal: AuthorizationPrincipal, id: string, expectedVersion: number, input: { action: string; reason?: string }, requestId: string, client: PoolClient): Promise<OrderRecord> { this.require(principal, 'order.update'); const order = await this.requireOrder(principal, id, client); if (order.version !== expectedVersion) throw this.versionConflict(order); const action = input.action.toUpperCase(); if (action !== 'CANCEL') { try { assertOrderStageTransition(order.stage, action as OrderStage); } catch { throw new DomainProblemError('INVALID_TRANSITION', 409); } } else if (order.stage === 'CLOSED') throw new DomainProblemError('INVALID_TRANSITION', 409); return this.store.transitionOrder(client, { organizationId: principal.organizationId, id, expectedVersion, action, ...(input.reason === undefined ? {} : { reason: input.reason }), actorUserId: principal.userId, requestId }); }

  private async requireOrder(principal: AuthorizationPrincipal, id: string, client?: PoolClient): Promise<OrderRecord> { const order = await this.store.findOrder(principal.organizationId, id, client); if (order === undefined || !this.visible(principal, order)) throw new DomainProblemError('RESOURCE_NOT_FOUND', 404); return order; }
  private visible(principal: AuthorizationPrincipal, order: OrderRecord): boolean { const scope = principal.scopes.get('ORDER'); if (scope === undefined) return false; if (scope.scopeType === 'ALL_ORG') return true; if (scope.scopeType === 'OWN') return order.ownerUserId === principal.userId; return scope.groupIds.length > 0 && order.businessGroupId !== undefined && scope.groupIds.includes(order.businessGroupId); }
  private project(principal: AuthorizationPrincipal, order: OrderRecord): OrderRecord { return { ...order, capabilities: principal.permissions.has('order.update') && order.status !== 'FULFILLED' && order.status !== 'CANCELLED' ? ['order.update', 'order.transition'] : [], allowedTransitions: order.stage === 'CLOSED' ? [] : ['CANCEL', ...(order.stage === 'INITIAL_CONTACT' ? ['QUOTING'] : order.stage === 'QUOTING' ? ['QUOTE_FOLLOW_UP'] : order.stage === 'QUOTE_FOLLOW_UP' ? ['DEPOSIT_PENDING'] : order.stage === 'DEPOSIT_PENDING' ? ['DEPOSIT_CONFIRMED'] : order.stage === 'DEPOSIT_CONFIRMED' ? ['FULFILLMENT'] : order.stage === 'FULFILLMENT' ? ['FOB_COMPLETED'] : ['CLOSED'])] }; }
  private versionConflict(order: OrderRecord): DomainProblemError { return new DomainProblemError('VERSION_CONFLICT', 409, { currentVersion: order.version, currentEtag: `"v${order.version}"`, resourceHref: `/api/v1/orders/${order.id}` }); }
  private require(principal: AuthorizationPrincipal, permission: string): void { if (principal.status !== 'ACTIVE' || !principal.permissions.has(permission)) throw new DomainProblemError('PERMISSION_DENIED', 403); }
}

export function calculateOrderTotal(lines: readonly OrderLineInput[]): string { return lines.reduce((total, line) => addDecimalStrings(total, multiplyDecimalStrings(line.quantity, line.unitPrice)), '0.0000'); }
export function statusForOrderStage(stage: OrderStage): OrderRecord['status'] { return statusForStage(stage); }
