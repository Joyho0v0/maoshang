import { describe, expect, it } from 'vitest';
import {
  IdentityCommandService,
  type AuditEventPage,
  type IdentityAuditQueryStore,
  type IdentityMutationStore,
} from '../../apps/api/src/modules/identity/application/identity-command.service.js';
import type { IdentityUser } from '../../apps/api/src/modules/identity/application/types.js';
import type { AuthorizationPrincipal } from '../../apps/api/src/modules/identity/domain/authz.js';

const organizationId = '00000000-0000-4000-8000-000000000001';
const actorId = '00000000-0000-4000-8000-000000000011';

function principal(overrides: Partial<AuthorizationPrincipal> = {}): AuthorizationPrincipal {
  return {
    userId: actorId,
    organizationId,
    status: 'ACTIVE',
    permissions: new Set(['audit.read']),
    scopes: new Map([['AUDIT', { resourceType: 'AUDIT', scopeType: 'OWN', groupIds: [] }]]),
    authzVersion: 1,
    sessionEpoch: 1,
    ...overrides,
  };
}

class FakeStore implements IdentityMutationStore, IdentityAuditQueryStore {
  readonly audits: Array<{ action: string; outcome: string }> = [];

  async findUserById(): Promise<IdentityUser | undefined> { return undefined; }
  async findRolePermissions(): Promise<readonly string[]> { return []; }
  async createUser(): Promise<never> { throw new Error('not used'); }
  async replaceRoleBindings(): Promise<never> { throw new Error('not used'); }
  async replaceDataScopeGrants(): Promise<never> { throw new Error('not used'); }
  async disableUser(): Promise<never> { throw new Error('not used'); }
  async recordAudit(input: { action: string; outcome: 'SUCCEEDED' | 'DENIED' | 'FAILED' }): Promise<void> { this.audits.push(input); }
  async listAuditEvents(): Promise<AuditEventPage> { return { data: [], page: { nextCursor: null, hasNext: false } }; }
}

describe('audit query authorization', () => {
  it('fails closed and audits a principal without an audit scope', async () => {
    const store = new FakeStore();
    const service = new IdentityCommandService(store);
    await expect(service.listAuditEvents(principal({ scopes: new Map() }), {}, '00000000-0000-4000-8000-000000000099')).rejects.toThrow(/audit/i);
    expect(store.audits).toMatchObject([{ action: 'audit.read', outcome: 'DENIED' }]);
  });

  it('passes only organization-filtered query intent to the store', async () => {
    const store = new FakeStore();
    const service = new IdentityCommandService(store);
    await expect(service.listAuditEvents(principal({ scopes: new Map([['AUDIT', { resourceType: 'AUDIT', scopeType: 'ALL_ORG', groupIds: [] }]]) }), { action: ['identity.user.disable'] }, '00000000-0000-4000-8000-000000000099')).resolves.toEqual({ data: [], page: { nextCursor: null, hasNext: false } });
  });
});
