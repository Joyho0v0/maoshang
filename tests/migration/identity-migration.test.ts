import { readFile } from 'node:fs/promises';
import pg from 'pg';

describe('Identity and authorization migration', () => {
  it('defines organization-scoped IAM, scope, session and append-only audit boundaries', async () => {
    const sql = await readFile(new URL('../../packages/database/migrations/002_identity_authorization.sql', import.meta.url), 'utf8');
    const down = await readFile(new URL('../../packages/database/migrations/002_identity_authorization.down.sql', import.meta.url), 'utf8');

    expect(sql).toMatch(/CREATE SCHEMA IF NOT EXISTS iam/i);
    expect(sql).toMatch(/CREATE SCHEMA IF NOT EXISTS org/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS iam\.user_account/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS iam\.session/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS iam\.user_data_scope/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS iam\.data_scope_group/i);
    expect(sql).toMatch(/CHECK \(scope_type IN \('OWN', 'GROUP_SET', 'ALL_ORG'\)\)/i);
    expect(sql).toMatch(/FOREIGN KEY \(organization_id, user_id\)/i);
    expect(sql).toMatch(/CREATE INDEX .*session.*user/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS audit\.audit_event/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS integration\.identity_outbox_event/i);
    expect(sql).toMatch(/identity_outbox_claim_consistency/i);
    expect(sql).toMatch(/CREATE TRIGGER .*audit.*immutable/i);
    expect(sql).toMatch(/SUPER_ADMIN/i);
    expect(sql).toMatch(/GROUP_LEADER/i);
    expect(sql).toMatch(/SALES/i);
    expect(down).not.toMatch(/DROP SCHEMA/i);
    expect(down).not.toMatch(/CASCADE/i);
  });

  it.skipIf(process.env.DATABASE_URL === undefined)('rehearses foundation plus IAM up/up and forward rollback in an isolated PostgreSQL transaction', async () => {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
    const client = await pool.connect();
    const foundation = await readFile(new URL('../../packages/database/migrations/001_foundation.sql', import.meta.url), 'utf8');
    const identity = await readFile(new URL('../../packages/database/migrations/002_identity_authorization.sql', import.meta.url), 'utf8');
    const down = await readFile(new URL('../../packages/database/migrations/002_identity_authorization.down.sql', import.meta.url), 'utf8');
    try {
      await client.query('BEGIN');
      await client.query(foundation);
      await client.query(identity);
      await client.query(identity);
      const tables = await client.query<{ table_schema: string; table_name: string }>(
        "SELECT table_schema, table_name FROM information_schema.tables WHERE (table_schema, table_name) IN (('iam','user_account'), ('iam','session'), ('iam','user_data_scope'), ('org','organization'), ('org','business_group'), ('audit','audit_event'), ('integration','identity_outbox_event')) ORDER BY table_schema, table_name",
      );
      expect(tables.rows).toEqual([
        { table_schema: 'audit', table_name: 'audit_event' },
        { table_schema: 'iam', table_name: 'session' },
        { table_schema: 'iam', table_name: 'user_account' },
        { table_schema: 'iam', table_name: 'user_data_scope' },
        { table_schema: 'integration', table_name: 'identity_outbox_event' },
        { table_schema: 'org', table_name: 'business_group' },
        { table_schema: 'org', table_name: 'organization' },
      ]);
      const roles = await client.query<{ code: string }>('SELECT code FROM iam.role WHERE organization_id IS NULL ORDER BY code');
      expect(roles.rows.map((row) => row.code)).toEqual(['GROUP_LEADER', 'SALES', 'SUPER_ADMIN']);
      await client.query(down);
      const remaining = await client.query<{ table_name: string }>(
        "SELECT table_name FROM information_schema.tables WHERE (table_schema, table_name) IN (('iam','user_account'), ('iam','session'), ('iam','user_data_scope'), ('org','organization'), ('org','business_group'), ('audit','audit_event'), ('integration','identity_outbox_event'))",
      );
      expect(remaining.rows).toHaveLength(0);
      await client.query('ROLLBACK');
    } finally {
      client.release();
      await pool.end();
    }
  });
});
