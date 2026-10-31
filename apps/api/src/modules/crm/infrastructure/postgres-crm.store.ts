import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient, QueryResultRow } from 'pg';
import { createCursor, parseCursor, parsePageSize, parseSort } from '../../../common/http/cursor.js';
import { DomainProblemError } from '../../../common/http/domain-error.js';
import type { AuthorizationPrincipal } from '../../identity/domain/authz.js';
import type { CrmStore, CustomerFilters, CustomerPage, CustomerRecord } from '../application/crm.service.js';

interface CustomerRow extends QueryResultRow {
  id: string; organization_id: string; name: string; owner_user_id: string; business_group_id: string | null; status: CustomerRecord['status']; contacts: readonly Record<string, unknown>[]; version: number | string; created_at: Date; updated_at: Date;
  approval_attempt_id: string | null; approval_attempt_no: number | string | null; approval_outcome: 'PENDING' | 'APPROVED' | 'REJECTED' | null; approval_reason: string | null; approval_decided_by: string | null; approval_decided_at: Date | null; approval_submitter_user_id: string | null;
}

export class PostgresCrmStore implements CrmStore {
  constructor(private readonly pool: Pool) {}

  async resolvePrimaryBusinessGroup(client: PoolClient, organizationId: string, userId: string): Promise<string | undefined> {
    const result = await client.query<{ business_group_id: string }>(`SELECT business_group_id FROM org.membership WHERE organization_id = $1 AND user_id = $2 AND status = 'ACTIVE' AND valid_to IS NULL ORDER BY is_primary DESC, id LIMIT 1`, [organizationId, userId]);
    return result.rows[0]?.business_group_id;
  }

  async insertCustomer(client: PoolClient, input: Parameters<CrmStore['insertCustomer']>[1]): Promise<CustomerRecord> {
    await client.query(`INSERT INTO crm.customer (id, organization_id, name, owner_user_id, business_group_id, contacts) VALUES ($1, $2, $3, $4, $5, $6::jsonb)`, [input.id, input.organizationId, input.name, input.ownerUserId, input.businessGroupId ?? null, JSON.stringify(input.contacts)]);
    await appendAudit(client, { organizationId: input.organizationId, actorUserId: input.actorUserId, action: 'customer.created', resourceType: 'CUSTOMER', resourceId: input.id, outcome: 'SUCCEEDED', requestId: input.requestId, afterSummary: { status: 'DRAFT' } });
    await appendOutbox(client, input.organizationId, input.id, 'customer.created', { customerId: input.id, requestId: input.requestId });
    const customer = await this.findCustomer(input.organizationId, input.id, client);
    if (customer === undefined) throw new Error('Customer insert returned no row.');
    return customer;
  }

  async findCustomer(organizationId: string, customerId: string, client?: PoolClient): Promise<CustomerRecord | undefined> {
    const executor = client ?? this.pool;
    const result = await executor.query<CustomerRow>(`${customerSelect()} WHERE c.organization_id = $1 AND c.id = $2 ${client === undefined ? '' : 'FOR UPDATE OF c'}`, [organizationId, customerId]);
    const row = result.rows[0];
    return row === undefined ? undefined : mapCustomer(row);
  }

  async listCustomers(principal: AuthorizationPrincipal, filters: CustomerFilters): Promise<CustomerPage> {
    const sort = parseSort(filters.sort);
    const size = parsePageSize(filters.size);
    const sortColumn = sort.includes('createdAt') ? 'created_at' : 'updated_at';
    const filter = { statuses: filters.statuses ?? [], groupIds: filters.groupIds ?? [], ownerIds: filters.ownerIds ?? [] };
    const cursor = parseCursor(filters.after, sort, filter);
    const values: unknown[] = [principal.organizationId];
    let index = values.length;
    const conditions = ['c.organization_id = $1'];
    const scope = principal.scopes.get('CUSTOMER');
    if (scope === undefined || (scope.scopeType === 'GROUP_SET' && scope.groupIds.length === 0)) conditions.push('1 = 0');
    else if (scope.scopeType === 'OWN') { values.push(principal.userId); conditions.push(`c.owner_user_id = $${++index}`); }
    else if (scope.scopeType === 'GROUP_SET') { values.push(scope.groupIds); conditions.push(`c.business_group_id = ANY($${++index}::uuid[])`); }
    if (filter.statuses.length > 0) { values.push(filter.statuses); conditions.push(`c.status = ANY($${++index}::text[])`); }
    if (filter.groupIds.length > 0) { values.push(filter.groupIds); conditions.push(`c.business_group_id = ANY($${++index}::uuid[])`); }
    if (filter.ownerIds.length > 0) { values.push(filter.ownerIds); conditions.push(`c.owner_user_id = ANY($${++index}::uuid[])`); }
    if (cursor !== undefined) {
      values.push(cursor.updatedAt, cursor.id);
      conditions.push(sort.startsWith('-') ? `(c.${sortColumn}, c.id) < ($${++index}::timestamptz, $${++index}::uuid)` : `(c.${sortColumn}, c.id) > ($${++index}::timestamptz, $${++index}::uuid)`);
    }
    values.push(size + 1);
    const result = await this.pool.query<CustomerRow>(`${customerSelect()} WHERE ${conditions.join(' AND ')} ORDER BY c.${sortColumn} ${sort.startsWith('-') ? 'DESC' : 'ASC'}, c.id ${sort.startsWith('-') ? 'DESC' : 'ASC'} LIMIT $${++index}`, values);
    const rows = result.rows.slice(0, size);
    const hasNext = result.rows.length > size;
    const last = rows.at(-1);
    return { data: rows.map(mapCustomer), page: { hasNext, nextCursor: hasNext && last !== undefined ? createCursor({ updatedAt: (sortColumn === 'created_at' ? last.created_at : last.updated_at).toISOString(), id: last.id }, sort, filter) : null } };
  }

  async updateCustomer(client: PoolClient, input: Parameters<CrmStore['updateCustomer']>[1]): Promise<CustomerRecord> {
    const result = await client.query(`UPDATE crm.customer SET name = COALESCE($4, name), contacts = COALESCE($5::jsonb, contacts), version = version + 1, updated_at = clock_timestamp() WHERE organization_id = $1 AND id = $2 AND version = $3 RETURNING id`, [input.organizationId, input.customerId, input.expectedVersion, input.name ?? null, input.contacts === undefined ? null : JSON.stringify(input.contacts)]);
    if (result.rowCount !== 1) throw await this.versionConflict(client, input.organizationId, input.customerId);
    await appendAudit(client, { organizationId: input.organizationId, actorUserId: input.actorUserId, action: 'customer.updated', resourceType: 'CUSTOMER', resourceId: input.customerId, outcome: 'SUCCEEDED', requestId: input.requestId });
    await appendOutbox(client, input.organizationId, input.customerId, 'customer.updated', { customerId: input.customerId, requestId: input.requestId });
    const customer = await this.findCustomer(input.organizationId, input.customerId, client);
    if (customer === undefined) throw new Error('Updated customer disappeared.');
    return customer;
  }

  async commandCustomer(client: PoolClient, input: Parameters<CrmStore['commandCustomer']>[1]): Promise<CustomerRecord> {
    const current = await this.findCustomer(input.organizationId, input.customerId, client);
    if (current === undefined) throw new DomainProblemError('RESOURCE_NOT_FOUND', 404);
    if (current.version !== input.expectedVersion) throw await this.versionConflict(client, input.organizationId, input.customerId);
    if (input.action === 'SUBMIT_APPROVAL') return this.submitApproval(client, current, input);
    if (input.action === 'REASSIGN') return this.reassign(client, current, input);
    if (current.status !== 'PENDING_APPROVAL' || current.approvalSummary === undefined) throw new DomainProblemError('CUSTOMER_APPROVAL_STATE_CONFLICT', 409, { customerId: current.id, currentCustomerStatus: current.status, currentVersion: current.version });
    const pendingAttemptId = String(current.approvalSummary.attemptId);
    const nextStatus = input.action === 'APPROVE' ? 'APPROVED' : 'DRAFT';
    const outcome = input.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    if (outcome === 'REJECTED' && (input.reason === undefined || input.reason.trim().length === 0)) throw new DomainProblemError('VALIDATION_FAILED', 400);
    await client.query(`UPDATE crm.customer_approval_attempt SET outcome = $3, reason = $4, decided_by = $5, decided_at = clock_timestamp() WHERE organization_id = $1 AND id = $2 AND outcome = 'PENDING'`, [input.organizationId, pendingAttemptId, outcome, input.reason ?? null, input.actorUserId]);
    await client.query(`UPDATE crm.customer SET status = $3, version = version + 1, updated_at = clock_timestamp() WHERE organization_id = $1 AND id = $2 AND version = $4`, [input.organizationId, input.customerId, nextStatus, input.expectedVersion]);
    await appendAudit(client, { organizationId: input.organizationId, actorUserId: input.actorUserId, action: `customer.${input.action.toLowerCase()}`, resourceType: 'CUSTOMER', resourceId: input.customerId, outcome: 'SUCCEEDED', requestId: input.requestId, afterSummary: { status: nextStatus, approvalOutcome: outcome } });
    await appendOutbox(client, input.organizationId, input.customerId, `customer.${input.action.toLowerCase()}`, { customerId: input.customerId, approvalAttemptId: pendingAttemptId, requestId: input.requestId });
    const result = await this.findCustomer(input.organizationId, input.customerId, client);
    if (result === undefined) throw new Error('Approved customer disappeared.');
    return result;
  }

  private async submitApproval(client: PoolClient, current: CustomerRecord, input: Parameters<CrmStore['commandCustomer']>[1]): Promise<CustomerRecord> {
    if (current.status !== 'DRAFT' || current.contacts.length === 0) throw new DomainProblemError('CUSTOMER_APPROVAL_STATE_CONFLICT', 409, { customerId: current.id, currentCustomerStatus: current.status, currentVersion: current.version });
    const attempt = await client.query<{ attempt_no: number }>('SELECT COALESCE(MAX(attempt_no), 0) + 1 AS attempt_no FROM crm.customer_approval_attempt WHERE organization_id = $1 AND customer_id = $2', [input.organizationId, input.customerId]);
    const attemptNo = Number(attempt.rows[0]?.attempt_no ?? 1);
    const attemptId = randomUUID();
    await client.query(`INSERT INTO crm.customer_approval_attempt (id, organization_id, customer_id, attempt_no, submitter_user_id) VALUES ($1, $2, $3, $4, $5)`, [attemptId, input.organizationId, input.customerId, attemptNo, input.actorUserId]);
    await client.query(`UPDATE crm.customer SET status = 'PENDING_APPROVAL', version = version + 1, updated_at = clock_timestamp() WHERE organization_id = $1 AND id = $2 AND version = $3`, [input.organizationId, input.customerId, input.expectedVersion]);
    await appendAudit(client, { organizationId: input.organizationId, actorUserId: input.actorUserId, action: 'customer.submitted', resourceType: 'CUSTOMER', resourceId: input.customerId, outcome: 'SUCCEEDED', requestId: input.requestId, afterSummary: { status: 'PENDING_APPROVAL', attemptNo } });
    await appendOutbox(client, input.organizationId, input.customerId, 'customer.submitted', { customerId: input.customerId, approvalAttemptId: attemptId, requestId: input.requestId });
    const result = await this.findCustomer(input.organizationId, input.customerId, client);
    if (result === undefined) throw new Error('Submitted customer disappeared.');
    return result;
  }

  private async reassign(client: PoolClient, current: CustomerRecord, input: Parameters<CrmStore['commandCustomer']>[1]): Promise<CustomerRecord> {
    if (input.assigneeUserId === undefined) throw new DomainProblemError('VALIDATION_FAILED', 400);
    const membership = await client.query<{ business_group_id: string }>(`SELECT business_group_id FROM org.membership WHERE organization_id = $1 AND user_id = $2 AND status = 'ACTIVE' AND valid_to IS NULL ORDER BY is_primary DESC, id LIMIT 1`, [input.organizationId, input.assigneeUserId]);
    const groupId = membership.rows[0]?.business_group_id;
    if (groupId === undefined) throw new DomainProblemError('PERMISSION_DENIED', 403);
    await client.query(`UPDATE crm.customer SET owner_user_id = $3, business_group_id = $4, version = version + 1, updated_at = clock_timestamp() WHERE organization_id = $1 AND id = $2 AND version = $5`, [input.organizationId, input.customerId, input.assigneeUserId, groupId, input.expectedVersion]);
    await client.query(`INSERT INTO crm.customer_assignment_history (id, organization_id, customer_id, from_owner_user_id, from_business_group_id, to_owner_user_id, to_business_group_id, actor_user_id, reason) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [randomUUID(), input.organizationId, input.customerId, current.ownerUserId ?? null, current.businessGroupId ?? null, input.assigneeUserId, groupId, input.actorUserId, input.reason?.trim() || 'Reassigned']);
    await appendAudit(client, { organizationId: input.organizationId, actorUserId: input.actorUserId, action: 'customer.reassigned', resourceType: 'CUSTOMER', resourceId: input.customerId, outcome: 'SUCCEEDED', requestId: input.requestId, afterSummary: { ownerUserId: input.assigneeUserId, businessGroupId: groupId } });
    await appendOutbox(client, input.organizationId, input.customerId, 'customer.reassigned', { customerId: input.customerId, ownerUserId: input.assigneeUserId, businessGroupId: groupId, requestId: input.requestId });
    const result = await this.findCustomer(input.organizationId, input.customerId, client);
    if (result === undefined) throw new Error('Reassigned customer disappeared.');
    return result;
  }

  private async versionConflict(client: PoolClient, organizationId: string, customerId: string): Promise<DomainProblemError> {
    const result = await client.query<{ status: CustomerRecord['status']; version: number }>('SELECT status, version FROM crm.customer WHERE organization_id = $1 AND id = $2', [organizationId, customerId]);
    const row = result.rows[0];
    if (row === undefined) return new DomainProblemError('RESOURCE_NOT_FOUND', 404);
    return new DomainProblemError('VERSION_CONFLICT', 409, { currentVersion: row.version, currentEtag: `"v${row.version}"`, resourceHref: `/api/v1/customers/${customerId}` });
  }
}

function customerSelect(alias = 'c'): string {
  return `SELECT ${alias}.id, ${alias}.organization_id, ${alias}.name, ${alias}.owner_user_id, ${alias}.business_group_id, ${alias}.status, ${alias}.contacts, ${alias}.version, ${alias}.created_at, ${alias}.updated_at, a.id AS approval_attempt_id, a.attempt_no AS approval_attempt_no, a.outcome AS approval_outcome, a.reason AS approval_reason, a.decided_by AS approval_decided_by, a.decided_at AS approval_decided_at, a.submitter_user_id AS approval_submitter_user_id FROM crm.customer AS ${alias} LEFT JOIN LATERAL (SELECT * FROM crm.customer_approval_attempt ca WHERE ca.organization_id = ${alias}.organization_id AND ca.customer_id = ${alias}.id ORDER BY ca.attempt_no DESC LIMIT 1) AS a ON true`;
}

function mapCustomer(row: CustomerRow): CustomerRecord {
  const approvalSummary = row.approval_attempt_id === null ? undefined : {
    latestOutcome: row.approval_outcome,
    attemptId: row.approval_attempt_id,
    attemptNo: Number(row.approval_attempt_no),
    ...(row.approval_reason === null ? {} : { reason: row.approval_reason }),
    ...(row.approval_decided_at === null ? {} : { decidedAt: row.approval_decided_at.toISOString() }),
    ...(row.approval_decided_by === null ? {} : { decidedBy: row.approval_decided_by }),
    canResubmit: row.approval_outcome === 'REJECTED',
    submitterUserId: row.approval_submitter_user_id,
  };
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    ownerUserId: row.owner_user_id,
    ...(row.business_group_id === null ? {} : { businessGroupId: row.business_group_id }),
    status: row.status,
    contacts: Array.isArray(row.contacts) ? row.contacts : [],
    ...(approvalSummary === undefined ? {} : { approvalSummary }),
    version: Number(row.version),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function appendAudit(client: PoolClient, input: { organizationId: string; actorUserId: string; action: string; resourceType: string; resourceId: string; outcome: 'SUCCEEDED' | 'DENIED' | 'FAILED'; requestId: string; afterSummary?: Record<string, unknown> }): Promise<void> {
  await client.query(`INSERT INTO audit.audit_event (id, organization_id, actor_user_id, action, resource_type, resource_id, outcome, request_id, after_summary) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`, [randomUUID(), input.organizationId, input.actorUserId, input.action, input.resourceType, input.resourceId, input.outcome, input.requestId, JSON.stringify(input.afterSummary ?? {})]);
}

async function appendOutbox(client: PoolClient, organizationId: string, aggregateId: string, eventType: string, payload: Record<string, unknown>): Promise<void> {
  await client.query(`INSERT INTO integration.outbox_event (id, organization_id, aggregate_type, aggregate_id, event_type, payload) VALUES ($1, $2, 'CUSTOMER', $3, $4, $5::jsonb)`, [randomUUID(), organizationId, aggregateId, eventType, JSON.stringify(payload)]);
}
