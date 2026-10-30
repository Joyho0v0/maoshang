import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { PostgresIdentityStore } from '../../apps/api/src/modules/identity/infrastructure/postgres-identity.store.js';

describe('Postgres identity store', () => {
  it.skipIf(process.env.DATABASE_URL === undefined)('loads organization-scoped permissions/scopes and revokes the session by token hash', async () => {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
    const client = await pool.connect();
    const foundation = await readFile(new URL('../../packages/database/migrations/001_foundation.sql', import.meta.url), 'utf8');
    const identity = await readFile(new URL('../../packages/database/migrations/002_identity_authorization.sql', import.meta.url), 'utf8');
    const down = await readFile(new URL('../../packages/database/migrations/002_identity_authorization.down.sql', import.meta.url), 'utf8');
    const foundationDown = await readFile(new URL('../../packages/database/migrations/001_foundation.down.sql', import.meta.url), 'utf8');
    const organizationId = '00000000-0000-4000-8000-000000000101';
    const groupId = '00000000-0000-4000-8000-000000000102';
    const accountId = '00000000-0000-4000-8000-000000000103';
    const scopeId = '00000000-0000-4000-8000-000000000104';
    let transactionOpen = false;
    try {
      await client.query('BEGIN');
      transactionOpen = true;
      await client.query(foundation);
      await client.query(identity);
      await client.query('INSERT INTO org.organization (id, code, name) VALUES ($1, $2, $3)', [organizationId, 'identity-test', 'Identity test']);
      await client.query('INSERT INTO org.business_group (id, organization_id, code, name) VALUES ($1, $2, $3, $4)', [groupId, organizationId, 'sales', 'Sales']);
      await client.query(
        "INSERT INTO iam.user_account (id, organization_id, provider, provider_subject, username_normalized, display_name) VALUES ($1, $2, 'LOCAL_PASSWORD', 'subject-1', 'admin@example.test', 'Admin')",
        [accountId, organizationId],
      );
      await client.query('INSERT INTO org.membership (id, organization_id, user_id, business_group_id, is_primary) VALUES ($1, $2, $3, $4, true)', [scopeId, organizationId, accountId, groupId]);
      await client.query("INSERT INTO iam.user_role_binding (id, organization_id, user_id, role_id) VALUES ($1, $2, $3, '00000000-0000-4000-8000-000000001003')", [scopeId.replace('104', '105'), organizationId, accountId]);
      await client.query("INSERT INTO iam.user_data_scope (id, organization_id, user_id, resource_type, scope_type) VALUES ($1, $2, $3, 'CUSTOMER', 'GROUP_SET')", [scopeId, organizationId, accountId]);
      await client.query('INSERT INTO iam.data_scope_group (scope_id, organization_id, group_id) VALUES ($1, $2, $3)', [scopeId, organizationId, groupId]);
      await client.query('COMMIT');
      transactionOpen = false;

      const store = new PostgresIdentityStore(pool);
      const loaded = await store.findUserForProvider('LOCAL_PASSWORD', { subject: 'subject-1', username: 'admin@example.test' });
      expect(loaded).toMatchObject({ id: accountId, organizationId, permissions: expect.arrayContaining(['customer.read']), scopes: [{ resourceType: 'CUSTOMER', scopeType: 'GROUP_SET', groupIds: [groupId] }] });

      const session = await store.createSession({ id: scopeId.replace('104', '106'), tokenHash: 'a'.repeat(64), userId: accountId, organizationId, authzVersion: 1, sessionEpoch: 1, expiresAt: '2099-01-01T00:00:00.000Z' });
      expect(session.tokenHash).toBe('a'.repeat(64));
      await expect(store.findSession('a'.repeat(64))).resolves.toMatchObject({ session: { userId: accountId }, user: { organizationId } });
      await store.revokeSession('a'.repeat(64));
      await expect(store.findSession('a'.repeat(64))).resolves.toBeUndefined();
      await client.query('BEGIN');
      transactionOpen = true;
      await client.query(down);
      await client.query(foundationDown);
      await client.query('COMMIT');
      transactionOpen = false;
    } finally {
      if (transactionOpen) await client.query('ROLLBACK').catch(() => undefined);
      client.release();
      await pool.end();
    }
  });
});
