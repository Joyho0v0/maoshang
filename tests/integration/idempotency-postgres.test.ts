import pg from 'pg';
import { randomUUID } from 'node:crypto';
import {
  IdempotencyConflictError,
  type CommandResult,
} from '../../apps/api/src/modules/integration/idempotency/in-memory-idempotency-store.js';
import { PostgresIdempotencyRepository, type PostgresIdempotencyInput } from '../../apps/api/src/modules/integration/idempotency/postgres-idempotency-repository.js';

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(databaseUrl === undefined)('PostgreSQL idempotency protocol', () => {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 25 });
  const repository = new PostgresIdempotencyRepository(pool);
  const organizationId = randomUUID();
  const actorId = randomUUID();

  beforeAll(async () => {
    await pool.query('INSERT INTO core.organization (id, name) VALUES ($1, $2)', [organizationId, 'Idempotency Test Org']);
    await pool.query('INSERT INTO core.user_account (id, organization_id) VALUES ($1, $2)', [actorId, organizationId]);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM integration.idempotency_record WHERE organization_id = $1', [organizationId]);
    await pool.query('DELETE FROM integration.outbox_event WHERE organization_id = $1', [organizationId]);
    await pool.query('DELETE FROM core.user_account WHERE id = $1', [actorId]);
    await pool.query('DELETE FROM core.organization WHERE id = $1', [organizationId]);
    await pool.end();
  });

  it('claims one row under twenty concurrent contenders and replays the terminal result', async () => {
    const input: PostgresIdempotencyInput = { actorId, organizationId, operationId: 'createCustomer', idempotencyKey: 'concurrent-key', requestHash: 'request-a' };
    const claims = await Promise.all(Array.from({ length: 20 }, () => repository.withTransaction((client) => repository.claim(client, input))));
    expect(new Set(claims.map((claim) => claim.commandId)).size).toBe(1);
    expect(new Set(claims.map((claim) => claim.attemptCount))).toEqual(new Set([1]));

    const owner = claims[0];
    if (owner === undefined) throw new Error('Expected a claim.');
    const ownerToken = owner.ownerToken;
    if (ownerToken === undefined) throw new Error('Expected the first contender to own the claim.');
    const customerId = randomUUID();
    const result: CommandResult<{ id: string; name: string }> = { status: 201, body: { id: customerId, name: 'Acme' }, resource: { type: 'CUSTOMER', id: customerId, href: `/api/v1/customers/${customerId}` }, resultHref: `/api/v1/customers/${customerId}` };
    await repository.withTransaction((client) => repository.complete(client, owner.commandId, ownerToken, result));

    await expect(repository.withTransaction((client) => repository.statusByKey(client, input))).resolves.toMatchObject({ state: 'SUCCEEDED', resource: result.resource });

    await expect(repository.withTransaction((client) => repository.claim(client, { ...input, requestHash: 'request-b' }))).rejects.toBeInstanceOf(IdempotencyConflictError);
    await expect(repository.execute(input, async () => ({ status: 500, body: {} }))).resolves.toMatchObject({ status: 201, body: result.body, resultHref: `/api/v1/customers/${customerId}` });
  });

  it('lets one expired contender take over while preserving the command identity', async () => {
    const input: PostgresIdempotencyInput = { actorId, organizationId, operationId: 'reverseInventoryOperation', idempotencyKey: 'expired-key', requestHash: 'request-a' };
    const initial = await repository.withTransaction((client) => repository.claim(client, input));
    await pool.query('UPDATE integration.idempotency_record SET lease_expires_at = now() - interval \'1 second\' WHERE id = $1', [initial.commandId]);
    const contenders = await Promise.all([1, 2].map(() => repository.withTransaction((client) => repository.claim(client, input))));
    expect(new Set(contenders.map((claim) => claim.commandId)).size).toBe(1);
    expect(Math.max(...contenders.map((claim) => claim.attemptCount))).toBe(2);
  });

  it('does not let an unexpired observer execute the owner callback', async () => {
    const input: PostgresIdempotencyInput = { actorId, organizationId, operationId: 'createCustomerObserver', idempotencyKey: 'observer-key', requestHash: 'request-a' };
    const owner = await repository.withTransaction((client) => repository.claim(client, input));
    let executions = 0;
    const observer = await repository.execute(input, async () => {
      executions += 1;
      return { status: 201, body: { id: randomUUID() } };
    });
    expect(executions).toBe(0);
    expect(observer).toMatchObject({ commandId: owner.commandId, state: 'IN_PROGRESS' });
  });

  it('rolls back business side effects on transient failure before releasing the lease', async () => {
    const input: PostgresIdempotencyInput = { actorId, organizationId, operationId: 'createCustomerWithTransientFailure', idempotencyKey: 'transient-key', requestHash: 'request-a' };
    const eventId = randomUUID();
    await expect(repository.execute(input, async (client) => {
      await client.query("INSERT INTO integration.outbox_event (id, organization_id, aggregate_type, aggregate_id, event_type, payload) VALUES ($1, $2, 'Customer', $3, 'CustomerCreated', '{}'::jsonb)", [eventId, organizationId, randomUUID()]);
      throw new Error('transient failure');
    })).rejects.toThrow('transient failure');
    await expect(pool.query('SELECT count(*)::int AS count FROM integration.outbox_event WHERE id = $1', [eventId])).resolves.toMatchObject({ rows: [{ count: 0 }] });

    await expect(repository.execute(input, async (client) => {
      await client.query("INSERT INTO integration.outbox_event (id, organization_id, aggregate_type, aggregate_id, event_type, payload) VALUES ($1, $2, 'Customer', $3, 'CustomerCreated', '{}'::jsonb)", [eventId, organizationId, randomUUID()]);
      return { status: 201, body: { id: randomUUID() } };
    })).resolves.toMatchObject({ status: 201 });
    await expect(pool.query('SELECT count(*)::int AS count FROM integration.outbox_event WHERE id = $1', [eventId])).resolves.toMatchObject({ rows: [{ count: 1 }] });
  });
});
