import { readFile } from 'node:fs/promises';
import pg from 'pg';

describe('Files migration', () => {
  it('defines private object metadata, upload intents, links, scans, and inbox dedupe', async () => {
    const sql = await readFile(new URL('../../packages/database/migrations/003_files.sql', import.meta.url), 'utf8');
    const down = await readFile(new URL('../../packages/database/migrations/003_files.down.sql', import.meta.url), 'utf8');
    expect(sql).toMatch(/CREATE SCHEMA IF NOT EXISTS files/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS files\.file_object/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS files\.upload_intent/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS files\.file_link/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS files\.scan_result/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS integration\.inbox_consumption/i);
    expect(sql).toMatch(/FOREIGN KEY \(organization_id, created_by\)/i);
    expect(sql).toMatch(/FOREIGN KEY \(organization_id, file_id, object_key\) REFERENCES files\.file_object \(organization_id, id, object_key\)/i);
    expect(sql).toMatch(/UNIQUE \(organization_id, object_key\)/i);
    expect(sql).toMatch(/CHECK \(status IN \('PENDING_UPLOAD', 'UPLOADED', 'SCANNING', 'AVAILABLE', 'REJECTED', 'QUARANTINED'\)\)/i);
    expect(sql).toMatch(/CREATE INDEX .*file_link.*resource/i);
    expect(sql).toMatch(/file_link_linked_by_idx/i);
    expect(sql).toMatch(/file_link_resource_owner_idx/i);
    expect(sql).toMatch(/file_link_resource_group_idx/i);
    expect(sql).toMatch(/file_object_business_group_fk_idx/i);
    expect(sql).toMatch(/upload_intent_file_object_idx/i);
    expect(down).not.toMatch(/DROP SCHEMA/i);
    expect(down).not.toMatch(/CASCADE/i);
  });

  it.skipIf(process.env.DATABASE_URL === undefined)('proves every Files foreign key has a usable left-prefix child index', async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl === undefined) return;
    const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
    try {
      const result = await pool.query<{ constraint_name: string }>(`
        WITH files_fks AS (
          SELECT con.oid, con.conrelid, con.conkey, con.conname
            FROM pg_constraint AS con
            JOIN pg_class AS rel ON rel.oid = con.conrelid
            JOIN pg_namespace AS ns ON ns.oid = rel.relnamespace
           WHERE con.contype = 'f' AND ns.nspname = 'files'
        )
        SELECT conname AS constraint_name
          FROM files_fks AS fk
         WHERE NOT EXISTS (
           SELECT 1
             FROM pg_index AS idx
            WHERE idx.indrelid = fk.conrelid
              AND idx.indisvalid
              AND idx.indnkeyatts >= cardinality(fk.conkey)
              AND NOT EXISTS (
                SELECT 1
                FROM generate_subscripts(fk.conkey, 1) AS position(index_position)
                 WHERE idx.indkey[position.index_position] <> fk.conkey[position.index_position]
              )
         )
         ORDER BY conname`);
      expect(result.rows).toEqual([]);
    } finally {
      await pool.end();
    }
  });

  it.skipIf(process.env.DATABASE_URL === undefined)('rehearses files up/up and rollback without removing a later sentinel', async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl === undefined) return;
    const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
    const client = await pool.connect();
    const foundation = await readFile(new URL('../../packages/database/migrations/001_foundation.sql', import.meta.url), 'utf8');
    const identity = await readFile(new URL('../../packages/database/migrations/002_identity_authorization.sql', import.meta.url), 'utf8');
    const up = await readFile(new URL('../../packages/database/migrations/003_files.sql', import.meta.url), 'utf8');
    const down = await readFile(new URL('../../packages/database/migrations/003_files.down.sql', import.meta.url), 'utf8');
    try {
      await client.query('BEGIN');
      await client.query(foundation);
      await client.query(identity);
      await client.query(up);
      await client.query(up);
      await client.query('CREATE TABLE integration.files_migration_later_sentinel (id integer PRIMARY KEY)');
      const tables = await client.query<{ table_schema: string; table_name: string }>("SELECT table_schema, table_name FROM information_schema.tables WHERE (table_schema, table_name) IN (('files','file_object'), ('files','upload_intent'), ('files','file_link'), ('files','scan_result'), ('integration','inbox_consumption')) ORDER BY table_schema, table_name");
      expect(tables.rows).toHaveLength(5);
      await client.query(down);
      await expect(client.query("SELECT 1 FROM information_schema.tables WHERE table_schema = 'integration' AND table_name = 'files_migration_later_sentinel'")).resolves.toMatchObject({ rows: [{ '?column?': 1 }] });
      await client.query('ROLLBACK');
    } finally {
      client.release();
      await pool.end();
    }
  });
});
