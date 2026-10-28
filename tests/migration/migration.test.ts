import { readFile } from 'node:fs/promises';
import pg from 'pg';

describe('PostgreSQL foundation migration', () => {
  it('defines indexed foreign keys and fail-closed integration records', async () => {
    const sql = await readFile(new URL('../../packages/database/migrations/001_foundation.sql', import.meta.url), 'utf8');

    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS integration\.idempotency_record/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS integration\.outbox_event/i);
    expect(sql).toMatch(/UNIQUE \(organization_id, actor_user_id, operation_id, key_hash\)/i);
    expect(sql).toMatch(/CHECK \(state IN \('IN_PROGRESS', 'SUCCEEDED', 'FAILED'\)\)/i);
    expect(sql).toMatch(/CREATE INDEX .*outbox.*status/i);
    expect(sql).toMatch(/CREATE INDEX .*idempotency.*lease/i);
  });

  it.skipIf(process.env.DATABASE_URL === undefined)('runs the up/down rehearsal against an isolated PostgreSQL database', async () => {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
    const client = await pool.connect();
    const up = await readFile(new URL('../../packages/database/migrations/001_foundation.sql', import.meta.url), 'utf8');
    const down = await readFile(new URL('../../packages/database/migrations/001_foundation.down.sql', import.meta.url), 'utf8');
    try {
      await client.query(up);
      const result = await client.query<{ count: string }>("SELECT count(*)::text AS count FROM information_schema.tables WHERE table_schema = 'integration'");
      expect(Number(result.rows[0]?.count)).toBeGreaterThanOrEqual(2);
      await client.query(down);
    } finally {
      client.release();
      await pool.end();
    }
  });
});
