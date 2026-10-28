import { lastValueFrom, of } from 'rxjs';
import { IDEMPOTENT_RESOURCE_PROJECTORS, IdempotencyExecutionInterceptor, resourceReferenceForResponse } from '../../apps/api/src/common/security/idempotency-execution.interceptor.js';
import { requireIdempotencyTransaction } from '../../apps/api/src/common/security/idempotency-transaction-context.js';
import { IdempotencyConflictError } from '../../apps/api/src/modules/integration/idempotency/in-memory-idempotency-store.js';
import { EXPECTED_OPERATION_MANIFEST } from '../../packages/contracts/openapi/contract-manifest.js';
import { operations } from '../../packages/contracts/openapi/generated-client.js';

describe('idempotency execution interceptor', () => {
  it('has an operation-aware projector for every synchronous idempotent resource response', () => {
    const expected = EXPECTED_OPERATION_MANIFEST
      .filter((entry) => entry.idempotency)
      .filter((entry) => Object.entries(operations[entry.operationId].responses).some(([status, contract]) => status.startsWith('2') && status !== '202' && contract.schema !== undefined))
      .map((entry) => entry.operationId)
      .sort();
    expect(Object.keys(IDEMPOTENT_RESOURCE_PROJECTORS).sort()).toEqual(expected);
    for (const operationId of expected) {
      const success = Object.entries(operations[operationId].responses).find(([status, contract]) => status.startsWith('2') && status !== '202' && contract.schema !== undefined);
      expect(success).toBeDefined();
      const [status, contract] = success as [string, { schema?: string }];
      expect(IDEMPOTENT_RESOURCE_PROJECTORS[operationId]).toMatchObject({ status: Number(status), schema: contract.schema });
    }
  });

  it('rejects a resource reference whose Location belongs to the request action, not the returned operation', () => {
    const reservationId = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2';
    const operationId = '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019';
    const request = {
      method: 'POST',
      url: `/api/v1/inventory/reservations/${reservationId}/release`,
      routeOptions: { url: '/api/v1/inventory/reservations/:id/release' },
      params: { id: reservationId },
    };
    const response = { getHeader: (name: string) => name.toLowerCase() === 'location' ? `/api/v1/inventory/reservations/${reservationId}` : undefined };

    expect(resourceReferenceForResponse('releaseInventoryReservation', operations.releaseInventoryReservation, request as never, response as never, { id: operationId }, 200)).toBeUndefined();
  });

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

  it('projects transition resources to their canonical resource href', async () => {
    let persistedResult: unknown;
    const repository = {
      execute: async (_input: unknown, work: (client: unknown, claim: unknown) => Promise<unknown>) => {
        persistedResult = await work({}, { commandId: 'command-transition', claimRole: 'OWNER' });
        return persistedResult;
      },
    };
    const interceptor = new IdempotencyExecutionInterceptor(repository as never);
    const orderId = '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019';
    const request = {
      method: 'POST',
      url: `/api/v1/orders/${orderId}/transitions`,
      routeOptions: { url: '/api/v1/orders/:id/transitions' },
      params: { id: orderId },
      query: {},
      body: { action: 'CONFIRM' },
      headers: { 'idempotency-key': 'transition-key', 'x-csrf-token': 'csrf-token-value', 'if-match': '"1"' },
      user: { id: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', organizationId: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' },
    };
    const response = { statusCode: 200, getHeader: () => undefined, header: () => response };
    const context = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) } as never;

    await lastValueFrom(interceptor.intercept(context, { handle: () => of({ id: orderId }) } as never));

    expect(persistedResult).toMatchObject({ resource: { type: 'ORDER', id: orderId, href: `/api/v1/orders/${orderId}` } });
  });

  it('projects inventory observations with a dedicated resource type', async () => {
    let persistedResult: unknown;
    const repository = {
      execute: async (_input: unknown, work: (client: unknown, claim: unknown) => Promise<unknown>) => {
        persistedResult = await work({}, { commandId: 'command-observation', claimRole: 'OWNER' });
        return persistedResult;
      },
    };
    const interceptor = new IdempotencyExecutionInterceptor(repository as never);
    const observationId = '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019';
    const request = {
      method: 'POST',
      url: '/api/v1/inventory/observations',
      routeOptions: { url: '/api/v1/inventory/observations' },
      params: {},
      query: {},
      body: { skuId: observationId, quantity: '1' },
      headers: { 'idempotency-key': 'observation-key', 'x-csrf-token': 'csrf-token-value' },
      user: { id: 'f8b6e3a9-3a0a-4c1c-b3f3-5d65d08c17e2', organizationId: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' },
    };
    const response = { statusCode: 201, getHeader: () => undefined, header: () => response };
    const context = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) } as never;

    await lastValueFrom(interceptor.intercept(context, { handle: () => of({ id: observationId }) } as never));

    expect(persistedResult).toMatchObject({ resource: { type: 'INVENTORY_OBSERVATION', id: observationId, href: `/api/v1/inventory/observations/${observationId}` } });
  });

  it('projects released reservations to the returned inventory operation href', async () => {
    let persistedResult: unknown;
    const repository = {
      execute: async (_input: unknown, work: (client: unknown, claim: unknown) => Promise<unknown>) => {
        persistedResult = await work({}, { commandId: 'command-release', claimRole: 'OWNER' });
        return persistedResult;
      },
    };
    const interceptor = new IdempotencyExecutionInterceptor(repository as never);
    const reservationId = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2';
    const operationId = '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019';
    const request = {
      method: 'POST',
      url: `/api/v1/inventory/reservations/${reservationId}/release`,
      routeOptions: { url: '/api/v1/inventory/reservations/:id/release' },
      params: { id: reservationId },
      query: {},
      body: { reason: 'manual' },
      headers: { 'idempotency-key': 'release-key', 'x-csrf-token': 'csrf-token-value', 'if-match': '"1"' },
      user: { id: reservationId, organizationId: operationId },
    };
    const response = { statusCode: 200, getHeader: () => undefined, header: () => response };
    const context = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) } as never;

    await lastValueFrom(interceptor.intercept(context, { handle: () => of({ id: operationId }) } as never));

    expect(persistedResult).toMatchObject({ resource: { type: 'INVENTORY_OPERATION', id: operationId, href: `/api/v1/inventory/operations/${operationId}` } });
  });

  it('projects reversed inventory operations to the new operation href', async () => {
    let persistedResult: unknown;
    const repository = {
      execute: async (_input: unknown, work: (client: unknown, claim: unknown) => Promise<unknown>) => {
        persistedResult = await work({}, { commandId: 'command-reverse', claimRole: 'OWNER' });
        return persistedResult;
      },
    };
    const interceptor = new IdempotencyExecutionInterceptor(repository as never);
    const sourceOperationId = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2';
    const reversalOperationId = '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019';
    const request = {
      method: 'POST',
      url: `/api/v1/inventory/operations/${sourceOperationId}/reverse`,
      routeOptions: { url: '/api/v1/inventory/operations/:operationId/reverse' },
      params: { operationId: sourceOperationId },
      query: {},
      body: { operationType: 'REVERSAL', lines: [{ skuId: sourceOperationId, quantity: '1' }] },
      headers: { 'idempotency-key': 'reverse-key', 'x-csrf-token': 'csrf-token-value', 'if-match': '"v1"' },
      user: { id: sourceOperationId, organizationId: reversalOperationId },
    };
    const response = { statusCode: 201, getHeader: () => undefined, header: () => response };
    const context = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) } as never;

    await lastValueFrom(interceptor.intercept(context, { handle: () => of({ id: reversalOperationId }) } as never));

    expect(persistedResult).toMatchObject({ resource: { type: 'INVENTORY_OPERATION', id: reversalOperationId, href: `/api/v1/inventory/operations/${reversalOperationId}` } });
  });
});
