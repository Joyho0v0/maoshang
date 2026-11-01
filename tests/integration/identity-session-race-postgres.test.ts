import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { CsrfService } from '../../apps/api/src/modules/auth/csrf/csrf.service.js';
import { LoginAttemptLimiter, SessionService, type AuthenticationProvider, type IdentityStore } from '../../apps/api/src/modules/identity/application/session.service.js';
import { PostgresIdentityStore } from '../../apps/api/src/modules/identity/infrastructure/postgres-identity.store.js';
import { SessionController } from '../../apps/api/src/modules/auth/session.controller.js';

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(databaseUrl === undefined)('PostgreSQL identity session issuance race', () => {
  it('rejects a mapped login when organization disable commits before session INSERT', async () => {
    if (databaseUrl === undefined) return;
    const pool = new pg.Pool({ connectionString: databaseUrl, max: 6 });
    const setup = await pool.connect();
    const disableConnection = await pool.connect();
    const foundation = await readFile(new URL('../../packages/database/migrations/001_foundation.sql', import.meta.url), 'utf8');
    const identity = await readFile(new URL('../../packages/database/migrations/002_identity_authorization.sql', import.meta.url), 'utf8');
    const down = await readFile(new URL('../../packages/database/migrations/002_identity_authorization.down.sql', import.meta.url), 'utf8');
    const foundationDown = await readFile(new URL('../../packages/database/migrations/001_foundation.down.sql', import.meta.url), 'utf8');
    const organizationId = '00000000-0000-4000-8000-000000000701';
    const userId = '00000000-0000-4000-8000-000000000702';
    let transactionOpen = false;
    let releaseMapping!: () => void;
    const mappingReleased = new Promise<void>((resolve) => { releaseMapping = resolve; });
    let mappingReached!: () => void;
    const mappingObserved = new Promise<void>((resolve) => { mappingReached = resolve; });
    const provider: AuthenticationProvider = { authenticate: async () => ({ subject: 'race-subject', username: 'race@example.test' }) };

    try {
      await setup.query('BEGIN');
      transactionOpen = true;
      await setup.query(foundation);
      await setup.query(identity);
      await setup.query('INSERT INTO org.organization (id, code, name) VALUES ($1, $2, $3)', [organizationId, 'race-test', 'Race test']);
      await setup.query(
        `INSERT INTO iam.user_account (id, organization_id, provider, provider_subject, username_normalized, display_name)
         VALUES ($1, $2, 'LOCAL_PASSWORD', 'race-subject', 'race@example.test', 'Race')`,
        [userId, organizationId],
      );
      await setup.query('COMMIT');
      transactionOpen = false;

      const store = new PostgresIdentityStore(pool);
      const gatedStore: IdentityStore = {
        findUserForProvider: async (providerName, identityValue) => {
          const user = await store.findUserForProvider(providerName, identityValue);
          mappingReached();
          await mappingReleased;
          return user;
        },
        createSession: (input) => store.createSession(input),
        createSessionWithAudit: (input, audit) => store.createSessionWithAudit(input, audit),
        findSession: (tokenHash) => store.findSession(tokenHash),
        revokeSession: (tokenHash) => store.revokeSession(tokenHash),
        recordAuthenticationAudit: (input) => store.recordAuthenticationAudit(input),
      };
      const service = new SessionService(gatedStore, provider, new CsrfService(), () => 'race-session-token');
      const controller = new SessionController(service, { nodeEnv: 'test' } as never, new LoginAttemptLimiter({ limit: 5, windowMs: 10_000 }));
      const reply = { header: () => reply, setCookie: () => reply };
      const loginPromise = controller.createSession(
        { ip: '127.0.0.1', headers: { 'x-request-id': '00000000-0000-4000-8000-000000000703' } } as never,
        reply as never,
        { provider: 'LOCAL_PASSWORD', username: 'race@example.test', password: 'pw' },
      );
      await mappingObserved;

      await disableConnection.query('BEGIN');
      await disableConnection.query("UPDATE org.organization SET status = 'DISABLED' WHERE id = $1", [organizationId]);
      await disableConnection.query('COMMIT');
      releaseMapping();

      await expect(loginPromise).rejects.toMatchObject({ problem: { status: 401, code: 'INVALID_CREDENTIALS' } });
      await expect(pool.query('SELECT count(*)::int AS count FROM iam.session WHERE organization_id = $1', [organizationId])).resolves.toMatchObject({ rows: [{ count: 0 }] });
      await expect(pool.query("SELECT count(*)::int AS count FROM audit.authentication_event WHERE organization_id = $1 AND outcome = 'SUCCEEDED'", [organizationId])).resolves.toMatchObject({ rows: [{ count: 0 }] });
      await expect(pool.query("SELECT count(*)::int AS count FROM integration.identity_outbox_event WHERE organization_id = $1 AND event_type = 'auth.succeeded'", [organizationId])).resolves.toMatchObject({ rows: [{ count: 0 }] });

      await pool.query("UPDATE org.organization SET status = 'ACTIVE' WHERE id = $1", [organizationId]);
      await expect(pool.query('SELECT count(*)::int AS count FROM iam.session WHERE organization_id = $1', [organizationId])).resolves.toMatchObject({ rows: [{ count: 0 }] });
    } finally {
      releaseMapping();
      if (transactionOpen) await setup.query('ROLLBACK').catch(() => undefined);
      await disableConnection.query('ROLLBACK').catch(() => undefined);
      await setup.query('BEGIN').catch(() => undefined);
      await setup.query("SET LOCAL app.allow_identity_down = 'true'").catch(() => undefined);
      await setup.query(down).catch(() => undefined);
      await setup.query(foundationDown).catch(() => undefined);
      await setup.query('COMMIT').catch(() => undefined);
      setup.release();
      disableConnection.release();
      await pool.end();
    }
  });
});
