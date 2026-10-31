import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { describe, expect, it } from 'vitest';

describe('CRM/Catalog/Orders migration', () => {
  it('adds only the next expand-only migration with ownership, decimal, snapshot and history constraints', async () => {
    const sql = await readFile(new URL('../../packages/database/migrations/004_crm_catalog_orders.sql', import.meta.url), 'utf8');
    const down = await readFile(new URL('../../packages/database/migrations/004_crm_catalog_orders.down.sql', import.meta.url), 'utf8');

    expect(sql).toMatch(/CREATE SCHEMA IF NOT EXISTS crm/i);
    expect(sql).toMatch(/CREATE SCHEMA IF NOT EXISTS catalog/i);
    expect(sql).toMatch(/CREATE SCHEMA IF NOT EXISTS orders/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS crm\.customer/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS crm\.customer_approval_attempt/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS catalog\.product/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS catalog\.sku/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS catalog\.price_snapshot/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS catalog\.exchange_rate_snapshot/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS orders\.order_header/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS orders\.order_item/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS orders\.stage_history/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS orders\.ownership_history/i);
    expect(sql).toMatch(/numeric\(19,4\)/i);
    expect(sql).toMatch(/numeric\(24,12\)/i);
    expect(sql).toMatch(/numeric\(18,6\)/i);
    expect(sql).toMatch(/FOREIGN KEY \(organization_id, owner_user_id\)/i);
    expect(sql).toMatch(/FOREIGN KEY \(organization_id, customer_id\)/i);
    expect(sql).toMatch(/CREATE INDEX .*customer.*owner/i);
    expect(sql).toMatch(/CREATE INDEX .*order.*customer/i);
    expect(sql).toMatch(/append-only/i);
    expect(down).not.toMatch(/DROP SCHEMA/i);
    expect(down).not.toMatch(/CASCADE/i);
  });

  it.skipIf(process.env.DATABASE_URL === undefined)('proves every CRM/Catalog/Orders foreign key has a usable non-partial left-prefix child index', async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl === undefined) return;
    const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
    const client = await pool.connect();
    const migrations = await Promise.all([
      readFile(new URL('../../packages/database/migrations/001_foundation.sql', import.meta.url), 'utf8'),
      readFile(new URL('../../packages/database/migrations/002_identity_authorization.sql', import.meta.url), 'utf8'),
      readFile(new URL('../../packages/database/migrations/003_files.sql', import.meta.url), 'utf8'),
      readFile(new URL('../../packages/database/migrations/004_crm_catalog_orders.sql', import.meta.url), 'utf8'),
    ]);
    let transactionOpen = false;
    try {
      await client.query('BEGIN');
      transactionOpen = true;
      for (const migration of migrations) await client.query(migration);
      const result = await client.query<{ constraint_name: string }>(`
        WITH scoped_fks AS (
          SELECT con.conrelid, con.conkey, con.conname
            FROM pg_constraint AS con
            JOIN pg_class AS rel ON rel.oid = con.conrelid
            JOIN pg_namespace AS ns ON ns.oid = rel.relnamespace
           WHERE con.contype = 'f' AND ns.nspname IN ('crm', 'catalog', 'orders')
        )
        SELECT conname AS constraint_name
          FROM scoped_fks AS fk
         WHERE NOT EXISTS (
           SELECT 1
             FROM pg_index AS idx
            WHERE idx.indrelid = fk.conrelid
              AND idx.indisvalid
              AND idx.indisready
              AND idx.indpred IS NULL
              AND idx.indnkeyatts >= cardinality(fk.conkey)
              AND NOT EXISTS (
                SELECT 1
                  FROM generate_subscripts(fk.conkey, 1) AS position(index_position)
                 WHERE idx.indkey[position.index_position - 1] <> fk.conkey[position.index_position]
              )
         )
         ORDER BY conname`);
      expect(result.rows).toEqual([]);
      await client.query('ROLLBACK');
      transactionOpen = false;
    } finally {
      if (transactionOpen) await client.query('ROLLBACK').catch(() => undefined);
      client.release();
      await pool.end();
    }
  });
});
