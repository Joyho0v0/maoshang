import { readFile } from 'node:fs/promises';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required; migration validation must target an isolated PostgreSQL database.');
}

const pool = new pg.Pool({ connectionString: databaseUrl, max: 2 });
const up = await readFile(new URL('./001_foundation.sql', import.meta.url), 'utf8');
const down = await readFile(new URL('./001_foundation.down.sql', import.meta.url), 'utf8');
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('CREATE SCHEMA IF NOT EXISTS core');
  await client.query('CREATE TABLE core.migration_preexisting_sentinel (id integer PRIMARY KEY)');
  await client.query(up);
  await client.query(up);
  await client.query('CREATE TABLE integration.migration_later_sentinel (id integer PRIMARY KEY)');
  const checks = await client.query<{ table_schema: string; table_name: string }>(`SELECT table_schema, table_name FROM information_schema.tables WHERE (table_schema, table_name) IN (('core','organization'), ('integration','idempotency_record'), ('integration','outbox_event'), ('audit','event')) ORDER BY table_schema, table_name`);
  if (checks.rowCount !== 4) throw new Error(`Expected four foundation tables, got ${checks.rowCount ?? 0}.`);
  const indexes = await client.query<{ indexname: string }>(`SELECT indexname FROM pg_indexes WHERE schemaname IN ('core','integration','audit') AND indexname IN ('idempotency_lease_idx', 'idempotency_expiry_idx', 'idempotency_actor_idx', 'outbox_status_idx', 'audit_event_organization_actor_idx')`);
  if (indexes.rowCount !== 5) throw new Error(`Expected five critical indexes, got ${indexes.rowCount ?? 0}.`);
  const foreignKeys = await client.query<{ definition: string }>(`SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE contype = 'f' AND connamespace IN ('core'::regnamespace, 'integration'::regnamespace, 'audit'::regnamespace)`);
  if (!foreignKeys.rows.some((row) => row.definition.includes('FOREIGN KEY (organization_id, actor_user_id)'))) throw new Error('Composite actor organization foreign key is missing.');
  const organizationIndexes = await client.query<{ indexdef: string }>(`SELECT indexdef FROM pg_indexes WHERE schemaname = 'integration' AND indexname IN ('idempotency_actor_idx', 'idempotency_organization_actor_idx')`);
  if (organizationIndexes.rows.length !== 2) throw new Error('Idempotency actor access indexes are incomplete.');
  await client.query(down);
  const sentinels = await client.query<{ table_schema: string; table_name: string }>(`SELECT table_schema, table_name FROM information_schema.tables WHERE (table_schema, table_name) IN (('core','migration_preexisting_sentinel'), ('integration','migration_later_sentinel')) ORDER BY table_schema, table_name`);
  if (sentinels.rowCount !== 2) throw new Error('Migration rollback removed a sentinel object.');
  const owned = await client.query<{ count: string }>(`SELECT count(*)::text AS count FROM information_schema.tables WHERE (table_schema, table_name) IN (('core','organization'), ('core','user_account'), ('integration','idempotency_record'), ('integration','outbox_event'), ('audit','event'))`);
  if (owned.rows[0]?.count !== '0') throw new Error('Migration rollback left owned foundation tables behind.');
  await client.query('ROLLBACK');
  process.stdout.write('Migration validation passed: isolated up/up rehearsal, catalog checks, down rollback.\n');
} finally {
  client.release();
  await pool.end();
}
