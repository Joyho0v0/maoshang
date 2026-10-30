import { describe, expect, it } from 'vitest';
import {
  AuthorizationDeniedError,
  assertCanGrant,
  assertDutiesSeparated,
  authorize,
  buildScopePredicate,
  type AuthorizationPrincipal,
  type AuthorizationResource,
} from '../../apps/api/src/modules/identity/domain/authz.js';

const organizationId = '00000000-0000-4000-8000-000000000001';
const otherOrganizationId = '00000000-0000-4000-8000-000000000002';
const actorId = '00000000-0000-4000-8000-000000000011';
const otherUserId = '00000000-0000-4000-8000-000000000012';
const salesGroupId = '00000000-0000-4000-8000-000000000021';
const leaderGroupId = '00000000-0000-4000-8000-000000000022';

function principal(overrides: Partial<AuthorizationPrincipal> = {}): AuthorizationPrincipal {
  return {
    userId: actorId,
    organizationId,
    status: 'ACTIVE',
    permissions: new Set(['customer.read']),
    scopes: new Map([
      ['CUSTOMER', { resourceType: 'CUSTOMER', scopeType: 'OWN', groupIds: [] }],
    ]),
    authzVersion: 1,
    sessionEpoch: 1,
    ...overrides,
  };
}

function resource(overrides: Partial<AuthorizationResource> = {}): AuthorizationResource {
  return {
    organizationId,
    resourceType: 'CUSTOMER',
    ownerUserId: actorId,
    businessGroupId: salesGroupId,
    ...overrides,
  };
}

describe('central authorization policy', () => {
  it('requires both a typed permission and a matching OWN resource', () => {
    expect(authorize(principal(), 'customer.read', resource())).toBe(true);
    expect(authorize(principal(), 'customer.read', resource({ ownerUserId: otherUserId }))).toBe(false);
    expect(authorize(principal({ permissions: new Set() }), 'customer.read', resource())).toBe(false);
  });

  it('allows only selected GROUP_SET groups and treats an empty set as zero access', () => {
    const groupPrincipal = principal({
      scopes: new Map([
        ['CUSTOMER', { resourceType: 'CUSTOMER', scopeType: 'GROUP_SET', groupIds: [salesGroupId] }],
      ]),
    });

    expect(authorize(groupPrincipal, 'customer.read', resource({ businessGroupId: salesGroupId }))).toBe(true);
    expect(authorize(groupPrincipal, 'customer.read', resource({ businessGroupId: leaderGroupId }))).toBe(false);
    expect(authorize({ ...groupPrincipal, scopes: new Map([
      ['CUSTOMER', { resourceType: 'CUSTOMER', scopeType: 'GROUP_SET', groupIds: [] }],
    ]) }, 'customer.read', resource({ businessGroupId: salesGroupId }))).toBe(false);
  });

  it('requires explicit ALL_ORG for cross-group access and never crosses organizations', () => {
    const allOrgPrincipal = principal({
      scopes: new Map([
        ['CUSTOMER', { resourceType: 'CUSTOMER', scopeType: 'ALL_ORG', groupIds: [] }],
      ]),
    });

    expect(authorize(allOrgPrincipal, 'customer.read', resource({ businessGroupId: leaderGroupId }))).toBe(true);
    expect(authorize(allOrgPrincipal, 'customer.read', resource({ organizationId: otherOrganizationId }))).toBe(false);
  });

  it('builds a fail-closed database predicate for every scope', () => {
    expect(buildScopePredicate(principal(), { organizationColumn: 'c.organization_id', ownerColumn: 'c.owner_user_id', groupColumn: 'c.business_group_id' })).toEqual({
      sql: '(c.organization_id = $1 AND c.owner_user_id = $2)',
      params: [organizationId, actorId],
    });

    expect(buildScopePredicate({ ...principal(), scopes: new Map([
      ['CUSTOMER', { resourceType: 'CUSTOMER', scopeType: 'GROUP_SET', groupIds: [] }],
    ]) }, { organizationColumn: 'c.organization_id', ownerColumn: 'c.owner_user_id', groupColumn: 'c.business_group_id' })).toEqual({
      sql: '1 = 0',
      params: [],
    });
  });

  it('rejects grants that exceed the authorizer permission or scope', () => {
    const groupPrincipal = principal({
      permissions: new Set(['customer.read', 'customer.approve']),
      scopes: new Map([
        ['CUSTOMER', { resourceType: 'CUSTOMER', scopeType: 'GROUP_SET', groupIds: [salesGroupId] }],
      ]),
    });

    expect(() => assertCanGrant(groupPrincipal, 'customer.approve', {
      resourceType: 'CUSTOMER',
      scopeType: 'GROUP_SET',
      groupIds: [salesGroupId],
    })).not.toThrow();
    expect(() => assertCanGrant(groupPrincipal, 'customer.approve', {
      resourceType: 'CUSTOMER',
      scopeType: 'ALL_ORG',
      groupIds: [],
    })).toThrow(AuthorizationDeniedError);
    expect(() => assertCanGrant(groupPrincipal, 'audit.export', {
      resourceType: 'AUDIT',
      scopeType: 'GROUP_SET',
      groupIds: [salesGroupId],
    })).toThrow(AuthorizationDeniedError);
    expect(() => assertCanGrant(groupPrincipal, 'customer.approve', {
      resourceType: 'CUSTOMER',
      scopeType: 'GROUP_SET',
      groupIds: [salesGroupId, leaderGroupId],
    })).toThrow(AuthorizationDeniedError);
  });

  it('enforces submitter and approver duty separation', () => {
    expect(() => assertDutiesSeparated(actorId, actorId)).toThrow(AuthorizationDeniedError);
    expect(() => assertDutiesSeparated(actorId, otherUserId)).not.toThrow();
  });
});
