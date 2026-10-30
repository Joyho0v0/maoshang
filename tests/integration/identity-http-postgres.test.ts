import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { createApp } from '../../apps/api/src/main.js';
import { ControlledAuthenticationProvider, hashControlledPassword } from '../../apps/api/src/modules/identity/application/controlled-authentication.provider.js';
import { PostgresIdentityStore } from '../../apps/api/src/modules/identity/infrastructure/postgres-identity.store.js';
import { PostgresIdempotencyRepository } from '../../apps/api/src/modules/integration/idempotency/postgres-idempotency-repository.js';
import { PostgresOutboxSource } from '../../apps/worker/src/postgres-outbox-source.js';
import { IdentityCommandProcessor } from '../../apps/worker/src/identity-command-processor.js';
import { OutboxWorker } from '../../apps/worker/src/worker.js';

describe('Identity HTTP to PostgreSQL longitudinal boundary', () => {
  it.skipIf(process.env.DATABASE_URL === undefined)('authenticates, creates a user, and reads the same idempotency command as one principal', async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl === undefined) return;
    const pool = new pg.Pool({ connectionString: databaseUrl, max: 5 });
    const client = await pool.connect();
    const foundation = await readFile(new URL('../../packages/database/migrations/001_foundation.sql', import.meta.url), 'utf8');
    const identity = await readFile(new URL('../../packages/database/migrations/002_identity_authorization.sql', import.meta.url), 'utf8');
    const down = await readFile(new URL('../../packages/database/migrations/002_identity_authorization.down.sql', import.meta.url), 'utf8');
    const foundationDown = await readFile(new URL('../../packages/database/migrations/001_foundation.down.sql', import.meta.url), 'utf8');
    const organizationId = '00000000-0000-4000-8000-000000000501';
    const actorId = '00000000-0000-4000-8000-000000000502';
    let transactionOpen = false;
    let app: Awaited<ReturnType<typeof createApp>> | undefined;
    try {
      await client.query('BEGIN');
      transactionOpen = true;
      await client.query(foundation);
      await client.query(identity);
      await client.query('INSERT INTO org.organization (id, code, name) VALUES ($1, $2, $3)', [organizationId, 'http-test', 'HTTP test']);
      await client.query(
        `INSERT INTO iam.user_account (id, organization_id, provider, provider_subject, username_normalized, display_name)
         VALUES ($1, $2, 'LOCAL_PASSWORD', 'actor-subject', 'actor@example.test', 'Actor')`,
        [actorId, organizationId],
      );
      await client.query("INSERT INTO iam.user_role_binding (id, organization_id, user_id, role_id) VALUES ('00000000-0000-4000-8000-000000000503', $1, $2, '00000000-0000-4000-8000-000000001001')", [organizationId, actorId]);
      await client.query("INSERT INTO iam.user_data_scope (id, organization_id, user_id, resource_type, scope_type) VALUES ('00000000-0000-4000-8000-000000000504', $1, $2, 'USER', 'ALL_ORG')", [organizationId, actorId]);
      await client.query('COMMIT');
      transactionOpen = false;

      app = await createApp({
        config: { nodeEnv: 'test', databaseUrl, sessionSecret: 't'.repeat(32) },
        authenticationProvider: new ControlledAuthenticationProvider([{ username: 'actor@example.test', subject: 'actor-subject', passwordHash: hashControlledPassword('pw') }]),
      });
      await app.init();
      const http = app.getHttpAdapter().getInstance();
      const csrf = await http.inject({ method: 'GET', url: '/api/v1/auth/csrf' });
      expect(csrf.statusCode).toBe(200);
      const bootstrapCookie = cookieFrom(csrf.headers['set-cookie']);
      const csrfToken = csrf.json().csrfToken as string;
      const login = await http.inject({
        method: 'POST',
        url: '/api/v1/auth/sessions',
        headers: { cookie: bootstrapCookie, 'x-csrf-token': csrfToken },
        payload: { provider: 'LOCAL_PASSWORD', username: 'actor@example.test', password: 'pw' },
      });
      expect(login.statusCode).toBe(201);
      const sessionCookie = cookieFrom(login.headers['set-cookie']);
      const sessionCsrf = login.json().csrfToken as string;
      const idempotencyKey = 'http-create-user-e2e';
      const created = await http.inject({
        method: 'POST',
        url: `/api/v1/organizations/${organizationId}/users`,
        headers: { cookie: sessionCookie, 'x-csrf-token': sessionCsrf, 'idempotency-key': idempotencyKey },
        payload: { username: 'created@example.test', role: 'SALES' },
      });
      expect(created.statusCode).toBe(201);
      const status = await http.inject({ method: 'GET', url: '/api/v1/commands/status', headers: { cookie: sessionCookie, 'idempotency-key': idempotencyKey, 'x-command-operation': 'createUser' } });
      expect(status.statusCode).toBe(200);
      expect(status.json()).toMatchObject({ state: 'SUCCEEDED', operationId: 'createUser', httpStatus: 201, resource: { type: 'USER' } });
      expect(status.json().resource.id).toBe(created.json().id);

      const disableKey = 'http-disable-user-e2e';
      const disable = await http.inject({
        method: 'POST',
        url: `/api/v1/users/${created.json().id}/disable`,
        headers: { cookie: sessionCookie, 'x-csrf-token': sessionCsrf, 'idempotency-key': disableKey, 'if-match': '"v1"' },
      });
      expect(disable.statusCode).toBe(202);
      expect(disable.json()).toMatchObject({ state: 'IN_PROGRESS', operationId: 'disableUser' });
      await expect(pool.query('SELECT status FROM iam.user_account WHERE id = $1', [created.json().id])).resolves.toMatchObject({ rows: [{ status: 'ACTIVE' }] });
      const acceptedStatus = await http.inject({ method: 'GET', url: '/api/v1/commands/status', headers: { cookie: sessionCookie, 'idempotency-key': disableKey, 'x-command-operation': 'disableUser' } });
      expect(acceptedStatus.json()).toMatchObject({ state: 'IN_PROGRESS', operationId: 'disableUser' });

      const commandProcessor = new IdentityCommandProcessor(new PostgresIdentityStore(pool), new PostgresIdempotencyRepository(pool));
      const worker = new OutboxWorker(new PostgresOutboxSource(pool, 'integration.identity_outbox_event'), { publish: (event) => commandProcessor.process(event) });
      expect(await worker.runOnce(50)).toBeGreaterThan(0);
      await expect(pool.query('SELECT status FROM iam.user_account WHERE id = $1', [created.json().id])).resolves.toMatchObject({ rows: [{ status: 'DISABLED' }] });
      const completedStatus = await http.inject({ method: 'GET', url: '/api/v1/commands/status', headers: { cookie: sessionCookie, 'idempotency-key': disableKey, 'x-command-operation': 'disableUser' } });
      expect(completedStatus.statusCode).toBe(200);
      expect(completedStatus.json()).toMatchObject({ state: 'SUCCEEDED', operationId: 'disableUser', httpStatus: 202, resource: { type: 'USER', id: created.json().id } });
      const replayedDisable = await http.inject({ method: 'POST', url: `/api/v1/users/${created.json().id}/disable`, headers: { cookie: sessionCookie, 'x-csrf-token': sessionCsrf, 'idempotency-key': disableKey, 'if-match': '"v1"' } });
      expect(replayedDisable.statusCode).toBe(202);
      expect(replayedDisable.json()).toMatchObject({ state: 'IN_PROGRESS', commandId: disable.json().commandId });
    } finally {
      if (app !== undefined) await app.close();
      if (transactionOpen) await client.query('ROLLBACK').catch(() => undefined);
      await client.query('BEGIN');
      await client.query("SET LOCAL app.allow_identity_down = 'true'");
      await client.query(down);
      await client.query(foundationDown);
      await client.query('COMMIT');
      client.release();
      await pool.end();
    }
  });
});

function cookieFrom(value: string | string[] | undefined): string {
  const cookie = Array.isArray(value) ? value[0] : value;
  if (cookie === undefined) throw new Error('Expected a session cookie.');
  return cookie.split(';', 1)[0] as string;
}
