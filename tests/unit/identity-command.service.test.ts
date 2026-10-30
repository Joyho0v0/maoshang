import { describe, expect, it } from 'vitest';
import {
  IdentityCommandService,
  IdentityUserNotFoundError,
  IdentityVersionConflictError,
  type AuditEventPage,
  parseScopeGrant,
  type AuditEventInput,
  type IdentityMutationStore,
} from '../../apps/api/src/modules/identity/application/identity-command.service.js';
import type { IdentityUser } from '../../apps/api/src/modules/identity/application/types.js';
import type { AuthorizationPrincipal } from '../../apps/api/src/modules/identity/domain/authz.js';

const organizationId = '00000000-0000-4000-8000-000000000001';
const groupId = '00000000-0000-4000-8000-000000000002';
const actorId = '00000000-0000-4000-8000-000000000011';
const targetId = '00000000-0000-4000-8000-000000000012';

function user(id: string, overrides: Partial<IdentityUser> = {}): IdentityUser {
  return {
    id,
    organizationId,
    organizationStatus: 'ACTIVE',
    username: `${id}@example.test`,
    displayName: id,
    status: 'ACTIVE',
    version: 1,
    authzVersion: 1,
    sessionEpoch: 1,
    roles: ['GROUP_LEADER'],
    permissions: ['identity.user.read', 'identity.user.create', 'identity.user.disable', 'identity.role.grant', 'identity.scope.grant'],
    scopes: [
      { resourceType: 'USER', scopeType: 'GROUP_SET', groupIds: [groupId] },
      { resourceType: 'CUSTOMER', scopeType: 'GROUP_SET', groupIds: [groupId] },
    ],
    primaryBusinessGroupId: groupId,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function principal(overrides: Partial<AuthorizationPrincipal> = {}): AuthorizationPrincipal {
  const actor = user(actorId);
  return {
    userId: actor.id,
    organizationId,
    status: actor.status,
    permissions: new Set(actor.permissions),
    scopes: new Map(actor.scopes.map((scope) => [scope.resourceType, scope])),
    authzVersion: actor.authzVersion,
    sessionEpoch: actor.sessionEpoch,
    ...overrides,
  };
}

class FakeStore implements IdentityMutationStore {
  target = user(targetId);
  readonly audits: AuditEventInput[] = [];
  lastCreate: Parameters<IdentityMutationStore['createUser']>[0] | undefined;
  readonly rolePermissions = new Map<string, readonly string[]>([
    ['SALES', ['identity.user.read']],
    ['GROUP_LEADER', ['identity.user.read', 'identity.user.create', 'identity.user.disable']],
    ['SUPER_ADMIN', ['identity.user.read', 'identity.user.create', 'identity.user.disable', 'identity.role.grant', 'identity.scope.grant', 'audit.export']],
  ]);

  async findUserById(id: string): Promise<IdentityUser | undefined> {
    return id === this.target.id ? this.target : undefined;
  }

  async findRolePermissions(role: string): Promise<readonly string[]> {
    return this.rolePermissions.get(role) ?? [];
  }

  async createUser(input: Parameters<IdentityMutationStore['createUser']>[0]): Promise<IdentityUser> {
    this.lastCreate = input;
    this.target = user(input.id, { username: input.username, roles: [input.role] });
    return this.target;
  }

  async replaceRoleBindings(input: Parameters<IdentityMutationStore['replaceRoleBindings']>[0]): Promise<IdentityUser> {
    this.target = { ...this.target, roles: input.roles, version: this.target.version + 1 };
    return this.target;
  }

  async replaceDataScopeGrants(input: Parameters<IdentityMutationStore['replaceDataScopeGrants']>[0]): Promise<IdentityUser> {
    this.target = { ...this.target, scopes: input.grants, version: this.target.version + 1 };
    return this.target;
  }

  async disableUser(): Promise<IdentityUser> {
    this.target = { ...this.target, status: 'DISABLED', version: this.target.version + 1 };
    return this.target;
  }

  async recordAudit(input: AuditEventInput): Promise<void> {
    this.audits.push(input);
  }

  async listAuditEvents(): Promise<AuditEventPage> {
    return { data: [], page: { nextCursor: null, hasNext: false } };
  }
}

describe('identity command service', () => {
  it('parses only the controlled scope grammar', () => {
    expect(parseScopeGrant(`CUSTOMER:GROUP_SET:${groupId}`)).toEqual({ resourceType: 'CUSTOMER', scopeType: 'GROUP_SET', groupIds: [groupId] });
    expect(parseScopeGrant('CUSTOMER:OWN')).toEqual({ resourceType: 'CUSTOMER', scopeType: 'OWN', groupIds: [] });
    expect(() => parseScopeGrant('CUSTOMER:GROUP_SET')).toThrow(/group/i);
    expect(() => parseScopeGrant('CUSTOMER:ALL_ORG:unexpected')).toThrow(/ALL_ORG/i);
    expect(() => parseScopeGrant('CUSTOMER:ALL_ORG; DROP TABLE')).toThrow(/scope/i);
  });

  it('rejects a role whose permissions exceed the actor and records a denial', async () => {
    const store = new FakeStore();
    const service = new IdentityCommandService(store);

    await expect(service.updateRoleBindings(principal(), targetId, 1, ['SUPER_ADMIN'], '00000000-0000-4000-8000-000000000099')).rejects.toThrow(/permission/i);
    expect(store.audits).toMatchObject([{ action: 'identity.role.grant', outcome: 'DENIED', resourceId: targetId }]);
  });

  it('rejects an empty group set and preserves optimistic concurrency', async () => {
    const store = new FakeStore();
    const service = new IdentityCommandService(store);
    await expect(service.updateDataScopeGrants(principal(), targetId, 1, [{ scope: 'CUSTOMER:GROUP_SET' }], '00000000-0000-4000-8000-000000000099')).rejects.toThrow(/group/i);
    await expect(service.updateRoleBindings(principal(), targetId, 2, ['SALES'], '00000000-0000-4000-8000-000000000099')).rejects.toBeInstanceOf(IdentityVersionConflictError);
  });

  it('fails closed for a hidden target instead of leaking existence', async () => {
    const store = new FakeStore();
    const service = new IdentityCommandService(store);
    await expect(service.disableUser(principal(), '00000000-0000-4000-8000-000000000099', 1, '00000000-0000-4000-8000-000000000099')).rejects.toBeInstanceOf(IdentityUserNotFoundError);
    expect(store.audits).toMatchObject([{ action: 'identity.user.disable', outcome: 'DENIED' }]);
  });

  it('does not copy USER scope groups into unrelated resources when creating a user', async () => {
    const store = new FakeStore();
    const created = await new IdentityCommandService(store).createUser(
      principal(),
      organizationId,
      { username: 'new@example.test', role: 'SALES' },
      '00000000-0000-4000-8000-000000000099',
    );

    expect(created).toBeDefined();
    expect(store.lastCreate?.defaultGroupIds).toEqual([]);
  });

  it('audits malformed role and scope denials before returning the validation error', async () => {
    const store = new FakeStore();
    const service = new IdentityCommandService(store);

    await expect(service.createUser(principal(), organizationId, { username: 'new@example.test', role: 'UNKNOWN' }, '00000000-0000-4000-8000-000000000099')).rejects.toThrow(/role/i);
    await expect(service.updateDataScopeGrants(principal(), targetId, 1, [{ scope: 'CUSTOMER:ALL_ORG' }], '00000000-0000-4000-8000-000000000099')).rejects.toThrow(/grant|scope/i);
    expect(store.audits.filter((audit) => audit.outcome === 'DENIED')).toHaveLength(2);
  });

  it('records an unknown role denial under the role grant action', async () => {
    const store = new FakeStore();
    const service = new IdentityCommandService(store);

    await expect(service.updateRoleBindings(principal(), targetId, 1, ['UNKNOWN'], '00000000-0000-4000-8000-000000000099')).rejects.toThrow(/role/i);
    expect(store.audits).toMatchObject([{ action: 'identity.role.grant', outcome: 'DENIED', reason: 'unknown-role' }]);
  });
});
