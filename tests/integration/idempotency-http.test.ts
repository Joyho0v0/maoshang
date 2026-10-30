import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { CanActivate, Controller, ExecutionContext, HttpCode, Module, Post, Req, Res } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import type { FastifyReply } from 'fastify';
import { IdempotencyExecutionInterceptor } from '../../apps/api/src/common/security/idempotency-execution.interceptor.js';
import { IdempotencyConflictError, type CommandResult, type CommandStatus } from '../../apps/api/src/modules/integration/idempotency/in-memory-idempotency-store.js';
import { requireIdempotencyTransaction } from '../../apps/api/src/common/security/idempotency-transaction-context.js';
import { ProblemExceptionFilter } from '../../apps/api/src/common/http/problem.filter.js';
import { createContractValidator } from '../../packages/contracts/openapi/runtime-validator.js';

const actorId = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2';
const organizationId = '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019';

@Controller('customers')
class ConcurrentCustomerController {
  static executions = 0;
  static snapshot: unknown;
  static sideEffectClients: unknown[] = [];

  @Post()
  @HttpCode(201)
  async create(@Req() request: { routeOptions?: { url?: string }; url: string; method: string; user?: unknown; headers: unknown }, @Res({ passthrough: true }) response: FastifyReply): Promise<{ id: string }> {
    ConcurrentCustomerController.executions += 1;
    ConcurrentCustomerController.snapshot = { route: request.routeOptions?.url, url: request.url, method: request.method, user: request.user, headers: request.headers };
    const transaction = requireIdempotencyTransaction(request);
    await transaction.client.query('insert business side effect');
    await transaction.client.query('insert audit side effect');
    await transaction.client.query('insert outbox side effect');
    ConcurrentCustomerController.sideEffectClients.push(transaction.client, transaction.client, transaction.client);
    const id = randomUUID();
    response.header('location', `/api/v1/customers/${id}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
    return { id };
  }
}

@Module({ controllers: [ConcurrentCustomerController] })
class ConcurrentCustomerModule {}

class TestPrincipalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: { userId: string; organizationId: string } }>();
    request.user = { userId: actorId, organizationId };
    return true;
  }
}

class HttpIdempotencyRepositoryFake {
  calls = 0;
  readonly transactionClient = { query: async () => ({ rows: [] }) };
  private record: { commandId: string; operationId: string; requestHash: string; status: CommandStatus; promise: Promise<CommandResult<unknown>>; result?: CommandResult<unknown> } | undefined;

  async execute(input: { operationId: string; requestHash: string }, work: (client: unknown, claim: unknown) => Promise<CommandResult<unknown>>): Promise<CommandResult<unknown> | CommandStatus> {
    this.calls += 1;
    const current = this.record;
    if (current !== undefined) {
      if (current.operationId !== input.operationId || current.requestHash !== input.requestHash) throw new IdempotencyConflictError();
      if (current.result !== undefined) return { ...current.result, replayed: true };
      return current.status;
    }

    const commandId = randomUUID();
    const status: CommandStatus = {
      commandId,
      operationId: input.operationId,
      state: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      completedAt: null,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      retryAfterMs: 1000,
      httpStatus: null,
      resource: null,
      resultHref: null,
      problem: null,
    };
    const promise = work(this.transactionClient, { ...status, claimRole: 'OWNER' as const }).then((result) => {
      if (result.resource === undefined) throw new Error('test repository requires the interceptor to derive a resource reference');
      const record = this.record;
      if (record !== undefined) record.result = result;
      return result;
    });
    this.record = { commandId, operationId: input.operationId, requestHash: input.requestHash, status, promise };
    return promise;
  }
}

describe('HTTP idempotency execution boundary', () => {
  it('runs one controller owner, returns an observer 202, then replays the terminal result', async () => {
    ConcurrentCustomerController.executions = 0;
    ConcurrentCustomerController.sideEffectClients = [];
    const repository = new HttpIdempotencyRepositoryFake();
    const app = await NestFactory.create<NestFastifyApplication>(ConcurrentCustomerModule, new FastifyAdapter({ logger: false }));
    app.setGlobalPrefix('api/v1');
    const contract = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    app.useGlobalFilters(new ProblemExceptionFilter(createContractValidator(contract)));
    app.useGlobalGuards(new TestPrincipalGuard());
    app.useGlobalInterceptors(new IdempotencyExecutionInterceptor(repository as never));
    await app.init();
    try {
      const request = {
        method: 'POST' as const,
        url: '/api/v1/customers',
        headers: { 'idempotency-key': 'http-concurrent-key', 'x-csrf-token': 'csrf-token-value' },
        payload: { name: 'Acme', ownerUserId: actorId },
      };
      const requests = Array.from({ length: 20 }, () => app.getHttpAdapter().getInstance().inject(request));
      const responses = await Promise.all(requests);

      expect(ConcurrentCustomerController.snapshot).toMatchObject({ route: '/api/v1/customers', method: 'POST', user: { userId: actorId, organizationId } });
      expect(ConcurrentCustomerController.executions).toBe(1);
      expect(repository.calls).toBe(20);
      expect(responses.filter((candidate) => candidate.statusCode === 201)).toHaveLength(1);
      expect(responses.filter((candidate) => candidate.statusCode === 202)).toHaveLength(19);
      const ownerResponse = responses.find((candidate) => candidate.statusCode === 201);
      const observerResponse = responses.find((candidate) => candidate.statusCode === 202);
      expect(ownerResponse).toBeDefined();
      expect(observerResponse).toBeDefined();
      expect(observerResponse?.json()).toMatchObject({ state: 'IN_PROGRESS', operationId: 'createCustomer' });
      expect(ConcurrentCustomerController.sideEffectClients).toHaveLength(3);
      expect(new Set(ConcurrentCustomerController.sideEffectClients)).toEqual(new Set([repository.transactionClient]));

      const replay = await app.getHttpAdapter().getInstance().inject(request);
      expect(replay.statusCode).toBe(201);
      expect(replay.json()).toEqual(ownerResponse?.json());
      expect(replay.headers['idempotent-replay']).toBe('true');
      expect(ConcurrentCustomerController.executions).toBe(1);

      const conflict = await app.getHttpAdapter().getInstance().inject({ ...request, payload: { name: 'Different customer' } });
      expect(conflict.statusCode).toBe(409);
      expect(conflict.json()).toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED', status: 409 });
      expect(ConcurrentCustomerController.executions).toBe(1);
    } finally {
      await app.close();
    }
  });
});
