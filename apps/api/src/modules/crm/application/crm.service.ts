import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { DomainProblemError } from '../../../common/http/domain-error.js';
import type { AuthorizationPrincipal, DataScopeGrant } from '../../identity/domain/authz.js';
import { assertApprovalTransition, canSeeCustomer, customerCapabilities, type ApprovalAction, type CustomerStatus } from '../domain/crm.js';

export interface CustomerRecord {
  id: string;
  organizationId: string;
  name: string;
  ownerUserId?: string;
  businessGroupId?: string;
  status: CustomerStatus;
  contacts: readonly Record<string, unknown>[];
  approvalSummary?: Record<string, unknown>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPage { data: readonly CustomerRecord[]; page: { nextCursor: string | null; hasNext: boolean } }
export interface CreateCustomerInput { name: string; ownerUserId?: string; businessGroupId?: string; contacts?: readonly Record<string, unknown>[] }
export interface UpdateCustomerInput { name?: string; contacts?: readonly Record<string, unknown>[]; ownerUserId?: string; businessGroupId?: string }
export interface CustomerFilters { after?: string; size?: number; sort?: string; statuses?: readonly string[]; groupIds?: readonly string[]; ownerIds?: readonly string[] }

export interface CrmStore {
  resolvePrimaryBusinessGroup(client: PoolClient, organizationId: string, userId: string): Promise<string | undefined>;
  insertCustomer(client: PoolClient, input: { id: string; organizationId: string; name: string; ownerUserId: string; businessGroupId?: string; contacts: readonly Record<string, unknown>[]; actorUserId: string; requestId: string }): Promise<CustomerRecord>;
  findCustomer(organizationId: string, customerId: string, client?: PoolClient): Promise<CustomerRecord | undefined>;
  listCustomers(principal: AuthorizationPrincipal, filters: CustomerFilters): Promise<CustomerPage>;
  updateCustomer(client: PoolClient, input: { organizationId: string; customerId: string; expectedVersion: number; name?: string; contacts?: readonly Record<string, unknown>[]; actorUserId: string; requestId: string }): Promise<CustomerRecord>;
  commandCustomer(client: PoolClient, input: { organizationId: string; customerId: string; expectedVersion: number; action: ApprovalAction | 'REASSIGN'; actorUserId: string; requestId: string; reason?: string; assigneeUserId?: string; customerScope?: DataScopeGrant }): Promise<CustomerRecord>;
  recordAudit?(input: { organizationId: string; actorUserId: string; action: string; resourceType: string; resourceId?: string; outcome: 'DENIED' | 'FAILED'; requestId: string; reason: string }): Promise<void>;
}

export class CrmService {
  constructor(private readonly store: CrmStore) {}

  async createCustomer(principal: AuthorizationPrincipal, input: CreateCustomerInput, requestId: string, client: PoolClient): Promise<CustomerRecord> {
    await this.require(principal, 'customer.create', requestId, undefined, 'customer.create');
    const businessGroupId = await this.store.resolvePrimaryBusinessGroup(client, principal.organizationId, principal.userId);
    if (businessGroupId === undefined) { await this.recordDenied(principal, 'customer.create', undefined, requestId, 'no-active-business-group'); throw new DomainProblemError('PERMISSION_DENIED', 403); }
    if (typeof input.name !== 'string' || input.name.trim().length === 0) throw new DomainProblemError('VALIDATION_FAILED', 400);
    return this.store.insertCustomer(client, {
      id: randomUUID(), organizationId: principal.organizationId, name: input.name.trim(), ownerUserId: principal.userId, businessGroupId,
      contacts: input.contacts ?? [], actorUserId: principal.userId, requestId,
    });
  }

  async getCustomer(principal: AuthorizationPrincipal, customerId: string, requestId = '00000000-0000-4000-8000-000000000000'): Promise<CustomerRecord> {
    await this.require(principal, 'customer.read', requestId, customerId, 'customer.read');
    const customer = await this.store.findCustomer(principal.organizationId, customerId);
    if (customer === undefined || !canSeeCustomer(principal, customer)) { await this.recordDenied(principal, 'customer.read', customerId, requestId, 'scope-denied'); throw new DomainProblemError('RESOURCE_NOT_FOUND', 404); }
    return this.project(principal, customer);
  }

  async listCustomers(principal: AuthorizationPrincipal, filters: CustomerFilters, requestId = '00000000-0000-4000-8000-000000000000'): Promise<CustomerPage> {
    await this.require(principal, 'customer.read', requestId, undefined, 'customer.read');
    const page = await this.store.listCustomers(principal, filters);
    return { ...page, data: page.data.map((customer) => this.project(principal, customer)) };
  }

  async updateCustomer(principal: AuthorizationPrincipal, customerId: string, expectedVersion: number, input: UpdateCustomerInput, requestId: string, client: PoolClient): Promise<CustomerRecord> {
    await this.require(principal, 'customer.update', requestId, customerId, 'customer.update');
    if (input.ownerUserId !== undefined || input.businessGroupId !== undefined) throw new DomainProblemError('VALIDATION_FAILED', 400);
    const customer = await this.requireVisible(principal, customerId, client, requestId, 'customer.update');
    if (customer.version !== expectedVersion) throw await this.versionConflict(principal, customer, requestId, 'customer.update');
    return this.store.updateCustomer(client, { organizationId: principal.organizationId, customerId, expectedVersion, ...(input.name === undefined ? {} : { name: input.name.trim() }), ...(input.contacts === undefined ? {} : { contacts: input.contacts }), actorUserId: principal.userId, requestId });
  }

  async commandCustomer(principal: AuthorizationPrincipal, customerId: string, expectedVersion: number, input: { action: ApprovalAction | 'REASSIGN'; reason?: string; assigneeUserId?: string }, requestId: string, client: PoolClient): Promise<CustomerRecord> {
    const permission = input.action === 'REASSIGN' ? 'customer.reassign' : input.action === 'APPROVE' || input.action === 'REJECT' ? 'customer.approve' : 'customer.update';
    await this.require(principal, permission, requestId, customerId, `customer.${input.action.toLowerCase()}`);
    const customer = await this.requireVisible(principal, customerId, client, requestId, `customer.${input.action.toLowerCase()}`);
    if (customer.version !== expectedVersion) throw await this.versionConflict(principal, customer, requestId, `customer.${input.action.toLowerCase()}`);
    if (input.action !== 'REASSIGN') {
      try {
        assertApprovalTransition({ status: customer.status, action: input.action, ...(typeof customer.approvalSummary?.submitterUserId === 'string' ? { submitterUserId: customer.approvalSummary.submitterUserId } : {}), actorUserId: principal.userId, ...(input.reason === undefined ? {} : { reason: input.reason }), contacts: customer.contacts });
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message === 'submitter-approver-separation') { await this.recordDenied(principal, `customer.${input.action.toLowerCase()}`, customerId, requestId, 'submitter-approver-separation'); throw new DomainProblemError('PERMISSION_DENIED', 403); }
        if (message === 'REJECTION_REASON_REQUIRED' || message === 'CUSTOMER_APPROVAL_CONTACTS_INCOMPLETE') throw new DomainProblemError('VALIDATION_FAILED', 400);
        throw new DomainProblemError('CUSTOMER_APPROVAL_STATE_CONFLICT', 409, { customerId, currentCustomerStatus: customer.status, currentVersion: customer.version });
      }
    }
    const customerScope = principal.scopes.get('CUSTOMER');
    return this.store.commandCustomer(client, { organizationId: principal.organizationId, customerId, expectedVersion, action: input.action, actorUserId: principal.userId, requestId, ...(customerScope === undefined ? {} : { customerScope }), ...(input.reason === undefined ? {} : { reason: input.reason }), ...(input.assigneeUserId === undefined ? {} : { assigneeUserId: input.assigneeUserId }) });
  }

  private async requireVisible(principal: AuthorizationPrincipal, customerId: string, client: PoolClient | undefined, requestId: string, action: string): Promise<CustomerRecord> {
    const customer = await this.store.findCustomer(principal.organizationId, customerId, client);
    if (customer === undefined || !canSeeCustomer(principal, customer)) { await this.recordDenied(principal, action, customerId, requestId, 'scope-denied'); throw new DomainProblemError('RESOURCE_NOT_FOUND', 404); }
    return customer;
  }

  private project(principal: AuthorizationPrincipal, customer: CustomerRecord): CustomerRecord {
    if (principal.permissions.has('customer.approve') || customer.approvalSummary === undefined) return customer;
    const { latestOutcome, attemptId, attemptNo, canResubmit } = customer.approvalSummary;
    return { ...customer, approvalSummary: { latestOutcome, attemptId, attemptNo, canResubmit } };
  }

  private async versionConflict(principal: AuthorizationPrincipal, customer: CustomerRecord, requestId: string, action: string): Promise<DomainProblemError> {
    await this.recordDenied(principal, action, customer.id, requestId, 'version-conflict', 'FAILED');
    return new DomainProblemError('VERSION_CONFLICT', 409, { currentVersion: customer.version, currentEtag: `"v${customer.version}"`, resourceHref: `/api/v1/customers/${customer.id}` });
  }

  private async require(principal: AuthorizationPrincipal, permission: string, requestId: string, resourceId: string | undefined, action: string): Promise<void> {
    if (principal.status !== 'ACTIVE' || !principal.permissions.has(permission)) { await this.recordDenied(principal, action, resourceId, requestId, 'permission-denied'); throw new DomainProblemError('PERMISSION_DENIED', 403); }
  }

  private async recordDenied(principal: AuthorizationPrincipal, action: string, resourceId: string | undefined, requestId: string, reason: string, outcome: 'DENIED' | 'FAILED' = 'DENIED'): Promise<void> {
    await this.store.recordAudit?.({ organizationId: principal.organizationId, actorUserId: principal.userId, action, resourceType: 'CUSTOMER', ...(resourceId === undefined ? {} : { resourceId }), outcome, requestId, reason });
  }
}

export function toCustomerApi(customer: CustomerRecord, principal: AuthorizationPrincipal): Record<string, unknown> {
  const capabilities = customerCapabilities({ status: customer.status, canApprove: principal.permissions.has('customer.approve'), canUpdate: principal.permissions.has('customer.update') });
  const summary = customer.approvalSummary;
  const publicSummary = summary === undefined ? undefined : {
    latestOutcome: summary.latestOutcome,
    attemptId: summary.attemptId,
    attemptNo: summary.attemptNo,
    ...(typeof summary.reason === 'string' ? { reason: summary.reason } : {}),
    ...(typeof summary.decidedAt === 'string' ? { decidedAt: summary.decidedAt } : {}),
    ...(typeof summary.decidedBy === 'string' ? { decidedBy: summary.decidedBy } : {}),
    canResubmit: summary.canResubmit,
  };
  return { id: customer.id, organizationId: customer.organizationId, name: customer.name, version: customer.version, createdAt: customer.createdAt, updatedAt: customer.updatedAt, status: customer.status, ...(customer.ownerUserId === undefined ? {} : { ownerUserId: customer.ownerUserId }), ...(customer.businessGroupId === undefined ? {} : { businessGroupId: customer.businessGroupId }), contacts: customer.contacts, ...(publicSummary === undefined ? {} : { approvalSummary: publicSummary }), capabilities };
}
