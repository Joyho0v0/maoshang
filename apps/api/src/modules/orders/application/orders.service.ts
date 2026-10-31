import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { DomainProblemError } from '../../../common/http/domain-error.js';
import type { AuthorizationPrincipal } from '../../identity/domain/authz.js';
import { addDecimalStrings, multiplyDecimalStrings, parseDecimalString, isDecimalStringError } from '../../catalog/domain/catalog.js';
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
  recordAudit?(input: { organizationId: string; actorUserId: string; action: string; resourceType: string; resourceId?: string; outcome: 'DENIED' | 'FAILED'; requestId: string; reason: string }): Promise<void>;
}

export class OrdersService {
  constructor(private readonly store: OrdersStore) {}

  async getOrder(principal: AuthorizationPrincipal, id: string, requestId = '00000000-0000-4000-8000-000000000000'): Promise<OrderRecord> { await this.require(principal, 'order.read', requestId, id, 'order.read'); const order = await this.store.findOrder(principal.organizationId, id); if (order === undefined || !this.visible(principal, order)) { await this.recordDenied(principal, 'order.read', id, requestId, 'scope-denied'); throw new DomainProblemError('RESOURCE_NOT_FOUND', 404); } return this.project(principal, order); }
  async listOrders(principal: AuthorizationPrincipal, filters: { after?: string; size?: number; sort?: string; statuses?: readonly string[] }, requestId = '00000000-0000-4000-8000-000000000000'): Promise<OrderPage> { await this.require(principal, 'order.read', requestId, undefined, 'order.read'); return this.store.listOrders(principal, filters); }
  async createOrder(principal: AuthorizationPrincipal, input: { customerId: string; orderNo: string; currency: string; lines: readonly OrderLineInput[]; metadata?: Record<string, unknown> }, requestId: string, client: PoolClient): Promise<OrderRecord> {
    await this.require(principal, 'order.create', requestId, undefined, 'order.create');
    if (input.lines.length === 0) throw new DomainProblemError('VALIDATION_FAILED', 400);
    try {
      for (const line of input.lines) {
        parseDecimalString(line.quantity, { maxScale: 6, positive: true });
        parseDecimalString(line.unitPrice, { maxScale: 4, nonNegative: true });
      }
    } catch (error) {
      if (isDecimalStringError(error)) throw new DomainProblemError('VALIDATION_FAILED', 400, { violations: [{ field: 'lines', code: error.code, message: 'DecimalString value is invalid.' }] });
      throw error;
    }
    const group = principal.scopes.get('ORDER');
    if (group === undefined || (group.scopeType === 'GROUP_SET' && group.groupIds.length === 0)) { await this.recordDenied(principal, 'order.create', undefined, requestId, 'scope-denied'); throw new DomainProblemError('PERMISSION_DENIED', 403); }
    const customer = await this.store.findCustomerVisibility(principal.organizationId, input.customerId, client);
    if (customer === undefined || !canSeeCustomer(principal, customer)) throw new DomainProblemError('BUSINESS_RULE_VIOLATION', 409);
    const businessGroupId = await this.store.resolvePrimaryBusinessGroup(client, principal.organizationId, principal.userId);
    if (businessGroupId === undefined) throw new DomainProblemError('PERMISSION_DENIED', 403);
    const stage: OrderStage = 'INITIAL_CONTACT';
    return this.store.insertOrder(client, { id: randomUUID(), organizationId: principal.organizationId, customerId: input.customerId, orderNo: input.orderNo.trim(), ownerUserId: principal.userId, businessGroupId, currency: input.currency, stage, totalAmount: calculateOrderTotal(input.lines), metadata: input.metadata ?? {}, lines: input.lines, actorUserId: principal.userId, requestId });
  }
  async updateOrder(principal: AuthorizationPrincipal, id: string, expectedVersion: number, input: { status?: OrderRecord['status']; metadata?: Record<string, unknown> }, requestId: string, client: PoolClient): Promise<OrderRecord> {
    await this.require(principal, 'order.update', requestId, id, 'order.update');
    const order = await this.requireOrder(principal, id, client, requestId, 'order.update');
    if (order.version !== expectedVersion) throw await this.versionConflict(principal, order, requestId, 'order.update');
    if (order.status === 'CANCELLED' || order.status === 'FULFILLED') { await this.recordDenied(principal, 'order.update', id, requestId, 'terminal-state', 'FAILED'); throw new DomainProblemError('STATE_CONFLICT', 409, { resourceType: 'ORDER', resourceId: id, currentState: order.status }); }
    if (input.status !== undefined && input.status !== statusForStage(order.stage)) { await this.recordDenied(principal, 'order.update', id, requestId, 'status-stage-mismatch', 'FAILED'); throw new DomainProblemError('STATE_CONFLICT', 409, { resourceType: 'ORDER', resourceId: id, currentState: order.stage }); }
    return this.project(principal, await this.store.updateOrder(client, { organizationId: principal.organizationId, id, expectedVersion, ...input, actorUserId: principal.userId, requestId }));
  }
  async transitionOrder(principal: AuthorizationPrincipal, id: string, expectedVersion: number, input: { action: string; reason?: string }, requestId: string, client: PoolClient): Promise<OrderRecord> {
    await this.require(principal, 'order.update', requestId, id, 'order.transition');
    const order = await this.requireOrder(principal, id, client, requestId, 'order.transition');
    if (order.version !== expectedVersion) throw await this.versionConflict(principal, order, requestId, 'order.transition');
    if (order.status === 'CANCELLED' || order.status === 'FULFILLED') { await this.recordDenied(principal, 'order.transition', id, requestId, 'terminal-state', 'FAILED'); throw new DomainProblemError('INVALID_TRANSITION', 409); }
    const action = input.action.toUpperCase();
    if (action !== 'CANCEL') {
      try { assertOrderStageTransition(order.stage, action as OrderStage); } catch { await this.recordDenied(principal, 'order.transition', id, requestId, 'non-adjacent-transition', 'FAILED'); throw new DomainProblemError('INVALID_TRANSITION', 409); }
    } else if (order.stage === 'CLOSED') { await this.recordDenied(principal, 'order.transition', id, requestId, 'closed-state', 'FAILED'); throw new DomainProblemError('INVALID_TRANSITION', 409); }
    return this.project(principal, await this.store.transitionOrder(client, { organizationId: principal.organizationId, id, expectedVersion, action, ...(input.reason === undefined ? {} : { reason: input.reason }), actorUserId: principal.userId, requestId }));
  }

  private async requireOrder(principal: AuthorizationPrincipal, id: string, client: PoolClient | undefined, requestId: string, action: string): Promise<OrderRecord> { const order = await this.store.findOrder(principal.organizationId, id, client); if (order === undefined || !this.visible(principal, order)) { await this.recordDenied(principal, action, id, requestId, 'scope-denied'); throw new DomainProblemError('RESOURCE_NOT_FOUND', 404); } return order; }
  private visible(principal: AuthorizationPrincipal, order: OrderRecord): boolean { const scope = principal.scopes.get('ORDER'); if (scope === undefined) return false; if (scope.scopeType === 'ALL_ORG') return true; if (scope.scopeType === 'OWN') return order.ownerUserId === principal.userId; return scope.groupIds.length > 0 && order.businessGroupId !== undefined && scope.groupIds.includes(order.businessGroupId); }
  private project(principal: AuthorizationPrincipal, order: OrderRecord): OrderRecord {
    const terminal = order.status === 'FULFILLED' || order.status === 'CANCELLED' || order.stage === 'CLOSED';
    return { ...order, capabilities: principal.permissions.has('order.update') && !terminal ? ['order.update', 'order.transition'] : [], allowedTransitions: terminal ? [] : ['CANCEL', ...(order.stage === 'INITIAL_CONTACT' ? ['QUOTING'] : order.stage === 'QUOTING' ? ['QUOTE_FOLLOW_UP'] : order.stage === 'QUOTE_FOLLOW_UP' ? ['DEPOSIT_PENDING'] : order.stage === 'DEPOSIT_PENDING' ? ['DEPOSIT_CONFIRMED'] : order.stage === 'DEPOSIT_CONFIRMED' ? ['FULFILLMENT'] : order.stage === 'FULFILLMENT' ? ['FOB_COMPLETED'] : ['CLOSED'])] };
  }
  private async versionConflict(principal: AuthorizationPrincipal, order: OrderRecord, requestId: string, action: string): Promise<DomainProblemError> { await this.recordDenied(principal, action, order.id, requestId, 'version-conflict', 'FAILED'); return new DomainProblemError('VERSION_CONFLICT', 409, { currentVersion: order.version, currentEtag: `"v${order.version}"`, resourceHref: `/api/v1/orders/${order.id}` }); }
  private async require(principal: AuthorizationPrincipal, permission: string, requestId: string, resourceId: string | undefined, action: string): Promise<void> { if (principal.status !== 'ACTIVE' || !principal.permissions.has(permission)) { await this.recordDenied(principal, action, resourceId, requestId, 'permission-denied'); throw new DomainProblemError('PERMISSION_DENIED', 403); } }
  private async recordDenied(principal: AuthorizationPrincipal, action: string, resourceId: string | undefined, requestId: string, reason: string, outcome: 'DENIED' | 'FAILED' = 'DENIED'): Promise<void> { await this.store.recordAudit?.({ organizationId: principal.organizationId, actorUserId: principal.userId, action, resourceType: 'ORDER', ...(resourceId === undefined ? {} : { resourceId }), outcome, requestId, reason }); }
}

export function calculateOrderTotal(lines: readonly OrderLineInput[]): string { return lines.reduce((total, line) => addDecimalStrings(total, multiplyDecimalStrings(line.quantity, line.unitPrice)), '0.0000'); }
export function statusForOrderStage(stage: OrderStage): OrderRecord['status'] { return statusForStage(stage); }
