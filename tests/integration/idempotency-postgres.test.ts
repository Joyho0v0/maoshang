import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { CanActivate, Controller, ExecutionContext, HttpCode, Module, Post, Req, Res } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  IdempotencyConflictError,
  type CommandResult,
} from '../../apps/api/src/modules/integration/idempotency/in-memory-idempotency-store.js';
import { PostgresIdempotencyRepository, type PostgresIdempotencyInput } from '../../apps/api/src/modules/integration/idempotency/postgres-idempotency-repository.js';
import { createContractValidator } from '../../packages/contracts/openapi/runtime-validator.js';
import { IdempotencyExecutionInterceptor } from '../../apps/api/src/common/security/idempotency-execution.interceptor.js';
import { requireIdempotencyTransaction } from '../../apps/api/src/common/security/idempotency-transaction-context.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

const databaseUrl = process.env.DATABASE_URL;

@Controller('customers')
class PostgresCustomerController {
  static executions = 0;
  static backendPids: number[] = [];
  static ownerBarrier: { started: () => void; released: Promise<void> } | undefined;

  @Post()
  @HttpCode(201)
  async create(@Req() request: FastifyRequest & { user?: { id: string; organizationId: string } }, @Res({ passthrough: true }) response: FastifyReply): Promise<{ id: string; name: string }> {
    PostgresCustomerController.executions += 1;
    const { client } = requireIdempotencyTransaction(request);
    const pid = await client.query<{ pid: number }>('SELECT pg_backend_pid() AS pid');
    PostgresCustomerController.backendPids.push(pid.rows[0]?.pid as number);
    const id = randomUUID();
    await client.query(
      "INSERT INTO integration.outbox_event (id, organization_id, aggregate_type, aggregate_id, event_type, payload) VALUES ($1, $2, 'Customer', $3, 'CustomerCreated', $4)",
      [randomUUID(), request.user?.organizationId, id, { customerId: id }],
    );
    if (PostgresCustomerController.ownerBarrier !== undefined) {
      PostgresCustomerController.ownerBarrier.started();
      await PostgresCustomerController.ownerBarrier.released;
    }
    response.header('location', `/api/v1/customers/${id}`);
    return { id, name: 'Acme' };
  }
}

@Module({ controllers: [PostgresCustomerController] })
class PostgresCustomerModule {}

class PostgresPrincipalGuard implements CanActivate {
  constructor(private readonly actorId: string, private readonly organizationId: string) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest & { user?: { id: string; organizationId: string } }>();
    request.user = { id: this.actorId, organizationId: this.organizationId };
    return true;
  }
}

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

    const status = await repository.withTransaction((client) => repository.statusByKey(client, input));
    expect(status).toMatchObject({ state: 'SUCCEEDED', resource: result.resource });
    const contract = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    expect(createContractValidator(contract).validate('CommandStatus', status)).toBe(true);

    await expect(repository.withTransaction((client) => repository.claim(client, { ...input, requestHash: 'request-b' }))).rejects.toBeInstanceOf(IdempotencyConflictError);
    await expect(repository.execute(input, async () => ({ status: 500, body: {} }))).resolves.toMatchObject({ status: 201, body: result.body, resultHref: `/api/v1/customers/${customerId}`, replayed: true });
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

  it('returns an observer while the owner business transaction is still open', async () => {
    const input: PostgresIdempotencyInput = { actorId, organizationId, operationId: 'createCustomerObserverWhileOpen', idempotencyKey: 'observer-open-key', requestHash: 'request-a' };
    let ownerStarted!: () => void;
    const ownerStartedPromise = new Promise<void>((resolve) => { ownerStarted = resolve; });
    let releaseOwner!: () => void;
    const ownerRelease = new Promise<void>((resolve) => { releaseOwner = resolve; });
    const owner = repository.execute(input, async () => {
      ownerStarted();
      await ownerRelease;
      const customerId = randomUUID();
      return { status: 201, body: { id: customerId }, resource: { type: 'CUSTOMER', id: customerId, href: `/api/v1/customers/${customerId}` } };
    });

    try {
      await ownerStartedPromise;
      const observer = await Promise.race([
        repository.execute(input, async () => ({ status: 201, body: { id: randomUUID() }, resource: { type: 'CUSTOMER', id: randomUUID(), href: '/api/v1/customers/observer' } })),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('observer remained blocked by the owner transaction')), 1_000)),
      ]);
      expect(observer).toMatchObject({ state: 'IN_PROGRESS', commandId: expect.any(String) });
    } finally {
      releaseOwner();
      await owner;
    }
  });

  it('rejects a successful terminal write without a strict resource reference', async () => {
    const input: PostgresIdempotencyInput = { actorId, organizationId, operationId: 'createCustomerMissingResource', idempotencyKey: 'missing-resource-key', requestHash: 'request-a' };
    const owner = await repository.withTransaction((client) => repository.claim(client, input));
    if (owner.ownerToken === undefined) throw new Error('Expected the first contender to own the claim.');

    await expect(repository.withTransaction((client) => repository.complete(client, owner.commandId, owner.ownerToken as Buffer, { status: 201, body: { id: randomUUID() } }))).rejects.toThrow(/ResourceReference/);
  });

  it('commits an accepted command as IN_PROGRESS until a worker completes it', async () => {
    const input: PostgresIdempotencyInput = { actorId, organizationId, operationId: 'disableUser', idempotencyKey: 'accepted-key', requestHash: 'request-a' };
    const accepted = await repository.execute(input, async (_client, claim) => ({
      status: 202,
      body: {
        commandId: claim.commandId,
        operationId: claim.operationId,
        state: 'IN_PROGRESS',
        startedAt: claim.startedAt,
        completedAt: null,
        expiresAt: claim.expiresAt,
        retryAfterMs: claim.retryAfterMs,
        httpStatus: null,
        resource: null,
        resultHref: null,
        problem: null,
        attemptCount: claim.attemptCount,
      },
    }));

    expect(accepted).toMatchObject({ status: 202, body: { state: 'IN_PROGRESS' } });
    await expect(repository.withTransaction((client) => repository.statusByKey(client, input))).resolves.toMatchObject({ state: 'IN_PROGRESS', resource: null });
  });

  it('rejects an incomplete 202 CommandStatus before persisting a terminal result', async () => {
    const input: PostgresIdempotencyInput = { actorId, organizationId, operationId: 'disableUserMalformedAccepted', idempotencyKey: 'malformed-accepted-key', requestHash: 'request-a' };

    await expect(repository.execute(input, async (_client, claim) => ({
      status: 202,
      body: { commandId: claim.commandId, state: 'IN_PROGRESS' },
    }))).rejects.toThrow(/CommandStatusInProgress/);
    await expect(repository.withTransaction((client) => repository.statusByKey(client, input))).resolves.toMatchObject({ state: 'RECOVERY_REQUIRED', resource: null });
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
      const customerId = randomUUID();
      return { status: 201, body: { id: customerId }, resource: { type: 'CUSTOMER', id: customerId, href: `/api/v1/customers/${customerId}` } };
    })).resolves.toMatchObject({ status: 201 });
    await expect(pool.query('SELECT count(*)::int AS count FROM integration.outbox_event WHERE id = $1', [eventId])).resolves.toMatchObject({ rows: [{ count: 1 }] });
  });

  it('carries one PostgreSQL client through HTTP business work and replays the stored terminal result', async () => {
    PostgresCustomerController.executions = 0;
    PostgresCustomerController.backendPids = [];
    const app = await NestFactory.create<NestFastifyApplication>(PostgresCustomerModule, new FastifyAdapter({ logger: false }));
    app.setGlobalPrefix('api/v1');
    app.useGlobalGuards(new PostgresPrincipalGuard(actorId, organizationId));
    app.useGlobalInterceptors(new IdempotencyExecutionInterceptor(repository));
    await app.init();
    const idempotencyKey = `http-postgres-${randomUUID()}`;
    const request = {
      method: 'POST' as const,
      url: '/api/v1/customers',
      headers: { 'idempotency-key': idempotencyKey, 'x-csrf-token': 'csrf-token-value' },
      payload: { name: 'Acme' },
    };
    try {
      const first = await app.getHttpAdapter().getInstance().inject(request);
      const second = await app.getHttpAdapter().getInstance().inject(request);
      expect(first.statusCode).toBe(201);
      expect(second.statusCode).toBe(201);
      expect(second.headers['idempotent-replay']).toBe('true');
      expect(second.headers.location).toBe(first.headers.location);
      expect(PostgresCustomerController.executions).toBe(1);
      expect(new Set(PostgresCustomerController.backendPids)).toHaveLength(1);

      const status = await repository.withTransaction((client) => repository.statusByKey(client, {
        actorId,
        organizationId,
        operationId: 'createCustomer',
        idempotencyKey,
      }));
      expect(status).toMatchObject({ state: 'SUCCEEDED', httpStatus: 201, resource: { type: 'CUSTOMER' } });
      const contract = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
      expect(createContractValidator(contract).validate('CommandStatus', status)).toBe(true);
      await expect(pool.query('SELECT count(*)::int AS count FROM integration.outbox_event WHERE organization_id = $1', [organizationId])).resolves.toMatchObject({ rows: [{ count: 2 }] });
    } finally {
      await app.close();
    }
  });

  it('returns a real PostgreSQL HTTP observer before the owner transaction commits', async () => {
    PostgresCustomerController.executions = 0;
    let startOwner!: () => void;
    const ownerStarted = new Promise<void>((resolve) => { startOwner = resolve; });
    let releaseOwner!: () => void;
    const ownerRelease = new Promise<void>((resolve) => { releaseOwner = resolve; });
    PostgresCustomerController.ownerBarrier = { started: startOwner, released: ownerRelease };
    const app = await NestFactory.create<NestFastifyApplication>(PostgresCustomerModule, new FastifyAdapter({ logger: false }));
    app.setGlobalPrefix('api/v1');
    app.useGlobalGuards(new PostgresPrincipalGuard(actorId, organizationId));
    app.useGlobalInterceptors(new IdempotencyExecutionInterceptor(repository));
    await app.init();
    const request = {
      method: 'POST' as const,
      url: '/api/v1/customers',
      headers: { 'idempotency-key': `http-postgres-observer-${randomUUID()}`, 'x-csrf-token': 'csrf-token-value' },
      payload: { name: 'Observer customer' },
    };
    const owner = app.getHttpAdapter().getInstance().inject(request);
    try {
      await ownerStarted;
      const observer = await Promise.race([
        app.getHttpAdapter().getInstance().inject(request),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('real PostgreSQL HTTP observer remained blocked')), 1_000)),
      ]);
      expect(observer.statusCode).toBe(202);
      expect(observer.json()).toMatchObject({ state: 'IN_PROGRESS', operationId: 'createCustomer' });
      releaseOwner();
      const completed = await owner;
      expect(completed.statusCode).toBe(201);
      expect(PostgresCustomerController.executions).toBe(1);
    } finally {
      releaseOwner();
      await owner;
      PostgresCustomerController.ownerBarrier = undefined;
      await app.close();
    }
  });

  it('fails closed when a persisted terminal resource reference is corrupted', async () => {
    const input: PostgresIdempotencyInput = { actorId, organizationId, operationId: 'createCustomerCorruptResource', idempotencyKey: 'corrupt-resource-key', requestHash: 'request-a' };
    const owner = await repository.withTransaction((client) => repository.claim(client, input));
    if (owner.ownerToken === undefined) throw new Error('Expected the first contender to own the claim.');
    const customerId = randomUUID();
    await repository.withTransaction((client) => repository.complete(client, owner.commandId, owner.ownerToken as Buffer, {
      status: 201,
      body: { id: customerId },
      resource: { type: 'CUSTOMER', id: customerId, href: `/api/v1/customers/${customerId}` },
    }));
    await pool.query("UPDATE integration.idempotency_record SET resource_type = 'BOGUS' WHERE id = $1", [owner.commandId]);

    await expect(repository.withTransaction((client) => repository.statusById(client, owner.commandId))).rejects.toThrow(/ResourceReference/);
  });

  it('fails closed when persisted replay headers contain an undeclared header', async () => {
    const input: PostgresIdempotencyInput = { actorId, organizationId, operationId: 'createCustomerCorruptHeaders', idempotencyKey: 'corrupt-headers-key', requestHash: 'request-a' };
    const owner = await repository.withTransaction((client) => repository.claim(client, input));
    if (owner.ownerToken === undefined) throw new Error('Expected the first contender to own the claim.');
    const customerId = randomUUID();
    await repository.withTransaction((client) => repository.complete(client, owner.commandId, owner.ownerToken as Buffer, {
      status: 201,
      body: { id: customerId },
      resource: { type: 'CUSTOMER', id: customerId, href: `/api/v1/customers/${customerId}` },
      responseHeaders: { location: `/api/v1/customers/${customerId}` },
    }));
    await pool.query("UPDATE integration.idempotency_record SET response_headers = '{\"x-forwarded-host\":\"evil\"}'::jsonb WHERE id = $1", [owner.commandId]);

    await expect(repository.execute(input, async () => ({ status: 201, body: {} }))).rejects.toThrow(/response headers/i);
  });
});
