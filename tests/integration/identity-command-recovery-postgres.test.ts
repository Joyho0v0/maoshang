import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { PostgresIdentityStore } from '../../apps/api/src/modules/identity/infrastructure/postgres-identity.store.js';
import { PostgresIdempotencyRepository } from '../../apps/api/src/modules/integration/idempotency/postgres-idempotency-repository.js';
import { IdentityCommandProcessor } from '../../apps/worker/src/identity-command-processor.js';
import { PostgresOutboxSource } from '../../apps/worker/src/postgres-outbox-source.js';
import { OutboxWorker } from '../../apps/worker/src/worker.js';

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(databaseUrl === undefined)('PostgreSQL identity command recovery boundary', () => {
  it('keeps duplicate workers single-apply, ignores stale lease owners, and terminally fails deterministic conflicts', async () => {
    if (databaseUrl === undefined) return;
    const pool = new pg.Pool({ connectionString: databaseUrl, max: 8 });
    const client = await pool.connect();
    const foundation = await readFile(new URL('../../packages/database/migrations/001_foundation.sql', import.meta.url), 'utf8');
    const identity = await readFile(new URL('../../packages/database/migrations/002_identity_authorization.sql', import.meta.url), 'utf8');
    const down = await readFile(new URL('../../packages/database/migrations/002_identity_authorization.down.sql', import.meta.url), 'utf8');
    const foundationDown = await readFile(new URL('../../packages/database/migrations/001_foundation.down.sql', import.meta.url), 'utf8');
    let transactionOpen = false;
    try {
      await client.query('BEGIN');
      transactionOpen = true;
      await client.query(foundation);
      await client.query(identity);
      await client.query('COMMIT');
      transactionOpen = false;

      const store = new PostgresIdentityStore(pool);
      const repository = new PostgresIdempotencyRepository(pool);
      const processor = new IdentityCommandProcessor(store, repository);

      const duplicate = await fixture(pool, 'duplicate');
      const duplicateCommand = await command(repository, duplicate, 1, 'duplicate-key');
      const duplicatePayload = disablePayload(duplicate, duplicateCommand.ownerToken, duplicateCommand.commandId, 1);
      await insertEvent(pool, duplicate, duplicatePayload);
      await insertEvent(pool, duplicate, duplicatePayload);
      const duplicateWorker = () => new OutboxWorker(new PostgresOutboxSource(pool, 'integration.identity_outbox_event'), { publish: (event) => processor.process(event) });
      const duplicateRuns = await Promise.all([duplicateWorker().runOnce(1), duplicateWorker().runOnce(1)]);
      expect(duplicateRuns).toEqual([1, 1]);
      await expect(pool.query('SELECT status, version::int FROM iam.user_account WHERE id = $1', [duplicate.targetId])).resolves.toMatchObject({ rows: [{ status: 'DISABLED', version: 2 }] });
      await expect(pool.query('SELECT state, attempt_count FROM integration.idempotency_record WHERE id = $1', [duplicateCommand.commandId])).resolves.toMatchObject({ rows: [{ state: 'SUCCEEDED', attempt_count: 1 }] });
      await expect(pool.query("SELECT count(*)::int AS count FROM audit.audit_event WHERE resource_id = $1 AND action = 'identity.user.disable'", [duplicate.targetId])).resolves.toMatchObject({ rows: [{ count: 1 }] });

      const takeover = await fixture(pool, 'takeover');
      const oldCommand = await command(repository, takeover, 1, 'takeover-key');
      const oldEventId = await insertEvent(pool, takeover, disablePayload(takeover, oldCommand.ownerToken, oldCommand.commandId, 1));
      const staleClaim = await new PostgresOutboxSource(pool, 'integration.identity_outbox_event').claimBatch(100);
      expect(staleClaim.map((event) => event.id)).toContain(oldEventId);
      const newOwner = Buffer.alloc(32, 9);
      await pool.query('UPDATE integration.idempotency_record SET owner_token = $2, lease_expires_at = now() + interval \'30 seconds\', attempt_count = attempt_count + 1 WHERE id = $1', [oldCommand.commandId, newOwner]);
      await insertEvent(pool, takeover, disablePayload(takeover, newOwner, oldCommand.commandId, 1));
      await pool.query("UPDATE integration.identity_outbox_event SET claim_expires_at = now() - interval '1 second' WHERE id = $1", [oldEventId]);
      const takeoverWorker = new OutboxWorker(new PostgresOutboxSource(pool, 'integration.identity_outbox_event'), { publish: (event) => processor.process(event) });
      await expect(takeoverWorker.runOnce(2)).resolves.toBe(2);
      await expect(pool.query('SELECT status, version::int FROM iam.user_account WHERE id = $1', [takeover.targetId])).resolves.toMatchObject({ rows: [{ status: 'DISABLED', version: 2 }] });
      await expect(pool.query('SELECT state, attempt_count FROM integration.idempotency_record WHERE id = $1', [oldCommand.commandId])).resolves.toMatchObject({ rows: [{ state: 'SUCCEEDED', attempt_count: 2 }] });
      const takeoverEvents = await pool.query<{ status: string }>("SELECT status FROM integration.identity_outbox_event WHERE payload->>'commandId' = $1", [oldCommand.commandId]);
      expect(takeoverEvents.rows).toHaveLength(2);
      expect(takeoverEvents.rows.every((row) => row.status === 'PUBLISHED')).toBe(true);

      const failed = await fixture(pool, 'failed');
      const failedCommand = await command(repository, failed, 999, 'failed-key');
      const failedEventId = await insertEvent(pool, failed, disablePayload(failed, failedCommand.ownerToken, failedCommand.commandId, 999));
      const failedSource = new PostgresOutboxSource(pool, 'integration.identity_outbox_event');
      const failedClaims = await failedSource.claimBatch(100);
      const failedEvent = failedClaims.find((event) => event.id === failedEventId);
      if (failedEvent === undefined) throw new Error('Failed identity command event was not claimed.');
      const failedWorker = new OutboxWorker({
        claimBatch: async () => [failedEvent],
        markPublished: (id, claimToken) => failedSource.markPublished(id, claimToken),
        markFailed: (id, error, claimToken) => failedSource.markFailed(id, error, claimToken),
      }, { publish: (event) => processor.process(event) });
      await expect(failedWorker.runOnce(1)).resolves.toBe(1);
      await expect(pool.query('SELECT state, http_status, problem_body->>\'code\' AS code FROM integration.idempotency_record WHERE id = $1', [failedCommand.commandId])).resolves.toMatchObject({ rows: [{ state: 'FAILED', http_status: 409, code: 'VERSION_CONFLICT' }] });
      await expect(pool.query('SELECT status, version::int FROM iam.user_account WHERE id = $1', [failed.targetId])).resolves.toMatchObject({ rows: [{ status: 'ACTIVE', version: 1 }] });

      const expiredOwner = await fixture(pool, 'expired-owner');
      const expiredCommand = await command(repository, expiredOwner, 1, 'expired-owner-key');
      const expiredEventId = await insertEvent(pool, expiredOwner, disablePayload(expiredOwner, expiredCommand.ownerToken, expiredCommand.commandId, 1));
      await pool.query("UPDATE integration.idempotency_record SET lease_expires_at = now() - interval '1 second' WHERE id = $1", [expiredCommand.commandId]);
      const expiredSource = new PostgresOutboxSource(pool, 'integration.identity_outbox_event');
      const expiredWorker = new OutboxWorker(expiredSource, { publish: (event) => processor.process(event) });
      await expect(expiredWorker.runOnce(100)).resolves.toBe(1);
      await expect(pool.query('SELECT status, version::int FROM iam.user_account WHERE id = $1', [expiredOwner.targetId])).resolves.toMatchObject({ rows: [{ status: 'DISABLED', version: 2 }] });
      await expect(pool.query('SELECT state FROM integration.idempotency_record WHERE id = $1', [expiredCommand.commandId])).resolves.toMatchObject({ rows: [{ state: 'SUCCEEDED' }] });
      await expect(pool.query('SELECT status FROM integration.identity_outbox_event WHERE id = $1', [expiredEventId])).resolves.toMatchObject({ rows: [{ status: 'PUBLISHED' }] });
      await expect(pool.query("SELECT count(*)::int AS count FROM audit.audit_event WHERE resource_id = $1 AND action = 'identity.user.disable'", [expiredOwner.targetId])).resolves.toMatchObject({ rows: [{ count: 1 }] });
    } finally {
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

interface Fixture {
  organizationId: string;
  actorId: string;
  targetId: string;
}

interface Command {
  commandId: string;
  ownerToken: Buffer;
}

async function fixture(pool: pg.Pool, label: string): Promise<Fixture> {
  const organizationId = randomUUID();
  const actorId = randomUUID();
  const targetId = randomUUID();
  await pool.query('INSERT INTO org.organization (id, code, name) VALUES ($1, $2, $3)', [organizationId, `recovery-${label}`, `Recovery ${label}`]);
  await pool.query(`INSERT INTO iam.user_account (id, organization_id, provider, provider_subject, username_normalized, display_name)
    VALUES ($1, $2, 'LOCAL_PASSWORD', $3, $4, $5), ($6, $2, 'LOCAL_PASSWORD', $7, $8, $9)`, [actorId, organizationId, `${label}-actor`, `${label}-actor@example.test`, 'Actor', targetId, `${label}-target`, `${label}-target@example.test`, 'Target']);
  return { organizationId, actorId, targetId };
}

async function command(repository: PostgresIdempotencyRepository, fixture: Fixture, expectedVersion: number, key: string): Promise<Command> {
  const claim = await repository.withTransaction((client) => repository.claim(client, {
    actorId: fixture.actorId,
    organizationId: fixture.organizationId,
    operationId: 'disableUser',
    idempotencyKey: key,
    requestHash: key,
  }));
  if (claim.claimRole !== 'OWNER' || claim.ownerToken === undefined) throw new Error('Expected an idempotency owner claim.');
  return { commandId: claim.commandId, ownerToken: claim.ownerToken };
}

function disablePayload(fixture: Fixture, ownerToken: Buffer, commandId: string, expectedVersion: number): Record<string, unknown> {
  return {
    commandId,
    operationId: 'disableUser',
    ownerToken: ownerToken.toString('base64'),
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    retryAfterMs: 1000,
    mutation: {
      organizationId: fixture.organizationId,
      targetUserId: fixture.targetId,
      actorUserId: fixture.actorId,
      expectedVersion,
      audit: {
        organizationId: fixture.organizationId,
        actorUserId: fixture.actorId,
        action: 'identity.user.disable',
        resourceType: 'USER',
        resourceId: fixture.targetId,
        outcome: 'SUCCEEDED',
        requestId: randomUUID(),
      },
    },
  };
}

async function insertEvent(pool: pg.Pool, fixture: Fixture, payload: Record<string, unknown>): Promise<string> {
  const id = randomUUID();
  await pool.query(`INSERT INTO integration.identity_outbox_event
    (id, organization_id, aggregate_type, aggregate_id, event_type, payload)
    VALUES ($1, $2, 'USER', $3, 'identity.command.disable_user', $4::jsonb)`, [id, fixture.organizationId, fixture.targetId, JSON.stringify(payload)]);
  return id;
}
