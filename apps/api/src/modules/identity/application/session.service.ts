import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { CsrfService } from '../../auth/csrf/csrf.service.js';
import type {
  IdentityUser,
  ProviderIdentity,
  SessionCredentials,
  SessionDocument,
  StoredSession,
} from './types.js';

export interface AuthenticationProvider {
  authenticate(credentials: SessionCredentials): Promise<ProviderIdentity | undefined>;
}

export interface IdentityStore {
  findUserForProvider(provider: SessionCredentials['provider'], identity: ProviderIdentity): Promise<IdentityUser | undefined>;
  createSession(input: Omit<StoredSession, 'createdAt'>): Promise<StoredSession>;
  createSessionWithAudit(input: Omit<StoredSession, 'createdAt'>, audit: AuthenticationAuditInput): Promise<StoredSession>;
  findSession(tokenHash: string): Promise<{ session: StoredSession; user: IdentityUser } | undefined>;
  revokeSession(tokenHash: string): Promise<void>;
  recordAuthenticationAudit?(input: AuthenticationAuditInput): Promise<void>;
}

export interface AuthenticationAuditInput {
  provider: SessionCredentials['provider'] | 'REQUEST_SAFETY';
  outcome: 'SUCCEEDED' | 'DENIED';
  requestId: string;
  organizationId?: string;
  actorUserId?: string;
  reason: string;
}

export const SECURITY_AUDIT_FAILURE_REPORTER = 'SECURITY_AUDIT_FAILURE_REPORTER';

export interface SecurityAuditFailure {
  provider: AuthenticationAuditInput['provider'];
  outcome: AuthenticationAuditInput['outcome'];
  requestId: string;
  reason: string;
}

export type SecurityAuditFailureReporter = (failure: SecurityAuditFailure) => void;

export interface SessionCreation {
  document: SessionDocument;
  sessionToken: string;
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Session is expired, revoked, disabled, or no longer matches the current authorization snapshot.');
    this.name = 'SessionExpiredError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Authentication failed.');
    this.name = 'InvalidCredentialsError';
  }
}

export class AuthenticationProviderUnavailableError extends Error {
  constructor() {
    super('The configured authentication provider is unavailable.');
    this.name = 'AuthenticationProviderUnavailableError';
  }
}

export class DisabledAuthenticationProvider implements AuthenticationProvider {
  async authenticate(): Promise<undefined> {
    throw new AuthenticationProviderUnavailableError();
  }
}

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export interface LoginAttemptLimiterOptions {
  limit?: number;
  windowMs?: number;
  maxKeys?: number;
  now?: () => number;
  store?: LoginAttemptStore;
}

export interface LoginAttemptKeys {
  ip: string;
  account: string;
}

export interface LoginAttemptAllowance {
  allowed: boolean;
  retryAfterSeconds: number;
}

export interface LoginAttemptStore {
  consume(keys: LoginAttemptKeys, limit: number, windowMs: number, now: number): Promise<LoginAttemptAllowance>;
  clearAccount(accountKey: string): Promise<void>;
}

interface MemoryBucket {
  attempts: number;
  windowStartedAt: number;
  lastSeenAt: number;
}

class MemoryLoginAttemptStore implements LoginAttemptStore {
  private readonly buckets = new Map<string, MemoryBucket>();

  constructor(private readonly maxKeys: number) {}

  async consume(keys: LoginAttemptKeys, limit: number, windowMs: number, now: number): Promise<LoginAttemptAllowance> {
    this.evictExpired(now, windowMs);
    const bucketKeys = [`ip:${keys.ip}`, `account:${keys.account}`];
    const buckets = bucketKeys.map((key) => this.touch(key, now, windowMs));
    for (const bucket of buckets) bucket.attempts += 1;
    this.evictOverflow();
    const blocked = buckets.filter((bucket) => bucket.attempts > limit);
    if (blocked.length === 0) return { allowed: true, retryAfterSeconds: 0 };
    const retryAfterSeconds = Math.max(...blocked.map((bucket) => Math.max(1, Math.ceil((bucket.windowStartedAt + windowMs - now) / 1000))));
    return { allowed: false, retryAfterSeconds };
  }

  async clearAccount(accountKey: string): Promise<void> {
    this.buckets.delete(`account:${accountKey}`);
  }

  size(): number {
    return this.buckets.size;
  }

  private touch(key: string, now: number, windowMs: number): MemoryBucket {
    const existing = this.buckets.get(key);
    if (existing !== undefined && existing.windowStartedAt + windowMs > now) {
      existing.lastSeenAt = now;
      return existing;
    }
    const bucket = { attempts: 0, windowStartedAt: now, lastSeenAt: now };
    this.buckets.set(key, bucket);
    return bucket;
  }

  private evictExpired(now: number, windowMs: number): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.windowStartedAt + windowMs <= now) this.buckets.delete(key);
    }
  }

  private evictOverflow(): void {
    while (this.buckets.size > this.maxKeys) {
      const oldest = [...this.buckets.entries()].sort((left, right) => left[1].lastSeenAt - right[1].lastSeenAt)[0];
      if (oldest === undefined) return;
      this.buckets.delete(oldest[0]);
    }
  }
}

export class LoginAttemptLimiter {
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly now: () => number;
  private readonly store: LoginAttemptStore;

  constructor(options: LoginAttemptLimiterOptions = {}) {
    this.limit = options.limit ?? 5;
    this.windowMs = options.windowMs ?? 60_000;
    this.now = options.now ?? (() => Date.now());
    this.store = options.store ?? new MemoryLoginAttemptStore(options.maxKeys ?? 10_000);
    if (!Number.isInteger(this.limit) || this.limit < 1) throw new Error('Login attempt limit must be positive.');
    if (!Number.isInteger(this.windowMs) || this.windowMs < 1) throw new Error('Login attempt window must be positive.');
    if (options.maxKeys !== undefined && (!Number.isInteger(options.maxKeys) || options.maxKeys < 2)) throw new Error('Login attempt bucket capacity must be at least two.');
  }

  check(keys: LoginAttemptKeys): Promise<LoginAttemptAllowance> {
    return this.store.consume(keys, this.limit, this.windowMs, this.now());
  }

  recordSuccess(accountKey: string): Promise<void> {
    return this.store.clearAccount(accountKey);
  }

  size(): number {
    const store = this.store as MemoryLoginAttemptStore;
    return typeof store.size === 'function' ? store.size() : 0;
  }
}

export class SessionService {
  constructor(
    private readonly store: IdentityStore,
    private readonly provider: AuthenticationProvider,
    private readonly csrf: CsrfService,
    private readonly tokenFactory: () => string = () => randomBytes(32).toString('base64url'),
    private readonly reportAuditFailure: SecurityAuditFailureReporter = () => undefined,
  ) {}

  async recordSecurityAudit(input: AuthenticationAuditInput): Promise<void> {
    await this.recordAudit(input);
  }

  async createSession(credentials: SessionCredentials, requestId: string = randomUUID()): Promise<SessionCreation> {
    let identity: ProviderIdentity | undefined;
    try {
      identity = await this.provider.authenticate(credentials);
    } catch (error) {
      await this.recordAudit({ provider: credentials.provider, outcome: 'DENIED', requestId, reason: error instanceof AuthenticationProviderUnavailableError ? 'provider-unavailable' : 'provider-failure' });
      throw error;
    }
    if (identity === undefined) {
      await this.recordAudit({ provider: credentials.provider, outcome: 'DENIED', requestId, reason: 'invalid-credentials' });
      throw new InvalidCredentialsError();
    }
    const account = await this.store.findUserForProvider(credentials.provider, identity);
    if (account === undefined || account.status !== 'ACTIVE' || account.organizationStatus !== 'ACTIVE') {
      await this.recordAudit({
        provider: credentials.provider,
        outcome: 'DENIED',
        requestId,
        ...(account === undefined ? {} : { organizationId: account.organizationId, actorUserId: account.id }),
        reason: account === undefined ? 'identity-not-mapped' : account.status !== 'ACTIVE' ? 'account-disabled' : 'organization-disabled',
      });
      throw new InvalidCredentialsError();
    }

    const sessionToken = this.tokenFactory();
    const now = new Date();
    await this.store.createSessionWithAudit({
      id: randomUUID(),
      tokenHash: hashToken(sessionToken),
      userId: account.id,
      organizationId: account.organizationId,
      authzVersion: account.authzVersion,
      sessionEpoch: account.sessionEpoch,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
    }, { provider: credentials.provider, outcome: 'SUCCEEDED', requestId, organizationId: account.organizationId, actorUserId: account.id, reason: 'login-succeeded' });
    return {
      document: this.toDocument(account, this.csrf.bootstrap(`session:${sessionToken}`).csrfToken),
      sessionToken,
    };
  }

  async getCurrentSession(sessionToken: string, requestId: string = randomUUID()): Promise<SessionDocument> {
    if (sessionToken.length === 0) throw new SessionExpiredError();
    const tokenHash = hashToken(sessionToken);
    const found = await this.store.findSession(tokenHash);
    if (found === undefined || Date.parse(found.session.expiresAt) <= Date.now()) {
      await this.recordAudit({ provider: 'LOCAL_PASSWORD', outcome: 'DENIED', requestId, reason: 'session-not-found' });
      throw new SessionExpiredError();
    }
    const { session, user } = found;
    if (
      user.status !== 'ACTIVE'
      || user.organizationStatus !== 'ACTIVE'
      || session.userId !== user.id
      || session.organizationId !== user.organizationId
      || session.authzVersion !== user.authzVersion
      || session.sessionEpoch !== user.sessionEpoch
    ) {
      await this.store.revokeSession(tokenHash);
      await this.recordAudit({ provider: 'LOCAL_PASSWORD', outcome: 'DENIED', requestId, organizationId: user.organizationId, actorUserId: user.id, reason: 'session-snapshot-mismatch' });
      throw new SessionExpiredError();
    }
    return this.toDocument(user, this.csrf.bootstrap(`session:${sessionToken}`).csrfToken);
  }

  private async recordAudit(input: AuthenticationAuditInput): Promise<void> {
    try {
      await this.store.recordAuthenticationAudit?.(input);
    } catch {
      // A failed audit sink must not replace the original authentication or
      // safety decision with a database error. Report only safe metadata to
      // the infrastructure boundary; credentials, tokens and storage details
      // never cross this callback.
      try {
        this.reportAuditFailure({ provider: input.provider, outcome: input.outcome, requestId: input.requestId, reason: input.reason });
      } catch {
        // Observability must remain best effort and must not alter the
        // original security decision.
      }
    }
  }

  async deleteSession(sessionToken: string): Promise<void> {
    if (sessionToken.length === 0) return;
    await this.store.revokeSession(hashToken(sessionToken));
    this.csrf.rotate(`session:${sessionToken}`);
  }

  private toDocument(account: IdentityUser, csrfToken: string): SessionDocument {
    const role = account.roles[0] ?? 'UNKNOWN';
    return {
      user: {
        id: account.id,
        version: account.version,
        href: `/api/v1/users/${account.id}`,
        data: {
          resourceType: 'USER',
          organizationId: account.organizationId,
          username: account.username,
          displayName: account.displayName,
          role,
          status: account.status,
        },
      },
      organizationId: account.organizationId,
      capabilities: [...account.permissions].sort(),
      scopeSummary: {
        organizationId: account.organizationId,
        grants: account.scopes,
      },
      csrfToken,
      authzVersion: account.authzVersion,
      sessionEpoch: account.sessionEpoch,
    };
  }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
