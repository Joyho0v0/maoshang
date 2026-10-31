import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { DomainProblemError } from '../../../common/http/domain-error.js';
import type { AuthorizationPrincipal } from '../../identity/domain/authz.js';
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
  commandCustomer(client: PoolClient, input: { organizationId: string; customerId: string; expectedVersion: number; action: ApprovalAction | 'REASSIGN'; actorUserId: string; requestId: string; reason?: string; assigneeUserId?: string }): Promise<CustomerRecord>;
}

export class CrmService {
  constructor(private readonly store: CrmStore) {}

  async createCustomer(principal: AuthorizationPrincipal, input: CreateCustomerInput, requestId: string, client: PoolClient): Promise<CustomerRecord> {
    this.require(principal, 'customer.create');
    const businessGroupId = await this.store.resolvePrimaryBusinessGroup(client, principal.organizationId, principal.userId);
    if (businessGroupId === undefined) throw new DomainProblemError('PERMISSION_DENIED', 403);
    if (typeof input.name !== 'string' || input.name.trim().length === 0) throw new DomainProblemError('VALIDATION_FAILED', 400);
    return this.store.insertCustomer(client, {
      id: randomUUID(), organizationId: principal.organizationId, name: input.name.trim(), ownerUserId: principal.userId, businessGroupId,
      contacts: input.contacts ?? [], actorUserId: principal.userId, requestId,
    });
  }

  async getCustomer(principal: AuthorizationPrincipal, customerId: string): Promise<CustomerRecord> {
    this.require(principal, 'customer.read');
    const customer = await this.store.findCustomer(principal.organizationId, customerId);
    if (customer === undefined || !canSeeCustomer(principal, customer)) throw new DomainProblemError('RESOURCE_NOT_FOUND', 404);
    return this.project(principal, customer);
  }

  async listCustomers(principal: AuthorizationPrincipal, filters: CustomerFilters): Promise<CustomerPage> {
    this.require(principal, 'customer.read');
    return this.store.listCustomers(principal, filters);
  }

  async updateCustomer(principal: AuthorizationPrincipal, customerId: string, expectedVersion: number, input: UpdateCustomerInput, requestId: string, client: PoolClient): Promise<CustomerRecord> {
    this.require(principal, 'customer.update');
    if (input.ownerUserId !== undefined || input.businessGroupId !== undefined) throw new DomainProblemError('VALIDATION_FAILED', 400);
    const customer = await this.requireVisible(principal, customerId, client);
    if (customer.version !== expectedVersion) throw this.versionConflict(customer);
    return this.store.updateCustomer(client, { organizationId: principal.organizationId, customerId, expectedVersion, ...(input.name === undefined ? {} : { name: input.name.trim() }), ...(input.contacts === undefined ? {} : { contacts: input.contacts }), actorUserId: principal.userId, requestId });
  }

  async commandCustomer(principal: AuthorizationPrincipal, customerId: string, expectedVersion: number, input: { action: ApprovalAction | 'REASSIGN'; reason?: string; assigneeUserId?: string }, requestId: string, client: PoolClient): Promise<CustomerRecord> {
    const permission = input.action === 'REASSIGN' ? 'customer.reassign' : input.action === 'APPROVE' || input.action === 'REJECT' ? 'customer.approve' : 'customer.update';
    this.require(principal, permission);
    const customer = await this.requireVisible(principal, customerId, client);
    if (customer.version !== expectedVersion) throw this.versionConflict(customer);
    if (input.action !== 'REASSIGN') {
      try {
        assertApprovalTransition({ status: customer.status, action: input.action, ...(typeof customer.approvalSummary?.submitterUserId === 'string' ? { submitterUserId: customer.approvalSummary.submitterUserId } : {}), actorUserId: principal.userId, ...(input.reason === undefined ? {} : { reason: input.reason }), contacts: customer.contacts });
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message === 'submitter-approver-separation') throw new DomainProblemError('PERMISSION_DENIED', 403);
        if (message === 'REJECTION_REASON_REQUIRED' || message === 'CUSTOMER_APPROVAL_CONTACTS_INCOMPLETE') throw new DomainProblemError('VALIDATION_FAILED', 400);
        throw new DomainProblemError('CUSTOMER_APPROVAL_STATE_CONFLICT', 409, { customerId, currentCustomerStatus: customer.status, currentVersion: customer.version });
      }
    }
    return this.store.commandCustomer(client, { organizationId: principal.organizationId, customerId, expectedVersion, action: input.action, actorUserId: principal.userId, requestId, ...(input.reason === undefined ? {} : { reason: input.reason }), ...(input.assigneeUserId === undefined ? {} : { assigneeUserId: input.assigneeUserId }) });
  }

  private async requireVisible(principal: AuthorizationPrincipal, customerId: string, client?: PoolClient): Promise<CustomerRecord> {
    const customer = await this.store.findCustomer(principal.organizationId, customerId, client);
    if (customer === undefined || !canSeeCustomer(principal, customer)) throw new DomainProblemError('RESOURCE_NOT_FOUND', 404);
    return customer;
  }

  private project(principal: AuthorizationPrincipal, customer: CustomerRecord): CustomerRecord {
    if (principal.permissions.has('customer.approve') || customer.approvalSummary === undefined) return customer;
    const { latestOutcome, attemptId, canResubmit } = customer.approvalSummary;
    return { ...customer, approvalSummary: { latestOutcome, attemptId, canResubmit } };
  }

  private versionConflict(customer: CustomerRecord): DomainProblemError {
    return new DomainProblemError('VERSION_CONFLICT', 409, { currentVersion: customer.version, currentEtag: `"v${customer.version}"`, resourceHref: `/api/v1/customers/${customer.id}` });
  }

  private require(principal: AuthorizationPrincipal, permission: string): void {
    if (principal.status !== 'ACTIVE' || !principal.permissions.has(permission)) throw new DomainProblemError('PERMISSION_DENIED', 403);
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
  return { id: customer.id, organizationId: customer.organizationId, version: customer.version, createdAt: customer.createdAt, updatedAt: customer.updatedAt, status: customer.status, ...(customer.ownerUserId === undefined ? {} : { ownerUserId: customer.ownerUserId }), ...(customer.businessGroupId === undefined ? {} : { businessGroupId: customer.businessGroupId }), contacts: customer.contacts, ...(publicSummary === undefined ? {} : { approvalSummary: publicSummary }), capabilities };
}
