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

function user(overrides: Partial<IdentityUser> & { organizationStatus?: 'ACTIVE' | 'DISABLED' } = {}): IdentityUser {
  return Object.assign({
    id: userId,
    organizationId,
    organizationStatus: 'ACTIVE' as const,
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
  }, overrides);
}

class FakeStore implements IdentityStore {
  currentUser: IdentityUser | undefined = user();
  currentSession: StoredSession | undefined;
  revoked: string[] = [];
  authAudits: Array<{ reason: string }> = [];
  atomicAuditFailure = false;
  createSessionWithAuditCalls = 0;

  async findUserForProvider(): Promise<IdentityUser | undefined> {
    return this.currentUser;
  }

  async createSession(input: Omit<StoredSession, 'createdAt'>): Promise<StoredSession> {
    this.currentSession = { ...input, createdAt: '2026-01-01T00:00:00.000Z' };
    return this.currentSession;
  }

  async createSessionWithAudit(input: Omit<StoredSession, 'createdAt'>, audit: { reason: string }): Promise<StoredSession> {
    this.createSessionWithAuditCalls += 1;
    if (this.atomicAuditFailure) throw new Error('audit database unavailable');
    const session = await this.createSession(input);
    await this.recordAuthenticationAudit(audit);
    return session;
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

  it('fails closed when the organization is disabled before login', async () => {
    const store = new FakeStore();
    store.currentUser = user({ organizationStatus: 'DISABLED' });
    const service = new SessionService(store, provider, new CsrfService(), () => sessionId);

    await expect(service.createSession({ provider: 'LOCAL_PASSWORD', username: 'admin@example.test', password: 'pw' })).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(store.currentSession).toBeUndefined();
  });

  it('fails closed for an existing session after the organization is disabled', async () => {
    const store = new FakeStore();
    const service = new SessionService(store, provider, new CsrfService(), () => sessionId);
    await service.createSession({ provider: 'LOCAL_PASSWORD', username: 'admin@example.test', password: 'pw' });
    store.currentUser = user({ organizationStatus: 'DISABLED' });

    await expect(service.getCurrentSession('opaque-session-token')).rejects.toBeInstanceOf(SessionExpiredError);
    expect(store.revoked).toHaveLength(1);
  });

  it('bounds repeated login attempts and releases the buckets after the retry window', async () => {
    let now = 1_000;
    const limiter = new LoginAttemptLimiter({ limit: 2, windowMs: 10_000, now: () => now });
    const keys = { ip: 'ip-a', account: 'LOCAL_PASSWORD:admin@example.test' };
    expect(await limiter.check(keys)).toEqual({ allowed: true, retryAfterSeconds: 0 });
    expect(await limiter.check(keys)).toEqual({ allowed: true, retryAfterSeconds: 0 });
    expect((await limiter.check(keys)).allowed).toBe(false);
    now += 10_001;
    expect(await limiter.check(keys)).toEqual({ allowed: true, retryAfterSeconds: 0 });
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
    const failures: Array<{ provider: string; outcome: string; requestId: string; reason: string }> = [];
    const service = new SessionService(store, invalidProvider, new CsrfService(), () => sessionId, (failure) => { failures.push(failure); });

    await expect(service.createSession({ provider: 'LOCAL_PASSWORD', username: 'admin@example.test', password: 'pw' })).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(failures).toEqual([{ provider: 'LOCAL_PASSWORD', outcome: 'DENIED', requestId: expect.any(String), reason: 'invalid-credentials' }]);
  });

  it('does not issue a session when the successful authentication audit cannot commit', async () => {
    const store = new FakeStore();
    store.atomicAuditFailure = true;
    const service = new SessionService(store, provider, new CsrfService(), () => sessionId);

    await expect(service.createSession({ provider: 'LOCAL_PASSWORD', username: 'admin@example.test', password: 'pw' })).rejects.toThrow(/audit database unavailable/);
    expect(store.createSessionWithAuditCalls).toBe(1);
    expect(store.currentSession).toBeUndefined();
  });

  it('limits an IP and account independently while retaining bounded state', async () => {
    let now = 1_000;
    const limiter = new LoginAttemptLimiter({ limit: 2, windowMs: 10_000, maxKeys: 3, now: () => now });
    const dual = limiter as unknown as {
      check(keys: { ip: string; account: string }): Promise<{ allowed: boolean; retryAfterSeconds: number }>;
      recordFailure(keys: { ip: string; account: string }): Promise<void>;
      recordSuccess(account: string): Promise<void>;
      size(): number;
    };

    expect((await dual.check({ ip: 'ip-a', account: 'account-a' })).allowed).toBe(true);
    await dual.check({ ip: 'ip-a', account: 'account-a' });
    await dual.check({ ip: 'ip-a', account: 'account-b' });
    expect((await dual.check({ ip: 'ip-a', account: 'account-c' })).allowed).toBe(false);
    expect((await dual.check({ ip: 'ip-b', account: 'account-a' })).allowed).toBe(false);
    await dual.recordSuccess('account-a');
    expect((await dual.check({ ip: 'ip-b', account: 'account-a' })).allowed).toBe(true);
    await dual.check({ ip: 'ip-c', account: 'account-c' });
    await dual.check({ ip: 'ip-d', account: 'account-d' });
    expect(dual.size()).toBeLessThanOrEqual(3);
    now += 10_001;
    expect((await dual.check({ ip: 'ip-a', account: 'account-a' })).allowed).toBe(true);
  });
});
