import {
  IdempotencyConflictError,
  InMemoryIdempotencyStore,
} from '../../apps/api/src/modules/integration/idempotency/in-memory-idempotency-store.js';

describe('idempotency claim and replay foundation', () => {
  it('executes one business callback for concurrent identical commands', async () => {
    const store = new InMemoryIdempotencyStore({ leaseMs: 250 });
    let executions = 0;

    const execute = () => store.execute({
      actorId: 'actor-1',
      organizationId: 'org-1',
      operationId: 'createCustomer',
      idempotencyKey: 'same-key',
      requestHash: 'same-request',
      run: async () => {
        executions += 1;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { status: 201, body: { id: 'customer-1' } };
      },
    });

    const results = await Promise.all(Array.from({ length: 20 }, execute));

    expect(executions).toBe(1);
    expect(new Set(results.map((result) => JSON.stringify(result))).size).toBe(1);
    expect(results[0]).toMatchObject({ status: 201, body: { id: 'customer-1' } });
  });

  it('rejects key reuse with a different canonical request hash', async () => {
    const store = new InMemoryIdempotencyStore();
    await store.execute({
      actorId: 'actor-1', organizationId: 'org-1', operationId: 'createCustomer',
      idempotencyKey: 'same-key', requestHash: 'request-a',
      run: async () => ({ status: 201, body: { id: 'customer-1' } }),
    });

    await expect(store.execute({
      actorId: 'actor-1', organizationId: 'org-1', operationId: 'createCustomer',
      idempotencyKey: 'same-key', requestHash: 'request-b',
      run: async () => ({ status: 201, body: { id: 'customer-2' } }),
    })).rejects.toBeInstanceOf(IdempotencyConflictError);
  });

  it('exposes an explicit recovery state when a lease expires', async () => {
    const store = new InMemoryIdempotencyStore({ leaseMs: 5 });
    const pending = store.claim({
      actorId: 'actor-1', organizationId: 'org-1', operationId: 'reverseInventoryOperation',
      idempotencyKey: 'recover-key', requestHash: 'request-a',
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(store.status(pending.commandId)).toMatchObject({ state: 'RECOVERY_REQUIRED' });
    expect(store.takeover(pending.commandId)).toMatchObject({ state: 'IN_PROGRESS' });
  });

  it('replays terminal claims without incrementing attempts or re-executing work', async () => {
    const store = new InMemoryIdempotencyStore();
    const claimed = store.claim({
      actorId: 'actor-1', organizationId: 'org-1', operationId: 'createCustomer',
      idempotencyKey: 'terminal-key', requestHash: 'request-a',
    });
    await store.complete(claimed.commandId, { status: 201, body: { id: 'customer-1' } });

    expect(store.claim({
      actorId: 'actor-1', organizationId: 'org-1', operationId: 'createCustomer',
      idempotencyKey: 'terminal-key', requestHash: 'request-a',
    })).toMatchObject({ commandId: claimed.commandId, state: 'SUCCEEDED', attemptCount: 1 });
  });

  it('keeps transient callback failures recoverable instead of persisting FAILED', async () => {
    const store = new InMemoryIdempotencyStore({ leaseMs: 5 });
    await expect(store.execute({
      actorId: 'actor-1', organizationId: 'org-1', operationId: 'createCustomer',
      idempotencyKey: 'transient-key', requestHash: 'request-a',
      run: async () => { throw new Error('database connection reset'); },
    })).rejects.toThrow('database connection reset');

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(store.statusByKey({ actorId: 'actor-1', organizationId: 'org-1', operationId: 'createCustomer', idempotencyKey: 'transient-key' })).toMatchObject({ state: 'RECOVERY_REQUIRED' });
  });

  it('stores only a SHA-256 key digest and exposes a complete four-state status', () => {
    const store = new InMemoryIdempotencyStore();
    const claimed = store.claim({
      actorId: 'actor-1', organizationId: 'org-1', operationId: 'createCustomer',
      idempotencyKey: 'sensitive-key', requestHash: 'request-a',
    });
    expect(store.debugRecord(claimed.commandId)).toEqual(expect.objectContaining({ keyHash: expect.stringMatching(/^[0-9a-f]{64}$/) }));
    expect(store.status(claimed.commandId)).toMatchObject({
      commandId: claimed.commandId,
      operationId: 'createCustomer',
      state: 'IN_PROGRESS',
      completedAt: null,
      httpStatus: null,
      resultHref: null,
      problem: null,
    });
  });
});
