import { lastValueFrom, of } from 'rxjs';
import { IdempotencyExecutionInterceptor } from '../../apps/api/src/common/security/idempotency-execution.interceptor.js';
import { requireIdempotencyTransaction } from '../../apps/api/src/common/security/idempotency-transaction-context.js';
import { IdempotencyConflictError } from '../../apps/api/src/modules/integration/idempotency/in-memory-idempotency-store.js';

describe('idempotency execution interceptor', () => {
  it('executes the controller only through the repository transaction boundary', async () => {
    let controllerExecutions = 0;
    let persistedResult: unknown;
    const transactionClient = { query: async () => undefined };
    const claim = { commandId: 'command-1', claimRole: 'OWNER' as const };
    const repository = {
      execute: async (_input: unknown, work: (client: unknown, claim: unknown) => Promise<unknown>) => {
        persistedResult = await work(transactionClient, claim);
        return persistedResult;
      },
    };
    const interceptor = new IdempotencyExecutionInterceptor(repository as never);
    const request = {
      method: 'POST',
      url: '/api/v1/customers',
      routeOptions: { url: '/api/v1/customers' },
      params: {},
      query: {},
      body: { name: 'Acme', ownerUserId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2' },
      headers: { 'idempotency-key': 'key-1', 'x-csrf-token': 'csrf-token-value' },
      user: { id: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', organizationId: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' },
    };
    const response = { statusCode: 201, getHeader: (name: string) => name.toLowerCase() === 'location' ? '/api/v1/customers/2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' : undefined, header: () => response };
    const context = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) } as never;
    const next = { handle: () => {
      controllerExecutions += 1;
      expect(requireIdempotencyTransaction(request as never)).toEqual({ client: transactionClient, claim });
      return of({ id: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' });
    } };

    const result = await lastValueFrom(interceptor.intercept(context, next as never));
    const callbackClient = (result as { id: string }).id;
    expect(callbackClient).toBe('2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019');
    expect(controllerExecutions).toBe(1);
    expect(persistedResult).toMatchObject({ resource: { type: 'CUSTOMER', id: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019', href: '/api/v1/customers/2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' } });
  });

  it('maps a request-hash conflict to the typed 409 problem contract', async () => {
    const repository = { execute: async () => { throw new IdempotencyConflictError(); } };
    const interceptor = new IdempotencyExecutionInterceptor(repository as never);
    const request = {
      method: 'POST',
      url: '/api/v1/customers',
      routeOptions: { url: '/api/v1/customers' },
      params: {},
      query: {},
      body: { name: 'Acme', ownerUserId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2' },
      headers: { 'idempotency-key': 'key-1', 'x-csrf-token': 'csrf-token-value' },
      user: { id: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', organizationId: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' },
    };
    const response = { statusCode: 201, getHeader: () => undefined, header: () => response };
    const context = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) } as never;

    await expect(lastValueFrom(interceptor.intercept(context, { handle: () => of({}) } as never))).rejects.toMatchObject({ name: 'ProblemError', status: 409, code: 'IDEMPOTENCY_KEY_REUSED' });
  });

  it('marks a terminal replay for HTTP consumers', async () => {
    const headers: Record<string, string> = {};
    const repository = { execute: async () => ({ status: 201, body: { id: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' }, replayed: true }) };
    const interceptor = new IdempotencyExecutionInterceptor(repository as never);
    const request = {
      method: 'POST',
      url: '/api/v1/customers',
      routeOptions: { url: '/api/v1/customers' },
      params: {},
      query: {},
      body: { name: 'Acme', ownerUserId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2' },
      headers: { 'idempotency-key': 'key-1', 'x-csrf-token': 'csrf-token-value' },
      user: { id: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', organizationId: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' },
    };
    const response = { statusCode: 201, getHeader: () => undefined, header: (name: string, value: string) => { headers[name] = value; return response; } };
    const context = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) } as never;

    await expect(lastValueFrom(interceptor.intercept(context, { handle: () => of({}) } as never))).resolves.toEqual({ id: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' });
    expect(headers['idempotent-replay']).toBe('true');
  });
});
