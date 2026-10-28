import { readFile } from 'node:fs/promises';
import pg from 'pg';

describe('PostgreSQL foundation migration', () => {
  it('defines indexed foreign keys and fail-closed integration records', async () => {
    const sql = await readFile(new URL('../../packages/database/migrations/001_foundation.sql', import.meta.url), 'utf8');
    const down = await readFile(new URL('../../packages/database/migrations/001_foundation.down.sql', import.meta.url), 'utf8');

    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS integration\.idempotency_record/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS integration\.outbox_event/i);
    expect(sql).toMatch(/UNIQUE \(organization_id, actor_user_id, operation_id, key_hash\)/i);
    expect(sql).toMatch(/CHECK \(state IN \('IN_PROGRESS', 'SUCCEEDED', 'FAILED'\)\)/i);
    expect(sql).toMatch(/CREATE INDEX .*outbox.*status/i);
    expect(sql).toMatch(/CREATE INDEX .*idempotency.*lease/i);
    expect(sql).toMatch(/UNIQUE \(organization_id, id\)/i);
    expect(sql).toMatch(/FOREIGN KEY \(organization_id, actor_user_id\) REFERENCES core\.user_account \(organization_id, id\)/i);
    expect(sql).toMatch(/CREATE INDEX .*idempotency.*actor/i);
    expect(sql).toMatch(/CLAIMED[\s\S]*claim_owner_token[\s\S]*claimed_at[\s\S]*claim_expires_at/i);
    expect(down).not.toMatch(/DROP SCHEMA/i);
    expect(down).not.toMatch(/CASCADE/i);
  });

  it.skipIf(process.env.DATABASE_URL === undefined)('runs the up/down rehearsal against an isolated PostgreSQL database', async () => {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
    const client = await pool.connect();
    const up = await readFile(new URL('../../packages/database/migrations/001_foundation.sql', import.meta.url), 'utf8');
    const down = await readFile(new URL('../../packages/database/migrations/001_foundation.down.sql', import.meta.url), 'utf8');
    try {
      await client.query('BEGIN');
      await client.query('CREATE SCHEMA IF NOT EXISTS core');
      await client.query('CREATE TABLE core.migration_preexisting_sentinel (id integer PRIMARY KEY)');
      await client.query(up);
      await client.query('CREATE TABLE integration.migration_later_sentinel (id integer PRIMARY KEY)');
      const result = await client.query<{ count: string }>("SELECT count(*)::text AS count FROM information_schema.tables WHERE table_schema = 'integration'");
      expect(Number(result.rows[0]?.count)).toBeGreaterThanOrEqual(2);
      await client.query(down);
      const sentinels = await client.query<{ table_name: string }>("SELECT table_name FROM information_schema.tables WHERE (table_schema, table_name) IN (('core', 'migration_preexisting_sentinel'), ('integration', 'migration_later_sentinel')) ORDER BY table_schema, table_name");
      expect(sentinels.rows.map((row) => row.table_name)).toEqual(['migration_preexisting_sentinel', 'migration_later_sentinel']);
      const owned = await client.query<{ count: string }>("SELECT count(*)::text AS count FROM information_schema.tables WHERE (table_schema, table_name) IN (('core','organization'), ('core','user_account'), ('integration','idempotency_record'), ('integration','outbox_event'), ('audit','event'))");
      expect(Number(owned.rows[0]?.count)).toBe(0);
      await client.query('ROLLBACK');
    } finally {
      client.release();
      await pool.end();
    }
  });

  it.skipIf(process.env.DATABASE_URL === undefined)('rejects cross-organization actor references at the database boundary', async () => {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
    const client = await pool.connect();
    const up = await readFile(new URL('../../packages/database/migrations/001_foundation.sql', import.meta.url), 'utf8');
    const down = await readFile(new URL('../../packages/database/migrations/001_foundation.down.sql', import.meta.url), 'utf8');
    try {
      await client.query('BEGIN');
      await client.query(up);
      await client.query("INSERT INTO core.organization (id, name) VALUES ('00000000-0000-4000-8000-000000000001', 'Org A'), ('00000000-0000-4000-8000-000000000002', 'Org B')");
      await client.query("INSERT INTO core.user_account (id, organization_id) VALUES ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000002')");
      const catalog = await client.query<{ indexname: string; indexdef: string }>("SELECT indexname, indexdef FROM pg_indexes WHERE schemaname IN ('integration', 'audit') AND indexname IN ('idempotency_actor_idx', 'audit_event_organization_actor_idx') ORDER BY indexname");
      expect(catalog.rows.map((row) => row.indexname)).toEqual(['audit_event_organization_actor_idx', 'idempotency_actor_idx']);
      expect(catalog.rows.every((row) => /\((organization_id, actor_user_id|actor_user_id)/i.test(row.indexdef))).toBe(true);
      await client.query('SAVEPOINT cross_org_fk');
      await expect(client.query("INSERT INTO integration.idempotency_record (id, organization_id, actor_user_id, operation_id, key_hash, request_hash, state, owner_token, lease_expires_at, expires_at) VALUES ('00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 'createCustomer', repeat('a', 32)::bytea, repeat('b', 32)::bytea, 'IN_PROGRESS', repeat('c', 16)::bytea, now(), now() + interval '1 day')")).rejects.toThrow();
      await client.query('ROLLBACK TO SAVEPOINT cross_org_fk');
      await client.query(down);
      await client.query('ROLLBACK');
    } finally {
      client.release();
      await pool.end();
    }
  });

  it.skipIf(process.env.DATABASE_URL === undefined)('enforces the outbox claimed lease invariant in PostgreSQL', async () => {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
    const client = await pool.connect();
    const up = await readFile(new URL('../../packages/database/migrations/001_foundation.sql', import.meta.url), 'utf8');
    const down = await readFile(new URL('../../packages/database/migrations/001_foundation.down.sql', import.meta.url), 'utf8');
    const organizationId = '00000000-0000-4000-8000-000000000031';
    try {
      await client.query('BEGIN');
      await client.query(up);
      await client.query('INSERT INTO core.organization (id, name) VALUES ($1, $2)', [organizationId, 'Outbox Check Test Org']);

      await client.query('SAVEPOINT missing_claim_fields');
      await expect(client.query(
        "INSERT INTO integration.outbox_event (id, organization_id, aggregate_type, aggregate_id, event_type, payload, status) VALUES ('00000000-0000-4000-8000-000000000032', $1, 'Customer', '00000000-0000-4000-8000-000000000033', 'CustomerCreated', '{}'::jsonb, 'CLAIMED')",
        [organizationId],
      )).rejects.toThrow();
      await client.query('ROLLBACK TO SAVEPOINT missing_claim_fields');

      await client.query('SAVEPOINT non_claimed_lease_fields');
      await expect(client.query(
        "INSERT INTO integration.outbox_event (id, organization_id, aggregate_type, aggregate_id, event_type, payload, claimed_at) VALUES ('00000000-0000-4000-8000-000000000034', $1, 'Customer', '00000000-0000-4000-8000-000000000035', 'CustomerCreated', '{}'::jsonb, now())",
        [organizationId],
      )).rejects.toThrow();
      await client.query('ROLLBACK TO SAVEPOINT non_claimed_lease_fields');

      await expect(client.query(
        "INSERT INTO integration.outbox_event (id, organization_id, aggregate_type, aggregate_id, event_type, payload, status, claimed_at, claim_owner_token, claim_expires_at) VALUES ('00000000-0000-4000-8000-000000000036', $1, 'Customer', '00000000-0000-4000-8000-000000000037', 'CustomerCreated', '{}'::jsonb, 'CLAIMED', now(), repeat('c', 16)::bytea, now() + interval '30 seconds')",
        [organizationId],
      )).resolves.toMatchObject({ rowCount: 1 });
      await client.query(down);
      await client.query('ROLLBACK');
    } finally {
      client.release();
      await pool.end();
    }
  });

  it.skipIf(process.env.DATABASE_URL === undefined)('rehearses the outbox invariant against legacy rows before accepting the upgrade', async () => {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
    const client = await pool.connect();
    const up = await readFile(new URL('../../packages/database/migrations/001_foundation.sql', import.meta.url), 'utf8');
    const down = await readFile(new URL('../../packages/database/migrations/001_foundation.down.sql', import.meta.url), 'utf8');
    const organizationId = '00000000-0000-4000-8000-000000000041';
    try {
      await client.query('BEGIN');
      await client.query(up);
      await client.query('INSERT INTO core.organization (id, name) VALUES ($1, $2)', [organizationId, 'Outbox Upgrade Test Org']);
      await client.query('ALTER TABLE integration.outbox_event DROP CONSTRAINT outbox_claim_consistency');
      await client.query(
        "INSERT INTO integration.outbox_event (id, organization_id, aggregate_type, aggregate_id, event_type, payload, status) VALUES ('00000000-0000-4000-8000-000000000042', $1, 'Customer', '00000000-0000-4000-8000-000000000043', 'CustomerCreated', '{}'::jsonb, 'PUBLISHED')",
        [organizationId],
      );
      await client.query(
        "INSERT INTO integration.outbox_event (id, organization_id, aggregate_type, aggregate_id, event_type, payload, status, claimed_at) VALUES ('00000000-0000-4000-8000-000000000044', $1, 'Customer', '00000000-0000-4000-8000-000000000045', 'CustomerCreated', '{}'::jsonb, 'PENDING', now())",
        [organizationId],
      );
      await client.query('SAVEPOINT invalid_legacy_rows');
      await expect(client.query(up)).rejects.toThrow();
      await client.query('ROLLBACK TO SAVEPOINT invalid_legacy_rows');
      await client.query("DELETE FROM integration.outbox_event WHERE id = '00000000-0000-4000-8000-000000000044'");
      await client.query(up);
      await expect(client.query("SELECT status, claimed_at, claim_owner_token, claim_expires_at FROM integration.outbox_event WHERE id = '00000000-0000-4000-8000-000000000042'")).resolves.toMatchObject({ rows: [{ status: 'PUBLISHED', claimed_at: null, claim_owner_token: null, claim_expires_at: null }] });
      await client.query('SAVEPOINT upgraded_constraint');
      await expect(client.query(
        "INSERT INTO integration.outbox_event (id, organization_id, aggregate_type, aggregate_id, event_type, payload, status, claimed_at) VALUES ('00000000-0000-4000-8000-000000000046', $1, 'Customer', '00000000-0000-4000-8000-000000000047', 'PENDING', '{}'::jsonb, now())",
        [organizationId],
      )).rejects.toThrow();
      await client.query('ROLLBACK TO SAVEPOINT upgraded_constraint');
      await client.query(down);
      await client.query('ROLLBACK');
    } finally {
      client.release();
      await pool.end();
    }
  });
});
