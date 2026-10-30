import type { DataScopeGrant } from '../domain/authz.js';

export type SessionProvider = 'LOCAL_PASSWORD' | 'OIDC_SSO';

export interface SessionCredentials {
  provider: SessionProvider;
  username?: string;
  password?: string;
  authorizationCode?: string;
}

export interface ProviderIdentity {
  subject: string;
  username?: string;
}

export interface IdentityUser {
  id: string;
  organizationId: string;
  username: string;
  displayName: string;
  status: 'ACTIVE' | 'DISABLED';
  version: number;
  authzVersion: number;
  sessionEpoch: number;
  roles: readonly string[];
  permissions: readonly string[];
  scopes: readonly DataScopeGrant[];
  primaryBusinessGroupId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredSession {
  id: string;
  tokenHash: string;
  userId: string;
  organizationId: string;
  authzVersion: number;
  sessionEpoch: number;
  expiresAt: string;
  createdAt: string;
}

export interface SessionDocument {
  user: {
    id: string;
    version: number;
    href: string;
    data: {
      resourceType: 'USER';
      organizationId: string;
      username: string;
      displayName: string;
      role: string;
      status: 'ACTIVE' | 'DISABLED';
    };
  };
  organizationId: string;
  capabilities: readonly string[];
  scopeSummary: {
    organizationId: string;
    grants: readonly DataScopeGrant[];
  };
  csrfToken: string;
  authzVersion: number;
  sessionEpoch: number;
}
