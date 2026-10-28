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
  await client.query(up);
  await client.query(up);
  const checks = await client.query<{ table_schema: string; table_name: string }>(`SELECT table_schema, table_name FROM information_schema.tables WHERE (table_schema, table_name) IN (('core','organization'), ('integration','idempotency_record'), ('integration','outbox_event'), ('audit','event')) ORDER BY table_schema, table_name`);
  if (checks.rowCount !== 4) throw new Error(`Expected four foundation tables, got ${checks.rowCount ?? 0}.`);
  const indexes = await client.query<{ indexname: string }>(`SELECT indexname FROM pg_indexes WHERE schemaname IN ('core','integration','audit') AND indexname IN ('idempotency_lease_idx', 'idempotency_expiry_idx', 'outbox_status_idx')`);
  if (indexes.rowCount !== 3) throw new Error(`Expected three critical indexes, got ${indexes.rowCount ?? 0}.`);
  await client.query(down);
  await client.query('ROLLBACK');
  process.stdout.write('Migration validation passed: isolated up/up rehearsal, catalog checks, down rollback.\n');
} finally {
  client.release();
  await pool.end();
}
