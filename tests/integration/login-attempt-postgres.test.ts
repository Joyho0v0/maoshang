import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { PostgresLoginAttemptStore } from '../../apps/api/src/modules/identity/infrastructure/postgres-login-attempt.store.js';

describe('PostgreSQL login attempt limiter', () => {
  it.skipIf(process.env.DATABASE_URL === undefined)('shares independent IP/account buckets and bounds persistent state', async () => {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
    const client = await pool.connect();
    const foundation = await readFile(new URL('../../packages/database/migrations/001_foundation.sql', import.meta.url), 'utf8');
    const identity = await readFile(new URL('../../packages/database/migrations/002_identity_authorization.sql', import.meta.url), 'utf8');
    const down = await readFile(new URL('../../packages/database/migrations/002_identity_authorization.down.sql', import.meta.url), 'utf8');
    const foundationDown = await readFile(new URL('../../packages/database/migrations/001_foundation.down.sql', import.meta.url), 'utf8');
    try {
      await client.query('BEGIN');
      await client.query(foundation);
      await client.query(identity);
      await client.query('COMMIT');

      const store = new PostgresLoginAttemptStore(pool, { maxKeys: 4 });
      const keys = { ip: 'LOCAL_PASSWORD:ip-a', account: 'LOCAL_PASSWORD:account-a' };
      expect((await store.consume(keys, 2, 10_000, 1_000)).allowed).toBe(true);
      expect((await store.consume(keys, 2, 10_000, 1_000)).allowed).toBe(true);
      expect((await store.consume(keys, 2, 10_000, 1_000)).allowed).toBe(false);
      expect((await store.consume({ ip: 'LOCAL_PASSWORD:ip-b', account: keys.account }, 2, 10_000, 1_000)).allowed).toBe(false);
      await store.clearAccount(keys.account);
      expect((await store.consume({ ip: 'LOCAL_PASSWORD:ip-b', account: keys.account }, 2, 10_000, 1_000)).allowed).toBe(true);

      await Promise.all([
        store.consume({ ip: 'LOCAL_PASSWORD:ip-c', account: 'LOCAL_PASSWORD:account-c' }, 2, 10_000, 1_000),
        store.consume({ ip: 'LOCAL_PASSWORD:ip-d', account: 'LOCAL_PASSWORD:account-d' }, 2, 10_000, 1_000),
        store.consume({ ip: 'LOCAL_PASSWORD:ip-e', account: 'LOCAL_PASSWORD:account-e' }, 2, 10_000, 1_000),
      ]);
      await expect(pool.query('SELECT count(*)::int AS count FROM integration.login_attempt_bucket')).resolves.toMatchObject({ rows: [{ count: 4 }] });
    } finally {
      await client.query('BEGIN').catch(() => undefined);
      await client.query("SET LOCAL app.allow_identity_down = 'true'").catch(() => undefined);
      await client.query(down).catch(() => undefined);
      await client.query(foundationDown).catch(() => undefined);
      await client.query('ROLLBACK').catch(() => undefined);
      client.release();
      await pool.end();
    }
  });
});
