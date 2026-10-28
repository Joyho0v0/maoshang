import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { CanActivate, Controller, ExecutionContext, HttpCode, Module, Post, Req, Res } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import type { FastifyReply } from 'fastify';
import { IdempotencyExecutionInterceptor } from '../../apps/api/src/common/security/idempotency-execution.interceptor.js';
import { IdempotencyConflictError, type CommandResult, type CommandStatus } from '../../apps/api/src/modules/integration/idempotency/in-memory-idempotency-store.js';

const actorId = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2';
const organizationId = '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019';

@Controller('customers')
class ConcurrentCustomerController {
  static executions = 0;
  static snapshot: unknown;

  @Post()
  @HttpCode(201)
  async create(@Req() request: { routeOptions?: { url?: string }; url: string; method: string; user?: unknown; headers: unknown }, @Res({ passthrough: true }) response: FastifyReply): Promise<{ id: string }> {
    ConcurrentCustomerController.executions += 1;
    ConcurrentCustomerController.snapshot = { route: request.routeOptions?.url, url: request.url, method: request.method, user: request.user, headers: request.headers };
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
    const request = context.switchToHttp().getRequest<{ user?: { id: string; organizationId: string } }>();
    request.user = { id: actorId, organizationId };
    return true;
  }
}

class HttpIdempotencyRepositoryFake {
  calls = 0;
  private record: { commandId: string; operationId: string; status: CommandStatus; promise: Promise<CommandResult<unknown>>; result?: CommandResult<unknown> } | undefined;

  async execute(input: { operationId: string; requestHash: string }, work: () => Promise<CommandResult<unknown>>): Promise<CommandResult<unknown> | CommandStatus> {
    this.calls += 1;
    const current = this.record;
    if (current !== undefined) {
      if (current.operationId !== input.operationId || input.requestHash.length === 0) throw new IdempotencyConflictError();
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
      attemptCount: 1,
    };
    const promise = work().then((result) => {
      if (result.resource === undefined) throw new Error('test repository requires the interceptor to derive a resource reference');
      const record = this.record;
      if (record !== undefined) record.result = result;
      return result;
    });
    this.record = { commandId, operationId: input.operationId, status, promise };
    return promise;
  }
}

describe('HTTP idempotency execution boundary', () => {
  it('runs one controller owner, returns an observer 202, then replays the terminal result', async () => {
    ConcurrentCustomerController.executions = 0;
    const repository = new HttpIdempotencyRepositoryFake();
    const app = await NestFactory.create<NestFastifyApplication>(ConcurrentCustomerModule, new FastifyAdapter({ logger: false }));
    app.setGlobalPrefix('api/v1');
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
      const [owner, observer] = await Promise.all([
        app.getHttpAdapter().getInstance().inject(request),
        app.getHttpAdapter().getInstance().inject(request),
      ]);

      expect(ConcurrentCustomerController.snapshot).toMatchObject({ route: '/api/v1/customers', method: 'POST', user: { id: actorId, organizationId } });
      expect(ConcurrentCustomerController.executions).toBe(1);
      expect(repository.calls).toBe(2);
      expect([owner.statusCode, observer.statusCode].sort()).toEqual([201, 202]);
      const ownerResponse = owner.statusCode === 201 ? owner : observer;
      const observerResponse = owner.statusCode === 202 ? owner : observer;
      expect(observerResponse.json()).toMatchObject({ state: 'IN_PROGRESS', operationId: 'createCustomer' });

      const replay = await app.getHttpAdapter().getInstance().inject(request);
      expect(replay.statusCode).toBe(201);
      expect(replay.json()).toEqual(ownerResponse.json());
      expect(replay.headers['idempotent-replay']).toBe('true');
      expect(ConcurrentCustomerController.executions).toBe(1);
    } finally {
      await app.close();
    }
  });
});
