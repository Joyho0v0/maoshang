import {
  CsrfTokenMissingError,
  SessionEpochChangedError,
  SessionRuntime,
} from './session-runtime';
import type {
  ContractAdapter,
  SessionBootstrapResponse,
  SessionUser,
} from './types';

function createUser(id: string): SessionUser {
  return { id, displayName: `User ${id}`, role: 'sales' };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createAdapter(overrides: Partial<ContractAdapter> = {}): ContractAdapter {
  const user = createUser('sales-1');
  return {
    bootstrap: async () => ({ authenticated: true, user, csrfToken: 'csrf-1' }),
    login: async () => ({ user, csrfToken: 'csrf-1' }),
    logout: async () => undefined,
    rotateCsrf: async () => ({ csrfToken: 'csrf-2' }),
    request: async () => ({ status: 200, data: { ok: true }, headers: {} }),
    ...overrides,
  };
}

describe('SessionRuntime', () => {
  it('cancels in-flight work and clears sensitive runtime state on epoch change', async () => {
    const requestDeferred = deferred<{
      status: number;
      data: { old: boolean };
      headers: Record<string, string>;
    }>();
    let requestSignal: AbortSignal | undefined;
    const adapter = createAdapter({
      request: async (_request, signal) => {
        requestSignal = signal;
        return requestDeferred.promise;
      },
    });
    const runtime = new SessionRuntime(adapter);
    await runtime.login({ email: 'sales@example.test', password: 'password' });
    runtime.queryCache.set('dashboard', { value: 'stale' }, runtime.snapshot.epoch);
    runtime.pendingCommands.add({
      id: 'command-1',
      idempotencyKey: 'idem-1',
      sessionEpoch: runtime.snapshot.epoch,
      status: 'in-flight',
      createdAt: 1,
    });

    const oldRequest = runtime.query('dashboard', {
      method: 'GET',
      href: '/api/v1/dashboard',
    });
    await Promise.resolve();
    const oldEpoch = runtime.snapshot.epoch;
    await runtime.logout();
    requestDeferred.resolve({ status: 200, data: { old: true }, headers: {} });

    await expect(oldRequest).rejects.toBeInstanceOf(SessionEpochChangedError);
    expect(requestSignal?.aborted).toBe(true);
    expect(runtime.snapshot.status).toBe('anonymous');
    expect(runtime.snapshot.epoch).toBe(oldEpoch + 1);
    expect(runtime.queryCache.get('dashboard')).toBeUndefined();
    expect(runtime.pendingCommands.list()).toHaveLength(0);
    expect(window.localStorage.length).toBe(0);
  });

  it('does not allow a response from an old epoch to refill the query cache', async () => {
    const responseDeferred = deferred<{
      status: number;
      data: { old: boolean };
      headers: Record<string, string>;
    }>();
    const runtime = new SessionRuntime(
      createAdapter({ request: async () => responseDeferred.promise }),
    );
    await runtime.login({ email: 'sales@example.test', password: 'password' });
    const oldRequest = runtime.query('customers', {
      method: 'GET',
      href: '/api/v1/customers',
    });
    await runtime.logout();
    responseDeferred.resolve({ status: 200, data: { old: true }, headers: {} });

    await expect(oldRequest).rejects.toBeInstanceOf(SessionEpochChangedError);
    expect(runtime.queryCache.get('customers')).toBeUndefined();
  });

  it('keeps csrf and pending command data in memory while supporting rotation', async () => {
    const runtime = new SessionRuntime(createAdapter());
    await runtime.login({ email: 'sales@example.test', password: 'password' });
    expect(runtime.snapshot.csrfToken).toBe('csrf-1');
    await runtime.rotateCsrf();
    expect(runtime.snapshot.csrfToken).toBe('csrf-2');
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });

  it('ignores a stale login response that arrives after logout changed the epoch', async () => {
    const loginDeferred = deferred<{ user: SessionUser; csrfToken: string }>();
    const runtime = new SessionRuntime(
      createAdapter({ login: async () => loginDeferred.promise }),
    );
    const login = runtime.login({ email: 'sales@example.test', password: 'password' });
    await Promise.resolve();

    await runtime.logout();
    loginDeferred.resolve({ user: createUser('stale-user'), csrfToken: 'stale-csrf' });
    await login;

    expect(runtime.snapshot.status).toBe('anonymous');
    expect(runtime.snapshot.user).toBeUndefined();
    expect(runtime.snapshot.csrfToken).toBeUndefined();
  });

  it('fails closed for default and explicit csrf-required mutations but allows explicit opt-out', async () => {
    const request = vi.fn(async () => ({ status: 200, data: { ok: true }, headers: {} }));
    const runtime = new SessionRuntime(createAdapter({ request }));

    await expect(
      runtime.request({ method: 'POST', href: '/api/v1/orders' }),
    ).rejects.toBeInstanceOf(CsrfTokenMissingError);
    await expect(
      runtime.request({ method: 'POST', href: '/api/v1/orders', requiresCsrf: true }),
    ).rejects.toBeInstanceOf(CsrfTokenMissingError);
    await expect(
      runtime.request({ method: 'POST', href: '/api/v1/orders', requiresCsrf: false }),
    ).resolves.toMatchObject({ status: 200 });

    expect(request).toHaveBeenCalledOnce();
  });

  it('refreshes csrf once and replays the same command identity and canonical body', async () => {
    const request = vi.fn()
      .mockRejectedValueOnce({
        type: 'urn:autoflow:problem:csrf-failed',
        title: 'CSRF failed',
        status: 403,
        code: 'CSRF_FAILED',
        requestId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
        retryable: true,
        meta: { refreshHref: '/api/v1/auth/csrf' },
      })
      .mockResolvedValue({ status: 200, data: { ok: true }, headers: {} });
    const rotateCsrf = vi.fn(async () => ({ csrfToken: 'c'.repeat(32) }));
    const runtime = new SessionRuntime(createAdapter({ request, rotateCsrf }));
    await runtime.login({ email: 'sales@example.test', password: 'password' });

    await expect(runtime.request({
      method: 'POST',
      href: '/api/v1/orders',
      body: { z: 1, a: 2 },
      idempotencyKey: 'idem-command-1',
      etag: '"v1"',
    })).resolves.toMatchObject({ status: 200 });

    expect(rotateCsrf).toHaveBeenCalledOnce();
    expect(request).toHaveBeenCalledTimes(2);
    const apiOrigin = new URL('/api/v1/orders', window.location.origin).origin;
    expect(request.mock.calls[0]?.[0]).toMatchObject({
      method: 'POST',
      href: `${apiOrigin}/api/v1/orders`,
      body: '{"a":2,"z":1}',
      headers: expect.objectContaining({
        'Idempotency-Key': 'idem-command-1',
        'If-Match': '"v1"',
        'X-CSRF-Token': 'csrf-1',
      }),
    });
    expect(request.mock.calls[1]?.[0]).toMatchObject({
      method: 'POST',
      href: `${apiOrigin}/api/v1/orders`,
      body: '{"a":2,"z":1}',
      headers: expect.objectContaining({
        'Idempotency-Key': 'idem-command-1',
        'If-Match': '"v1"',
        'X-CSRF-Token': 'c'.repeat(32),
      }),
    });
  });

  it('tracks a 202 command and recovers a terminal result with the same idempotency key', async () => {
    const commandRequest = {
      status: 202,
      data: {
        commandId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
        operationId: 'createOrder',
        state: 'IN_PROGRESS',
        startedAt: '2030-01-01T00:00:00.000Z',
        completedAt: null,
        expiresAt: '2030-01-01T00:05:00.000Z',
        retryAfterMs: 0,
        httpStatus: null,
        resource: null,
        resultHref: null,
        problem: null,
      },
      headers: {
        'X-Request-ID': 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
        'Retry-After': '1',
        'Cache-Control': 'no-store',
        'Content-Location': '/api/v1/commands/status',
      },
    };
    const statusResponse = {
      status: 200,
      data: {
        commandId: commandRequest.data.commandId,
        operationId: 'createOrder',
        state: 'SUCCEEDED',
        startedAt: '2030-01-01T00:00:00.000Z',
        completedAt: '2030-01-01T00:00:01.000Z',
        expiresAt: '2030-01-01T00:05:00.000Z',
        retryAfterMs: 0,
        httpStatus: 201,
        resource: {
          type: 'ORDER',
          id: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
          href: '/api/v1/orders/f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
        },
        resultHref: null,
        problem: null,
      },
      headers: {
        'X-Request-ID': 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
        'Cache-Control': 'no-store',
        'Idempotent-Replay': 'true',
        'Content-Location': '/api/v1/commands/status',
      },
    };
    const request = vi.fn()
      .mockResolvedValueOnce(commandRequest)
      .mockResolvedValueOnce(statusResponse)
      .mockResolvedValueOnce({ status: 200, data: { id: 'order-1' }, headers: {} });
    const runtime = new SessionRuntime(createAdapter({ request }));
    await runtime.login({ email: 'sales@example.test', password: 'password' });

    await runtime.executeCommand({
      method: 'POST',
      href: '/api/v1/orders',
      operationId: 'createOrder',
      body: { order: 'draft' },
      idempotencyKey: 'idem-order-1',
      etag: '"v1"',
    });
    const command = runtime.pendingCommands.list()[0];
    expect(command?.state).toBe('querying-status');

    await expect(runtime.recoverPendingCommand(command?.id ?? '')).resolves.toMatchObject({
      status: 200,
      data: { id: 'order-1' },
    });
    expect(runtime.pendingCommands.list()[0]).toMatchObject({
      state: 'succeeded',
      status: 'succeeded',
      idempotencyKey: 'idem-order-1',
    });
    expect(request.mock.calls[1]?.[0]).toMatchObject({
      href: `${new URL('/api/v1/commands/status', window.location.origin).origin}/api/v1/commands/status`,
      headers: expect.objectContaining({ 'X-Command-Operation': 'createOrder' }),
      idempotencyKey: 'idem-order-1',
    });
    expect(request.mock.calls[2]?.[0]).toMatchObject({
      href: `${new URL('/api/v1/orders/f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', window.location.origin).origin}/api/v1/orders/f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2`,
    });
  });

  it('ignores a stale login rejection after logout changed the epoch', async () => {
    const loginDeferred = deferred<{ user: SessionUser; csrfToken: string }>();
    const runtime = new SessionRuntime(
      createAdapter({ login: async () => loginDeferred.promise }),
    );
    const login = runtime.login({ email: 'sales@example.test', password: 'password' });
    await Promise.resolve();

    await runtime.logout();
    loginDeferred.reject(new Error('stale login failure'));
    await login;

    expect(runtime.snapshot.status).toBe('anonymous');
    expect(runtime.snapshot.epoch).toBe(1);
    expect(runtime.snapshot.problem).toBeUndefined();
  });

  it('ignores a stale bootstrap rejection after logout changed the epoch', async () => {
    const bootstrapDeferred = deferred<SessionBootstrapResponse>();
    const runtime = new SessionRuntime(
      createAdapter({ bootstrap: async () => bootstrapDeferred.promise }),
    );
    const bootstrap = runtime.bootstrap();
    await Promise.resolve();

    await runtime.logout();
    bootstrapDeferred.reject(new Error('stale bootstrap failure'));
    await bootstrap;

    expect(runtime.snapshot.status).toBe('anonymous');
    expect(runtime.snapshot.epoch).toBe(1);
    expect(runtime.snapshot.problem).toBeUndefined();
  });
});
