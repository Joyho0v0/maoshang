import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { IdentityCommandService } from '../../apps/api/src/modules/identity/application/identity-command.service.js';
import type { AuthorizationPrincipal } from '../../apps/api/src/modules/identity/domain/authz.js';
import { PostgresIdentityStore } from '../../apps/api/src/modules/identity/infrastructure/postgres-identity.store.js';
import { PostgresOutboxSource } from '../../apps/worker/src/postgres-outbox-source.js';
import { OutboxWorker } from '../../apps/worker/src/worker.js';

describe('Postgres identity commands', () => {
  it.skipIf(process.env.DATABASE_URL === undefined)('commits IAM mutations with snapshot invalidation, audit and outbox records', async () => {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
    const client = await pool.connect();
    const foundation = await readFile(new URL('../../packages/database/migrations/001_foundation.sql', import.meta.url), 'utf8');
    const foundationDown = await readFile(new URL('../../packages/database/migrations/001_foundation.down.sql', import.meta.url), 'utf8');
    const identity = await readFile(new URL('../../packages/database/migrations/002_identity_authorization.sql', import.meta.url), 'utf8');
    const down = await readFile(new URL('../../packages/database/migrations/002_identity_authorization.down.sql', import.meta.url), 'utf8');
    const organizationId = '00000000-0000-4000-8000-000000000201';
    const groupId = '00000000-0000-4000-8000-000000000202';
    const actorId = '00000000-0000-4000-8000-000000000203';
    let transactionOpen = false;
    try {
      await client.query('BEGIN');
      transactionOpen = true;
      await client.query(foundation);
      await client.query(identity);
      await client.query('INSERT INTO org.organization (id, code, name) VALUES ($1, $2, $3)', [organizationId, 'commands-test', 'Commands test']);
      await client.query('INSERT INTO org.business_group (id, organization_id, code, name) VALUES ($1, $2, $3, $4)', [groupId, organizationId, 'sales', 'Sales']);
      await client.query(
        `INSERT INTO iam.user_account (id, organization_id, provider, provider_subject, username_normalized, display_name)
         VALUES ($1, $2, 'LOCAL_PASSWORD', 'actor-subject', 'actor@example.test', 'Actor')`,
        [actorId, organizationId],
      );
      await client.query("INSERT INTO iam.user_role_binding (id, organization_id, user_id, role_id) VALUES ('00000000-0000-4000-8000-000000000204', $1, $2, '00000000-0000-4000-8000-000000001001')", [organizationId, actorId]);
      for (const resource of ['USER', 'AUDIT', 'CUSTOMER']) {
        await client.query('INSERT INTO iam.user_data_scope (id, organization_id, user_id, resource_type, scope_type) VALUES (gen_random_uuid(), $1, $2, $3, \'ALL_ORG\')', [organizationId, actorId, resource]);
      }
      await client.query('COMMIT');
      transactionOpen = false;

      const store = new PostgresIdentityStore(pool);
      const service = new IdentityCommandService(store);
      const loadedActor = await store.findUserForProvider('LOCAL_PASSWORD', { subject: 'actor-subject', username: 'actor@example.test' });
      if (loadedActor === undefined) throw new Error('Actor fixture was not loaded.');
      const principal: AuthorizationPrincipal = {
        userId: actorId,
        organizationId,
        status: 'ACTIVE',
        permissions: new Set(loadedActor.permissions),
        scopes: new Map(loadedActor.scopes.map((scope) => [scope.resourceType, scope])),
        authzVersion: 1,
        sessionEpoch: 1,
      };
      const requestId = '00000000-0000-4000-8000-000000000299';
      await client.query('BEGIN');
      transactionOpen = true;
      const transactional = await service.createUser(principal, organizationId, { username: 'rolled-back@example.test', role: 'SALES' }, requestId, client);
      await expect(client.query('SELECT 1 FROM iam.user_account WHERE id = $1', [transactional.id])).resolves.toMatchObject({ rowCount: 1 });
      await client.query('ROLLBACK');
      transactionOpen = false;
      await expect(store.findUserForProvider('LOCAL_PASSWORD', { subject: transactional.username, username: transactional.username })).resolves.toBeUndefined();
      const created = await service.createUser(principal, organizationId, { username: 'sales@example.test', role: 'SALES' }, requestId);
      expect(created).toMatchObject({ organizationId, username: 'sales@example.test', roles: ['SALES'], version: 1 });
      expect(created.authzVersion).toBe(1);
      expect(created.sessionEpoch).toBe(1);

      const roleChanged = await service.updateRoleBindings(principal, created.id, 1, ['GROUP_LEADER'], requestId);
      expect(roleChanged.roles).toEqual(['GROUP_LEADER']);
      expect(roleChanged.version).toBe(2);
      expect(roleChanged.authzVersion).toBe(2);
      expect(roleChanged.sessionEpoch).toBe(2);

      const scopeChanged = await service.updateDataScopeGrants(principal, created.id, 2, [{ scope: `CUSTOMER:GROUP_SET:${groupId}` }], requestId);
      expect(scopeChanged.scopes).toEqual([{ resourceType: 'CUSTOMER', scopeType: 'GROUP_SET', groupIds: [groupId] }]);
      expect(scopeChanged.version).toBe(3);

      const disabled = await service.disableUser(principal, created.id, 3, requestId);
      expect(disabled.status).toBe('DISABLED');
      expect(disabled.authzVersion).toBe(4);
      expect(disabled.sessionEpoch).toBe(4);

      const audit = await service.listAuditEvents(principal, { size: 20 }, requestId);
      expect(audit.data.map((event) => event.action)).toEqual(expect.arrayContaining(['identity.user.create', 'identity.role.grant', 'identity.scope.grant', 'identity.user.disable']));
      const outbox = await pool.query<{ count: string }>('SELECT count(*) FROM integration.identity_outbox_event WHERE organization_id = $1', [organizationId]);
      expect(Number(outbox.rows[0]?.count)).toBeGreaterThanOrEqual(4);
      const published: string[] = [];
      const worker = new OutboxWorker(new PostgresOutboxSource(pool, 'integration.identity_outbox_event'), { publish: async (event) => { published.push(event.id); } });
      expect(await worker.runOnce()).toBeGreaterThanOrEqual(4);
      expect(published.length).toBeGreaterThanOrEqual(4);
      await expect(pool.query('SELECT count(*)::int AS count FROM integration.identity_outbox_event WHERE organization_id = $1 AND status <> \'PUBLISHED\'', [organizationId])).resolves.toMatchObject({ rows: [{ count: 0 }] });

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
