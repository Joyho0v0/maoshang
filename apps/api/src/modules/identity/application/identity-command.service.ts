import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import {
  assertCanGrant,
  authorize,
  AuthorizationDeniedError,
  type AuthorizationPrincipal,
  type DataScopeGrant,
} from '../domain/authz.js';
import type { IdentityUser } from './types.js';

export interface AuditEventInput {
  organizationId: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  outcome: 'SUCCEEDED' | 'DENIED' | 'FAILED';
  reason?: string;
  beforeSummary?: Record<string, unknown>;
  afterSummary?: Record<string, unknown>;
  requestId: string;
  traceId?: string;
}

export interface CreateUserMutation {
  id: string;
  organizationId: string;
  username: string;
  role: string;
  actorUserId: string;
  defaultGroupIds: readonly string[];
  audit: AuditEventInput;
  client?: PoolClient;
}

export interface RoleBindingMutation {
  organizationId: string;
  targetUserId: string;
  actorUserId: string;
  roles: readonly string[];
  expectedVersion: number;
  audit: AuditEventInput;
  client?: PoolClient;
}

export interface DataScopeMutation {
  organizationId: string;
  targetUserId: string;
  actorUserId: string;
  grants: readonly DataScopeGrant[];
  expectedVersion: number;
  audit: AuditEventInput;
  client?: PoolClient;
}

export interface DisableUserMutation {
  organizationId: string;
  targetUserId: string;
  actorUserId: string;
  expectedVersion: number;
  audit: AuditEventInput;
  client?: PoolClient;
}

export interface AuditQueryFilters {
  after?: string;
  size?: number;
  actorUserId?: readonly string[];
  action?: readonly string[];
  resourceType?: readonly string[];
}

export interface AuditEventView {
  id: string;
  organizationId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, unknown>;
}

export interface AuditEventPage {
  data: readonly AuditEventView[];
  page: { nextCursor: string | null; hasNext: boolean };
}

export interface IdentityMutationStore {
  findUserById(id: string): Promise<IdentityUser | undefined>;
  findRolePermissions(role: string): Promise<readonly string[]>;
  createUser(input: CreateUserMutation): Promise<IdentityUser>;
  replaceRoleBindings(input: RoleBindingMutation): Promise<IdentityUser>;
  replaceDataScopeGrants(input: DataScopeMutation): Promise<IdentityUser>;
  disableUser(input: DisableUserMutation): Promise<IdentityUser>;
  enqueueDisableUser?(input: DisableUserMutation & DisableCommandClaim): Promise<void>;
  recordAudit(input: AuditEventInput): Promise<void>;
}

export interface DisableCommandClaim {
  commandId: string;
  operationId: string;
  ownerToken: Buffer;
  startedAt: string;
  expiresAt: string;
  retryAfterMs: number;
}

export interface IdentityAuditQueryStore {
  listAuditEvents(input: { principal: AuthorizationPrincipal; filters: AuditQueryFilters }): Promise<AuditEventPage>;
}

export class IdentityUserNotFoundError extends Error {
  constructor() {
    super('The requested identity resource is not available.');
    this.name = 'IdentityUserNotFoundError';
  }
}

export class IdentityVersionConflictError extends Error {
  constructor(readonly currentVersion: number) {
    super('The identity resource changed since it was read.');
    this.name = 'IdentityVersionConflictError';
  }
}

export class IdentityCursorError extends Error {
  constructor() {
    super('The audit cursor is invalid.');
    this.name = 'IdentityCursorError';
  }
}

export class IdentityCommandService {
  constructor(private readonly store: IdentityMutationStore & IdentityAuditQueryStore) {}

  async getUser(principal: AuthorizationPrincipal, targetUserId: string, requestId: string): Promise<IdentityUser> {
    const target = await this.store.findUserById(targetUserId);
    if (target === undefined || !this.canAccessUser(principal, 'identity.user.read', target)) {
      await this.recordDenied(principal, 'identity.user.read', targetUserId, requestId, target === undefined ? 'not-found' : 'out-of-scope');
      throw new IdentityUserNotFoundError();
    }
    return target;
  }

  async createUser(
    principal: AuthorizationPrincipal,
    organizationId: string,
    input: { username: string; role: string },
    requestId: string,
    client?: PoolClient,
  ): Promise<IdentityUser> {
    const resourceId = randomUUID();
    try {
      await this.assertCanManageOrganization(principal, 'identity.user.create', organizationId, resourceId, requestId);
      await this.assertKnownRole(principal, 'identity.user.create', input.role, resourceId, requestId);
      await this.assertRolePermissions(principal, [input.role], resourceId, requestId);
      const user = await this.store.createUser({
        id: resourceId,
        organizationId,
        username: normalizeUsername(input.username),
        role: input.role,
        actorUserId: principal.userId,
        defaultGroupIds: [],
        audit: this.audit(principal, 'identity.user.create', resourceId, requestId, 'SUCCEEDED', undefined, { role: input.role }),
        ...(client === undefined ? {} : { client }),
      });
      return user;
    } catch (error) {
      if (error instanceof IdentityUserNotFoundError || error instanceof AuthorizationDeniedError) throw error;
      throw error;
    }
  }

  async updateRoleBindings(principal: AuthorizationPrincipal, targetUserId: string, expectedVersion: number, roles: readonly string[], requestId: string, client?: PoolClient): Promise<IdentityUser> {
    const target = await this.requireTarget(principal, targetUserId, 'identity.role.grant', requestId);
    await this.assertExpectedVersion(target, expectedVersion, principal, 'identity.role.grant', requestId);
    if (roles.length === 0 || new Set(roles).size !== roles.length) return this.reject(principal, 'identity.role.grant', targetUserId, requestId, 'role-bindings-invalid');
    for (const role of roles) await this.assertKnownRole(principal, 'identity.role.grant', role, targetUserId, requestId);
    await this.assertRolePermissions(principal, roles, targetUserId, requestId);
    return this.store.replaceRoleBindings({
      organizationId: principal.organizationId,
      targetUserId,
      actorUserId: principal.userId,
      roles,
      expectedVersion,
      audit: this.audit(principal, 'identity.role.grant', targetUserId, requestId, 'SUCCEEDED', { roles: target.roles }, { roles }),
      ...(client === undefined ? {} : { client }),
    });
  }

  async updateDataScopeGrants(principal: AuthorizationPrincipal, targetUserId: string, expectedVersion: number, rawGrants: readonly { scope: string }[], requestId: string, client?: PoolClient): Promise<IdentityUser> {
    const target = await this.requireTarget(principal, targetUserId, 'identity.scope.grant', requestId);
    await this.assertExpectedVersion(target, expectedVersion, principal, 'identity.scope.grant', requestId);
    let grants: DataScopeGrant[];
    try {
      grants = rawGrants.map((grant) => parseScopeGrant(grant.scope));
    } catch (error) {
      if (error instanceof AuthorizationDeniedError) return this.reject(principal, 'identity.scope.grant', targetUserId, requestId, error.reason);
      throw error;
    }
    if (new Set(grants.map((grant) => grant.resourceType)).size !== grants.length) return this.reject(principal, 'identity.scope.grant', targetUserId, requestId, 'duplicate-resource-scope');
    for (const grant of grants) {
      try {
        assertCanGrant(principal, 'identity.scope.grant', grant);
      } catch (error) {
        if (error instanceof AuthorizationDeniedError) return this.reject(principal, 'identity.scope.grant', targetUserId, requestId, error.reason);
        throw error;
      }
    }
    return this.store.replaceDataScopeGrants({
      organizationId: principal.organizationId,
      targetUserId,
      actorUserId: principal.userId,
      grants,
      expectedVersion,
      audit: this.audit(principal, 'identity.scope.grant', targetUserId, requestId, 'SUCCEEDED', { scopes: target.scopes }, { scopes: grants }),
      ...(client === undefined ? {} : { client }),
    });
  }

  async disableUser(principal: AuthorizationPrincipal, targetUserId: string, expectedVersion: number, requestId: string, client?: PoolClient): Promise<IdentityUser> {
    const mutation = await this.prepareDisableUser(principal, targetUserId, expectedVersion, requestId);
    return this.store.disableUser({ ...mutation, ...(client === undefined ? {} : { client }) });
  }

  async prepareDisableUser(principal: AuthorizationPrincipal, targetUserId: string, expectedVersion: number, requestId: string): Promise<DisableUserMutation> {
    const target = await this.requireTarget(principal, targetUserId, 'identity.user.disable', requestId);
    await this.assertExpectedVersion(target, expectedVersion, principal, 'identity.user.disable', requestId);
    if (target.status === 'DISABLED') return this.reject(principal, 'identity.user.disable', targetUserId, requestId, 'already-disabled');
    return {
      organizationId: principal.organizationId,
      targetUserId,
      actorUserId: principal.userId,
      expectedVersion,
      audit: this.audit(principal, 'identity.user.disable', targetUserId, requestId, 'SUCCEEDED', { status: target.status }, { status: 'DISABLED' }),
    };
  }

  async queueDisableUser(principal: AuthorizationPrincipal, targetUserId: string, expectedVersion: number, requestId: string, claim: DisableCommandClaim, client?: PoolClient): Promise<void> {
    if (this.store.enqueueDisableUser === undefined) throw new Error('Identity command queue is not configured.');
    const mutation = await this.prepareDisableUser(principal, targetUserId, expectedVersion, requestId);
    await this.store.enqueueDisableUser({ ...mutation, ...claim, ...(client === undefined ? {} : { client }) });
  }

  async listAuditEvents(principal: AuthorizationPrincipal, filters: AuditQueryFilters, requestId: string): Promise<AuditEventPage> {
    const grant = principal.scopes.get('AUDIT');
    if (principal.status !== 'ACTIVE' || !principal.permissions.has('audit.read') || grant === undefined || (grant.scopeType === 'GROUP_SET' && grant.groupIds.length === 0)) {
      await this.recordDenied(principal, 'audit.read', principal.userId, requestId, 'audit-scope');
      throw new AuthorizationDeniedError('audit-scope');
    }
    return this.store.listAuditEvents({ principal, filters });
  }

  private async requireTarget(principal: AuthorizationPrincipal, targetUserId: string, permission: string, requestId: string): Promise<IdentityUser> {
    const target = await this.store.findUserById(targetUserId);
    if (target === undefined || !this.canAccessUser(principal, permission, target)) {
      await this.recordDenied(principal, permission, targetUserId, requestId, target === undefined ? 'not-found' : 'out-of-scope');
      throw new IdentityUserNotFoundError();
    }
    return target;
  }

  private canAccessUser(principal: AuthorizationPrincipal, permission: string, target: IdentityUser): boolean {
    return authorize(principal, permission, {
      organizationId: target.organizationId,
      resourceType: 'USER',
      ownerUserId: target.id,
      ...(target.primaryBusinessGroupId === undefined ? {} : { businessGroupId: target.primaryBusinessGroupId }),
    });
  }

  private async assertCanManageOrganization(principal: AuthorizationPrincipal, permission: string, organizationId: string, resourceId: string, requestId: string): Promise<void> {
    const grant = principal.scopes.get('USER');
    const allowed = principal.status === 'ACTIVE'
      && principal.organizationId === organizationId
      && principal.permissions.has(permission)
      && grant !== undefined
      && (grant.scopeType === 'ALL_ORG' || (grant.scopeType === 'GROUP_SET' && grant.groupIds.length > 0));
    if (!allowed) {
      await this.recordDenied(principal, permission, resourceId, requestId, 'out-of-scope');
      throw new AuthorizationDeniedError('organization-scope');
    }
  }

  private async assertRolePermissions(principal: AuthorizationPrincipal, roles: readonly string[], resourceId: string, requestId: string): Promise<void> {
    const permissions = new Set((await Promise.all(roles.map((role) => this.store.findRolePermissions(role)))).flat());
    if ([...permissions].every((permission) => principal.permissions.has(permission))) return;
    await this.recordDenied(principal, 'identity.role.grant', resourceId, requestId, 'permission-subset');
    throw new AuthorizationDeniedError('permission-subset');
  }

  private async assertExpectedVersion(target: IdentityUser, expectedVersion: number, principal: AuthorizationPrincipal, action: string, requestId: string): Promise<void> {
    if (target.version === expectedVersion) return;
    await this.recordDenied(principal, action, target.id, requestId, 'version-conflict', 'FAILED');
    throw new IdentityVersionConflictError(target.version);
  }

  private async assertKnownRole(principal: AuthorizationPrincipal, action: string, role: string, resourceId: string, requestId: string): Promise<void> {
    if (role !== 'SUPER_ADMIN' && role !== 'GROUP_LEADER' && role !== 'SALES') await this.reject(principal, action, resourceId, requestId, 'unknown-role');
  }

  private async recordDenied(principal: AuthorizationPrincipal, action: string, resourceId: string, requestId: string, reason: string, outcome: AuditEventInput['outcome'] = 'DENIED'): Promise<void> {
    await this.store.recordAudit(this.audit(principal, action, resourceId, requestId, outcome, undefined, undefined, reason));
  }

  private async reject(principal: AuthorizationPrincipal, action: string, resourceId: string, requestId: string, reason: string): Promise<never> {
    await this.recordDenied(principal, action, resourceId, requestId, reason);
    throw new AuthorizationDeniedError(reason);
  }

  private audit(principal: AuthorizationPrincipal, action: string, resourceId: string, requestId: string, outcome: AuditEventInput['outcome'], beforeSummary?: Record<string, unknown>, afterSummary?: Record<string, unknown>, reason?: string): AuditEventInput {
    return {
      organizationId: principal.organizationId,
      actorUserId: principal.userId,
      action,
      resourceType: 'USER',
      resourceId,
      outcome,
      ...(reason === undefined ? {} : { reason }),
      ...(beforeSummary === undefined ? {} : { beforeSummary }),
      ...(afterSummary === undefined ? {} : { afterSummary }),
      requestId,
    };
  }
}

export function parseScopeGrant(value: string): DataScopeGrant {
  const parts = value.split(':');
  const [resourceType, scopeType, groupText] = parts;
  const resource = resourceType;
  if (!/^[A-Z][A-Z0-9_]{1,31}$/.test(resource ?? '') || !['USER', 'ORGANIZATION', 'CUSTOMER', 'ORDER', 'INVENTORY', 'FILE', 'DOCUMENT', 'TASK', 'AUDIT'].includes(resource ?? '')) {
    throw new AuthorizationDeniedError('scope-resource-invalid');
  }
  if (scopeType !== 'OWN' && scopeType !== 'GROUP_SET' && scopeType !== 'ALL_ORG') throw new AuthorizationDeniedError('scope-type-invalid');
  if (scopeType === 'OWN' && parts.length !== 2) throw new AuthorizationDeniedError('OWN scope does not accept groups.');
  if (scopeType === 'ALL_ORG' && parts.length !== 2) throw new AuthorizationDeniedError('ALL_ORG scope does not accept groups.');
  if (scopeType === 'GROUP_SET' && parts.length !== 3) throw new AuthorizationDeniedError('GROUP_SET scope requires groups.');
  const groupIds = scopeType === 'GROUP_SET' ? (groupText ?? '').split(',') : [];
  if (scopeType === 'GROUP_SET' && (groupIds.length === 0 || groupIds.some((id) => !isUuid(id)))) throw new AuthorizationDeniedError('GROUP_SET scope requires valid groups.');
  return { resourceType: resource as string, scopeType, groupIds };
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
