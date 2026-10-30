import { readFile } from 'node:fs/promises';
import { setTimeout as wait } from 'node:timers/promises';
import pg from 'pg';
import { CsrfService } from '../../apps/api/src/modules/auth/csrf/csrf.service.js';
import { InvalidCredentialsError, SessionExpiredError, SessionService, type AuthenticationProvider } from '../../apps/api/src/modules/identity/application/session.service.js';
import { PostgresIdentityStore } from '../../apps/api/src/modules/identity/infrastructure/postgres-identity.store.js';

describe('PostgreSQL identity security boundaries', () => {
  it.skipIf(process.env.DATABASE_URL === undefined)('rejects disabled organizations before login and after an in-flight disable', async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl === undefined) return;
    const pool = new pg.Pool({ connectionString: databaseUrl, max: 6 });
    const setup = await pool.connect();
    const disableConnection = await pool.connect();
    const foundation = await readFile(new URL('../../packages/database/migrations/001_foundation.sql', import.meta.url), 'utf8');
    const identity = await readFile(new URL('../../packages/database/migrations/002_identity_authorization.sql', import.meta.url), 'utf8');
    const down = await readFile(new URL('../../packages/database/migrations/002_identity_authorization.down.sql', import.meta.url), 'utf8');
    const foundationDown = await readFile(new URL('../../packages/database/migrations/001_foundation.down.sql', import.meta.url), 'utf8');
    const organizationId = '00000000-0000-4000-8000-000000000601';
    const userId = '00000000-0000-4000-8000-000000000602';
    const requestId = '00000000-0000-4000-8000-000000000603';
    const provider: AuthenticationProvider = { authenticate: async () => ({ subject: 'security-subject', username: 'security@example.test' }) };
    let transactionOpen = false;
    try {
      await setup.query('BEGIN');
      transactionOpen = true;
      await setup.query(foundation);
      await setup.query(identity);
      await setup.query('INSERT INTO org.organization (id, code, name, status) VALUES ($1, $2, $3, \'DISABLED\')', [organizationId, 'security-test', 'Security test']);
      await setup.query(
        `INSERT INTO iam.user_account (id, organization_id, provider, provider_subject, username_normalized, display_name)
         VALUES ($1, $2, 'LOCAL_PASSWORD', 'security-subject', 'security@example.test', 'Security')`,
        [userId, organizationId],
      );
      await setup.query('COMMIT');
      transactionOpen = false;

      const store = new PostgresIdentityStore(pool);
      const service = new SessionService(store, provider, new CsrfService(), () => 'security-session-token');
      await expect(service.createSession({ provider: 'LOCAL_PASSWORD', username: 'security@example.test', password: 'pw' }, requestId)).rejects.toBeInstanceOf(InvalidCredentialsError);
      await expect(pool.query('SELECT count(*)::int AS count FROM iam.session WHERE user_id = $1', [userId])).resolves.toMatchObject({ rows: [{ count: 0 }] });

      await setup.query("UPDATE org.organization SET status = 'ACTIVE' WHERE id = $1", [organizationId]);
      const created = await service.createSession({ provider: 'LOCAL_PASSWORD', username: 'security@example.test', password: 'pw' }, requestId);
      await expect(pool.query('SELECT count(*)::int AS count FROM audit.authentication_event WHERE actor_user_id = $1 AND outcome = \'SUCCEEDED\'', [userId])).resolves.toMatchObject({ rows: [{ count: 1 }] });
      await expect(pool.query("SELECT count(*)::int AS count FROM integration.identity_outbox_event WHERE event_type = 'auth.succeeded' AND aggregate_id = $1", [userId])).resolves.toMatchObject({ rows: [{ count: 1 }] });

      await disableConnection.query('BEGIN');
      await disableConnection.query("UPDATE org.organization SET status = 'DISABLED' WHERE id = $1", [organizationId]);
      const currentPromise = service.getCurrentSession(created.sessionToken, requestId);
      let sessionReadBlocked = false;
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const activity = await pool.query<{ count: number }>(
          "SELECT count(*)::int AS count FROM pg_stat_activity WHERE wait_event_type = 'Lock' AND query LIKE '%FROM iam.session AS s%'",
        );
        if ((activity.rows[0]?.count ?? 0) > 0) {
          sessionReadBlocked = true;
          break;
        }
        await wait(5);
      }
      expect(sessionReadBlocked).toBe(true);
      await disableConnection.query('COMMIT');
      await expect(currentPromise).rejects.toBeInstanceOf(SessionExpiredError);
      await expect(pool.query('SELECT revoked_at FROM iam.session WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId])).resolves.toMatchObject({ rows: [{ revoked_at: expect.anything() }] });
    } finally {
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
