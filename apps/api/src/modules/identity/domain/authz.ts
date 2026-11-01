export type DataScopeType = 'OWN' | 'GROUP_SET' | 'ALL_ORG';

export interface DataScopeGrant {
  resourceType: string;
  scopeType: DataScopeType;
  groupIds: readonly string[];
}

export interface AuthorizationPrincipal {
  userId: string;
  organizationId: string;
  status: 'ACTIVE' | 'DISABLED';
  permissions: ReadonlySet<string>;
  scopes: ReadonlyMap<string, DataScopeGrant>;
  authzVersion: number;
  sessionEpoch: number;
}

export interface AuthorizationResource {
  organizationId: string;
  resourceType: string;
  ownerUserId?: string;
  businessGroupId?: string;
}

export interface ScopePredicateColumns {
  organizationColumn: string;
  ownerColumn: string;
  groupColumn: string;
}

export interface ScopePredicate {
  sql: string;
  params: readonly string[];
}

export class AuthorizationDeniedError extends Error {
  constructor(readonly reason: string) {
    super(`Authorization denied: ${reason}`);
    this.name = 'AuthorizationDeniedError';
  }
}

export function authorize(principal: AuthorizationPrincipal, permission: string, resource: AuthorizationResource): boolean {
  if (principal.status !== 'ACTIVE' || !principal.permissions.has(permission)) return false;
  if (resource.organizationId !== principal.organizationId) return false;
  const grant = principal.scopes.get(resource.resourceType);
  if (grant === undefined || grant.resourceType !== resource.resourceType) return false;
  return resourceMatchesScope(principal, grant, resource);
}

export function buildScopePredicate(
  principal: AuthorizationPrincipal,
  columns: ScopePredicateColumns,
  resourceType = 'CUSTOMER',
): ScopePredicate {
  validateIdentifier(columns.organizationColumn);
  validateIdentifier(columns.ownerColumn);
  validateIdentifier(columns.groupColumn);

  const grant = principal.scopes.get(resourceType);
  if (principal.status !== 'ACTIVE' || grant === undefined || grant.resourceType !== resourceType) return { sql: '1 = 0', params: [] };
  if (grant.scopeType === 'GROUP_SET' && grant.groupIds.length === 0) return { sql: '1 = 0', params: [] };
  if (grant.scopeType === 'ALL_ORG') return { sql: `${columns.organizationColumn} = $1`, params: [principal.organizationId] };
  if (grant.scopeType === 'OWN') return {
    sql: `(${columns.organizationColumn} = $1 AND ${columns.ownerColumn} = $2)`,
    params: [principal.organizationId, principal.userId],
  };
  return {
    sql: `(${columns.organizationColumn} = $1 AND ${columns.groupColumn} = ANY($2::uuid[]))`,
    params: [principal.organizationId, `{${grant.groupIds.join(',')}}`],
  };
}

export function assertCanGrant(principal: AuthorizationPrincipal, permission: string, target: DataScopeGrant): void {
  if (principal.status !== 'ACTIVE') throw new AuthorizationDeniedError('inactive-principal');
  if (!principal.permissions.has(permission)) throw new AuthorizationDeniedError('permission-not-grantable');
  const source = principal.scopes.get(target.resourceType);
  if (source === undefined || !scopeContains(source, target)) throw new AuthorizationDeniedError('scope-not-grantable');
}

export function assertDutiesSeparated(submitterUserId: string, approverUserId: string): void {
  if (submitterUserId.length === 0 || approverUserId.length === 0 || submitterUserId === approverUserId) {
    throw new AuthorizationDeniedError('submitter-approver-separation');
  }
}

function resourceMatchesScope(principal: AuthorizationPrincipal, grant: DataScopeGrant, resource: AuthorizationResource): boolean {
  if (grant.scopeType === 'ALL_ORG') return true;
  if (grant.scopeType === 'OWN') return resource.ownerUserId === principal.userId;
  return grant.groupIds.length > 0 && resource.businessGroupId !== undefined && grant.groupIds.includes(resource.businessGroupId);
}

function scopeContains(source: DataScopeGrant, target: DataScopeGrant): boolean {
  if (source.resourceType !== target.resourceType) return false;
  if (source.scopeType === 'ALL_ORG') return true;
  if (source.scopeType === 'OWN') return target.scopeType === 'OWN' && target.groupIds.length === 0;
  if (target.scopeType !== 'GROUP_SET') return false;
  return target.groupIds.length > 0 && target.groupIds.every((groupId) => source.groupIds.includes(groupId));
}

function validateIdentifier(value: string): void {
  if (!/^[a-z][a-z0-9_.]*$/.test(value)) throw new Error('Scope predicate column must be a trusted SQL identifier.');
}
