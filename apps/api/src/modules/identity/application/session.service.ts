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
  findSession(tokenHash: string): Promise<{ session: StoredSession; user: IdentityUser } | undefined>;
  revokeSession(tokenHash: string): Promise<void>;
}

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

export class SessionService {
  constructor(
    private readonly store: IdentityStore,
    private readonly provider: AuthenticationProvider,
    private readonly csrf: CsrfService,
    private readonly tokenFactory: () => string = () => randomBytes(32).toString('base64url'),
  ) {}

  async createSession(credentials: SessionCredentials): Promise<SessionCreation> {
    const identity = await this.provider.authenticate(credentials);
    if (identity === undefined) throw new InvalidCredentialsError();
    const account = await this.store.findUserForProvider(credentials.provider, identity);
    if (account === undefined || account.status !== 'ACTIVE') throw new SessionExpiredError();

    const sessionToken = this.tokenFactory();
    const now = new Date();
    await this.store.createSession({
      id: randomUUID(),
      tokenHash: hashToken(sessionToken),
      userId: account.id,
      organizationId: account.organizationId,
      authzVersion: account.authzVersion,
      sessionEpoch: account.sessionEpoch,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
    });
    return {
      document: this.toDocument(account, this.csrf.bootstrap(`session:${sessionToken}`).csrfToken),
      sessionToken,
    };
  }

  async getCurrentSession(sessionToken: string): Promise<SessionDocument> {
    if (sessionToken.length === 0) throw new SessionExpiredError();
    const tokenHash = hashToken(sessionToken);
    const found = await this.store.findSession(tokenHash);
    if (found === undefined || Date.parse(found.session.expiresAt) <= Date.now()) {
      throw new SessionExpiredError();
    }
    const { session, user } = found;
    if (
      user.status !== 'ACTIVE'
      || session.userId !== user.id
      || session.organizationId !== user.organizationId
      || session.authzVersion !== user.authzVersion
      || session.sessionEpoch !== user.sessionEpoch
    ) {
      await this.store.revokeSession(tokenHash);
      throw new SessionExpiredError();
    }
    return this.toDocument(user, this.csrf.bootstrap(`session:${sessionToken}`).csrfToken);
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
