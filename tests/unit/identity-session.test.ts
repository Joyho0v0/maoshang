import { describe, expect, it } from 'vitest';
import { CsrfService } from '../../apps/api/src/modules/auth/csrf/csrf.service.js';
import {
  InvalidCredentialsError,
  LoginAttemptLimiter,
  SessionExpiredError,
  SessionService,
  type AuthenticationProvider,
  type IdentityStore,
} from '../../apps/api/src/modules/identity/application/session.service.js';
import type { IdentityUser, StoredSession } from '../../apps/api/src/modules/identity/application/types.js';

const organizationId = '00000000-0000-4000-8000-000000000001';
const userId = '00000000-0000-4000-8000-000000000011';
const sessionId = '00000000-0000-4000-8000-000000000021';

function user(overrides: Partial<IdentityUser> = {}): IdentityUser {
  return {
    id: userId,
    organizationId,
    username: 'admin@example.test',
    displayName: 'Admin',
    status: 'ACTIVE',
    version: 1,
    authzVersion: 3,
    sessionEpoch: 7,
    roles: ['SUPER_ADMIN'],
    permissions: ['customer.read', 'audit.read'],
    scopes: [{ resourceType: 'CUSTOMER', scopeType: 'ALL_ORG', groupIds: [] }],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

class FakeStore implements IdentityStore {
  currentUser: IdentityUser | undefined = user();
  currentSession: StoredSession | undefined;
  revoked: string[] = [];
  authAudits: Array<{ reason: string }> = [];

  async findUserForProvider(): Promise<IdentityUser | undefined> {
    return this.currentUser;
  }

  async createSession(input: Omit<StoredSession, 'createdAt'>): Promise<StoredSession> {
    this.currentSession = { ...input, createdAt: '2026-01-01T00:00:00.000Z' };
    return this.currentSession;
  }

  async findSession(): Promise<{ session: StoredSession; user: IdentityUser } | undefined> {
    if (this.currentSession === undefined || this.currentUser === undefined) return undefined;
    return { session: this.currentSession, user: this.currentUser };
  }

  async revokeSession(tokenHash: string): Promise<void> {
    this.revoked.push(tokenHash);
  }

  async recordAuthenticationAudit(input: { reason: string }): Promise<void> {
    this.authAudits.push(input);
  }
}

const provider: AuthenticationProvider = {
  async authenticate() {
    return { subject: userId, username: 'admin@example.test' };
  },
};

describe('identity session service', () => {
  it('creates a required Session identity with a CSRF token and server epochs', async () => {
    const store = new FakeStore();
    const service = new SessionService(store, provider, new CsrfService(), () => sessionId);

    const created = await service.createSession({ provider: 'LOCAL_PASSWORD', username: 'admin@example.test', password: 'pw' });
    const response = created.document;

    expect(response.organizationId).toBe(organizationId);
    expect(response.authzVersion).toBe(3);
    expect(response.sessionEpoch).toBe(7);
    expect(response.csrfToken).toEqual(expect.any(String));
    expect(response.user).toMatchObject({
      id: userId,
      version: 1,
      href: `/api/v1/users/${userId}`,
      data: expect.objectContaining({ resourceType: 'USER', organizationId, status: 'ACTIVE' }),
    });
    expect(created.sessionToken).toEqual(expect.any(String));
    expect(store.currentSession?.userId).toBe(userId);
  });

  it('invalidates an old session when the authoritative authz version or epoch changes', async () => {
    const store = new FakeStore();
    const service = new SessionService(store, provider, new CsrfService(), () => sessionId);
    await service.createSession({ provider: 'LOCAL_PASSWORD', username: 'admin@example.test', password: 'pw' });
    store.currentUser = user({ authzVersion: 4 });

    await expect(service.getCurrentSession('opaque-session-token')).rejects.toBeInstanceOf(SessionExpiredError);
    expect(store.revoked).toHaveLength(1);
  });

  it('fails closed for disabled accounts', async () => {
    const store = new FakeStore();
    store.currentUser = user({ status: 'DISABLED' });
    const service = new SessionService(store, provider, new CsrfService(), () => sessionId);

    await expect(service.createSession({ provider: 'LOCAL_PASSWORD', username: 'admin@example.test', password: 'pw' })).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('bounds repeated login failures and releases the key after the retry window', () => {
    let now = 1_000;
    const limiter = new LoginAttemptLimiter({ limit: 2, windowMs: 10_000, now: () => now });
    expect(limiter.check('LOCAL_PASSWORD:admin@example.test')).toEqual({ allowed: true, retryAfterSeconds: 0 });
    limiter.recordFailure('LOCAL_PASSWORD:admin@example.test');
    expect(limiter.check('LOCAL_PASSWORD:admin@example.test')).toEqual({ allowed: true, retryAfterSeconds: 0 });
    limiter.recordFailure('LOCAL_PASSWORD:admin@example.test');
    expect(limiter.check('LOCAL_PASSWORD:admin@example.test').allowed).toBe(false);
    now += 10_001;
    expect(limiter.check('LOCAL_PASSWORD:admin@example.test')).toEqual({ allowed: true, retryAfterSeconds: 0 });
  });

  it('uses one non-enumerating login error and audits an unmapped provider identity', async () => {
    const store = new FakeStore();
    store.currentUser = undefined;
    const service = new SessionService(store, provider, new CsrfService(), () => sessionId);

    await expect(service.createSession({ provider: 'LOCAL_PASSWORD', username: 'admin@example.test', password: 'pw' })).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(store.authAudits).toMatchObject([{ reason: 'identity-not-mapped' }]);
  });

  it('preserves the authentication decision when the audit sink is unavailable', async () => {
    const store = new FakeStore();
    store.recordAuthenticationAudit = async () => { throw new Error('audit database unavailable'); };
    const invalidProvider: AuthenticationProvider = { async authenticate() { return undefined; } };
    const service = new SessionService(store, invalidProvider, new CsrfService(), () => sessionId);

    await expect(service.createSession({ provider: 'LOCAL_PASSWORD', username: 'admin@example.test', password: 'pw' })).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
