import {
  CsrfTokenMissingError,
  PendingCommandFailedError,
  SessionEpochChangedError,
  SessionRuntime,
} from './session-runtime';
import type {
  ContractAdapter,
  SessionBootstrapResponse,
  SessionUser,
} from './types';

function createUser(id: string): SessionUser {
  return { id, organizationId: `org-${id}`, displayName: `User ${id}`, role: 'sales' };
}

function createIdentity(id = 'sales-1', organizationId = 'org-1', authzVersion = 1, serverSessionEpoch = 1) {
  return {
    userId: id,
    organizationId,
    capabilities: ['dashboard.read'],
    scopeSummary: { organizationId },
    authzVersion,
    serverSessionEpoch,
  };
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
  const identity = createIdentity();
  return {
    bootstrap: async () => ({ authenticated: true, user, identity, csrfToken: 'csrf-1' }),
    login: async () => ({ user, identity, csrfToken: 'csrf-1' }),
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

  it('keeps identity context in the authenticated snapshot and does not clear on the same identity', async () => {
    const runtime = new SessionRuntime(createAdapter());
    await runtime.login({ email: 'sales@example.test', password: 'password' });
    const first = runtime.snapshot;
    runtime.queryCache.set('dashboard', { value: 'fresh' }, first.epoch);

    await runtime.login({ email: 'sales@example.test', password: 'password' });

    expect(runtime.snapshot.identity).toEqual(createIdentity());
    expect(runtime.snapshot.epoch).toBe(first.epoch);
    expect(runtime.queryCache.get('dashboard', first.epoch)).toEqual({ value: 'fresh' });
  });

  it('publishes session transitions to the Pinia-facing provider seam', async () => {
    const runtime = new SessionRuntime(createAdapter());
    const snapshots: string[] = [];
    const unsubscribe = runtime.subscribe((snapshot) => snapshots.push(snapshot.status));

    await runtime.login({ email: 'sales@example.test', password: 'password' });
    await runtime.logout();
    unsubscribe();

    expect(snapshots).toEqual(['bootstrapping', 'authenticated', 'logging-out', 'anonymous']);
  });

  it('advances identity epoch and isolates in-flight work when server identity changes', async () => {
    const requestDeferred = deferred<{ status: number; data: { old: boolean }; headers: Record<string, string> }>();
    const login = vi.fn()
      .mockResolvedValueOnce({ user: createUser('sales-1'), identity: createIdentity(), csrfToken: 'csrf-1' })
      .mockResolvedValueOnce({
        user: createUser('sales-2'),
        identity: createIdentity('sales-2', 'org-2', 2, 2),
        csrfToken: 'csrf-2',
      });
    let requestSignal: AbortSignal | undefined;
    const runtime = new SessionRuntime(createAdapter({
      login,
      request: async (_request, signal) => {
        requestSignal = signal;
        return requestDeferred.promise;
      },
    }));
    await runtime.login({ email: 'sales@example.test', password: 'password' });
    runtime.queryCache.set('dashboard', { value: 'old' }, runtime.snapshot.epoch);
    runtime.pendingCommands.add({ id: 'command-identity', idempotencyKey: 'idem', sessionEpoch: runtime.snapshot.epoch, status: 'in-flight', createdAt: 1 });

    const oldRequest = runtime.query('dashboard', { method: 'GET', href: '/api/v1/dashboard' });
    await Promise.resolve();
    const oldEpoch = runtime.snapshot.epoch;
    await runtime.login({ email: 'new@example.test', password: 'password' });
    requestDeferred.resolve({ status: 200, data: { old: true }, headers: {} });

    await expect(oldRequest).rejects.toBeInstanceOf(SessionEpochChangedError);
    expect(requestSignal?.aborted).toBe(true);
    expect(runtime.snapshot).toMatchObject({ status: 'authenticated', epoch: oldEpoch + 1, user: { id: 'sales-2' } });
    expect(runtime.snapshot.identity).toEqual(createIdentity('sales-2', 'org-2', 2, 2));
    expect(runtime.queryCache.get('dashboard')).toBeUndefined();
    expect(runtime.pendingCommands.list()).toHaveLength(0);
    expect(runtime.snapshot.csrfToken).toBe('csrf-2');
  });

  it('clears an authenticated session exactly once when an API request reports session expiry', async () => {
    const request = vi.fn().mockRejectedValue({
      type: 'urn:autoflow:problem:authentication-required',
      title: 'Authentication required',
      status: 401,
      code: 'SESSION_EXPIRED',
    });
    const runtime = new SessionRuntime(createAdapter({ request }));
    await runtime.login({ email: 'sales@example.test', password: 'password' });
    runtime.queryCache.set('private', { secret: true }, runtime.snapshot.epoch);
    runtime.pendingCommands.add({ id: 'command-401', idempotencyKey: 'idem', sessionEpoch: runtime.snapshot.epoch, status: 'in-flight', createdAt: 1 });
    const epoch = runtime.snapshot.epoch;

    await expect(runtime.request({ method: 'GET', href: '/api/v1/customers' })).rejects.toMatchObject({ status: 401 });

    expect(runtime.snapshot).toMatchObject({ status: 'anonymous', epoch: epoch + 1 });
    expect(runtime.snapshot.csrfToken).toBeUndefined();
    expect(runtime.queryCache.get('private')).toBeUndefined();
    expect(runtime.pendingCommands.list()).toHaveLength(0);
  });

  it('aborts concurrent requests and rejects a late response after one request expires the session', async () => {
    const secondRequest = deferred<{ status: number; data: { old: boolean }; headers: Record<string, string> }>();
    const request = vi.fn()
      .mockRejectedValueOnce({ type: 'about:blank', title: 'Expired', status: 401, code: 'AUTHENTICATION_REQUIRED' })
      .mockImplementationOnce(async (_request: unknown, signal: AbortSignal) => {
        signal.addEventListener('abort', () => undefined);
        return secondRequest.promise;
      });
    const runtime = new SessionRuntime(createAdapter({ request }));
    await runtime.login({ email: 'sales@example.test', password: 'password' });

    const expired = runtime.request({ method: 'GET', href: '/api/v1/customers' });
    const late = runtime.query('private', { method: 'GET', href: '/api/v1/orders' });
    await expect(expired).rejects.toMatchObject({ status: 401 });
    secondRequest.resolve({ status: 200, data: { old: true }, headers: {} });

    await expect(late).rejects.toBeInstanceOf(SessionEpochChangedError);
    expect(runtime.snapshot.status).toBe('anonymous');
    expect(runtime.queryCache.get('private')).toBeUndefined();
  });

  it('does not treat login credentials failure as a session epoch change', async () => {
    const login = vi.fn()
      .mockResolvedValueOnce({ user: createUser('sales-1'), identity: createIdentity(), csrfToken: 'csrf-1' })
      .mockRejectedValueOnce({ type: 'about:blank', title: 'Invalid credentials', status: 401, code: 'INVALID_CREDENTIALS' });
    const runtime = new SessionRuntime(createAdapter({ login }));
    await runtime.login({ email: 'sales@example.test', password: 'password' });
    const epoch = runtime.snapshot.epoch;

    await runtime.login({ email: 'wrong@example.test', password: 'wrong' });

    expect(runtime.snapshot.epoch).toBe(epoch);
    expect(runtime.snapshot.status).toBe('authenticated');
    expect(runtime.snapshot.identity).toEqual(createIdentity());
    expect(runtime.snapshot.csrfToken).toBe('csrf-1');
  });

  it('ignores a stale login response that arrives after logout changed the epoch', async () => {
    const loginDeferred = deferred<{ user: SessionUser; identity: ReturnType<typeof createIdentity>; csrfToken: string }>();
    const runtime = new SessionRuntime(
      createAdapter({ login: async () => loginDeferred.promise }),
    );
    const login = runtime.login({ email: 'sales@example.test', password: 'password' });
    await Promise.resolve();

    await runtime.logout();
    loginDeferred.resolve({ user: createUser('stale-user'), identity: createIdentity('stale-user', 'org-stale'), csrfToken: 'stale-csrf' });
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

  it('records stable replay failures as terminal failed commands', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ status: 202, data: { accepted: true }, headers: {} })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          commandId: 'command-stable', operationId: 'createOrder', state: 'RECOVERY_REQUIRED',
          startedAt: '2030-01-01T00:00:00.000Z', completedAt: null, expiresAt: '2030-01-01T00:05:00.000Z',
          retryAfterMs: 0, httpStatus: null, resource: null, resultHref: null, problem: null,
        },
        headers: {},
      })
      .mockRejectedValueOnce({
        type: 'urn:autoflow:problem:version-conflict', title: 'Version conflict', status: 409,
        code: 'VERSION_CONFLICT', meta: { currentEtag: '"v2"' },
      });
    const runtime = new SessionRuntime(createAdapter({ request }));
    await runtime.login({ email: 'sales@example.test', password: 'password' });
    await runtime.executeCommand({ method: 'POST', href: '/api/v1/orders', operationId: 'createOrder', body: { order: 'draft' }, idempotencyKey: 'idem-stable', etag: '"v1"' });
    const commandId = runtime.pendingCommands.list()[0]?.id ?? '';

    await expect(runtime.recoverPendingCommand(commandId)).rejects.toMatchObject({ status: 409 });
    expect(runtime.pendingCommands.get(commandId)).toMatchObject({ status: 'failed', state: 'failed-stable', idempotencyKey: 'idem-stable', etag: '"v1"' });
    await expect(runtime.recoverPendingCommand(commandId)).rejects.toBeInstanceOf(PendingCommandFailedError);
    expect(request).toHaveBeenCalledTimes(3);
  });

  it('replays a command-not-found result with the exact original identity', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ status: 202, data: { accepted: true }, headers: {} })
      .mockRejectedValueOnce({ type: 'about:blank', title: 'Command not found', status: 404, code: 'COMMAND_NOT_FOUND' })
      .mockResolvedValueOnce({ status: 201, data: { id: 'order-1' }, headers: {} });
    const runtime = new SessionRuntime(createAdapter({ request }));
    await runtime.login({ email: 'sales@example.test', password: 'password' });
    await runtime.executeCommand({ method: 'POST', href: '/api/v1/orders', operationId: 'createOrder', body: { z: 1, a: 2 }, idempotencyKey: 'idem-not-found', etag: '"v1"' });
    const commandId = runtime.pendingCommands.list()[0]?.id ?? '';

    await expect(runtime.recoverPendingCommand(commandId)).resolves.toMatchObject({ status: 201 });
    expect(request.mock.calls[2]?.[0]).toMatchObject({
      method: 'POST',
      operationId: 'createOrder',
      href: expect.stringContaining('/api/v1/orders'),
      body: '{"a":2,"z":1}',
      idempotencyKey: 'idem-not-found',
      etag: '"v1"',
    });
    expect(runtime.pendingCommands.get(commandId)).toMatchObject({ status: 'succeeded', state: 'succeeded' });
  });

  it('records a terminal recovery-window expiry without replaying a command', async () => {
    let now = 100;
    const request = vi.fn().mockResolvedValueOnce({ status: 202, data: { accepted: true }, headers: {} });
    const runtime = new SessionRuntime(createAdapter({ request }), { now: () => now, recoveryWindowMs: 10 });
    await runtime.login({ email: 'sales@example.test', password: 'password' });
    await runtime.executeCommand({ method: 'POST', href: '/api/v1/orders', operationId: 'createOrder', body: { order: 'draft' }, idempotencyKey: 'idem-expired' });
    const commandId = runtime.pendingCommands.list()[0]?.id ?? '';
    now = 111;

    await expect(runtime.recoverPendingCommand(commandId)).rejects.toThrow('recovery window has expired');
    expect(runtime.pendingCommands.get(commandId)).toMatchObject({ status: 'failed', state: 'failed-stable', idempotencyKey: 'idem-expired' });
    expect(request).toHaveBeenCalledOnce();
  });

  it('keeps an unavailable replay result recoverable while making a command failure terminal', async () => {
    const failedRequest = vi.fn()
      .mockResolvedValueOnce({ status: 202, data: { accepted: true }, headers: {} })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          commandId: 'command-failed', operationId: 'createOrder', state: 'FAILED',
          startedAt: '2030-01-01T00:00:00.000Z', completedAt: '2030-01-01T00:00:01.000Z', expiresAt: '2030-01-01T00:05:00.000Z',
          retryAfterMs: 0, httpStatus: 409, resource: null, resultHref: null,
          problem: { type: 'about:blank', title: 'Version conflict', status: 409, code: 'VERSION_CONFLICT' },
        },
        headers: {},
      });
    const failedRuntime = new SessionRuntime(createAdapter({ request: failedRequest }));
    await failedRuntime.login({ email: 'sales@example.test', password: 'password' });
    await failedRuntime.executeCommand({ method: 'POST', href: '/api/v1/orders', operationId: 'createOrder', body: { order: 'draft' }, idempotencyKey: 'idem-failed' });
    const failedId = failedRuntime.pendingCommands.list()[0]?.id ?? '';
    await expect(failedRuntime.recoverPendingCommand(failedId)).rejects.toMatchObject({ problem: { code: 'VERSION_CONFLICT' } });
    expect(failedRuntime.pendingCommands.get(failedId)).toMatchObject({ status: 'failed', state: 'failed-stable' });

    const unavailableRequest = vi.fn()
      .mockResolvedValueOnce({ status: 202, data: { accepted: true }, headers: {} })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          commandId: 'command-unavailable', operationId: 'createOrder', state: 'RECOVERY_REQUIRED',
          startedAt: '2030-01-01T00:00:00.000Z', completedAt: null, expiresAt: '2030-01-01T00:05:00.000Z',
          retryAfterMs: 0, httpStatus: null, resource: null, resultHref: null, problem: null,
        },
        headers: {},
      })
      .mockRejectedValueOnce({ type: 'about:blank', title: 'Unavailable', status: 503, code: 'SERVICE_UNAVAILABLE' });
    const unavailableRuntime = new SessionRuntime(createAdapter({ request: unavailableRequest }));
    await unavailableRuntime.login({ email: 'sales@example.test', password: 'password' });
    await unavailableRuntime.executeCommand({ method: 'POST', href: '/api/v1/orders', operationId: 'createOrder', body: { order: 'draft' }, idempotencyKey: 'idem-unavailable' });
    const unavailableId = unavailableRuntime.pendingCommands.list()[0]?.id ?? '';
    await expect(unavailableRuntime.recoverPendingCommand(unavailableId)).rejects.toMatchObject({ status: 503 });
    expect(unavailableRuntime.pendingCommands.get(unavailableId)).toMatchObject({ status: 'in-flight', state: 'result-unknown' });
  });

  it('requires an explicit operation identity for commands and bounds a stalled request', async () => {
    const runtime = new SessionRuntime(createAdapter({ request: async (_request, signal) => await new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    }) }), { requestTimeoutMs: 10 });
    await runtime.login({ email: 'sales@example.test', password: 'password' });

    await expect(runtime.executeCommand({ method: 'POST', href: '/api/v1/orders', body: { order: 'draft' } })).rejects.toThrow('operationId');
    await expect(runtime.request({ method: 'GET', href: '/api/v1/customers' })).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' });
    await expect(runtime.executeCommand({ method: 'POST', href: '/api/v1/orders', operationId: 'createOrder', body: { order: 'draft' }, idempotencyKey: 'idem-timeout' })).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' });
    expect(runtime.pendingCommands.list()).toEqual([expect.objectContaining({ status: 'in-flight', state: 'result-unknown', problem: expect.objectContaining({ code: 'REQUEST_TIMEOUT' }) })]);
  });

  it('ignores a stale login rejection after logout changed the epoch', async () => {
    const loginDeferred = deferred<{ user: SessionUser; identity: ReturnType<typeof createIdentity>; csrfToken: string }>();
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
