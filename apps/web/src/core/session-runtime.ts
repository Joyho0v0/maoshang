import { ApiProblemError } from '../../../../packages/contracts/openapi/client.js';
import { QueryClient } from '@tanstack/vue-query';
import { assertSafeApiHref, createIdempotencyKey, createRequestHeaders, createRequestId, stableStringify } from './security';
import type {
  ApiRequest,
  ContractAdapter,
  HttpResponse,
  CommandExecutionResponse,
  LoginInput,
  PendingCommand,
  ProblemDetails,
  SessionIdentity,
  SessionSnapshot,
  SessionUser,
} from './types';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const DEFAULT_RECOVERY_WINDOW_MS = 60_000;

export class SessionEpochChangedError extends Error {
  constructor() {
    super('The session epoch changed while the request was in flight.');
    this.name = 'SessionEpochChangedError';
  }
}

export class CsrfTokenMissingError extends Error {
  readonly code = 'CSRF_TOKEN_MISSING';

  constructor() {
    super('A CSRF token is required before this request can be sent.');
    this.name = 'CsrfTokenMissingError';
  }
}

export class RequestTimeoutError extends Error {
  readonly code = 'REQUEST_TIMEOUT';

  constructor() {
    super('The API request exceeded its bounded timeout.');
    this.name = 'RequestTimeoutError';
  }
}

export class PendingCommandNotFoundError extends Error {
  constructor(commandId: string) {
    super(`Pending command not found: ${commandId}`);
    this.name = 'PendingCommandNotFoundError';
  }
}

export class PendingCommandRecoveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PendingCommandRecoveryError';
  }
}

export class PendingCommandFailedError extends Error {
  constructor(readonly problem: ProblemDetails) {
    super(problem.title);
    this.name = 'PendingCommandFailedError';
  }
}

export class QueryCache {
  private readonly namespace = 'session-runtime';

  constructor(private readonly queryClient: QueryClient) {}

  set<T>(key: string, value: T, epoch: number): void {
    this.queryClient.setQueryData([this.namespace, key], { epoch, value });
  }

  get<T>(key: string, epoch?: number): T | undefined {
    const entry = this.queryClient.getQueryData<{ epoch: number; value: unknown }>([this.namespace, key]);
    if (entry === undefined || (epoch !== undefined && entry.epoch !== epoch)) return undefined;
    return entry.value as T;
  }

  clear(): void {
    this.queryClient.clear();
  }
}

export class PendingCommandStore {
  private readonly commands = new Map<string, PendingCommand>();

  add(command: PendingCommand): void {
    this.commands.set(command.id, { ...command });
  }

  get(id: string): PendingCommand | undefined {
    const command = this.commands.get(id);
    return command === undefined ? undefined : { ...command };
  }

  findByIdempotencyKey(idempotencyKey: string): PendingCommand | undefined {
    const command = [...this.commands.values()].find((candidate) => candidate.idempotencyKey === idempotencyKey);
    return command === undefined ? undefined : { ...command };
  }

  update(id: string, patch: Partial<PendingCommand>): PendingCommand | undefined {
    const current = this.commands.get(id);
    if (current === undefined) return undefined;
    const updated = { ...current, ...patch };
    this.commands.set(id, updated);
    return { ...updated };
  }

  list(): PendingCommand[] {
    return [...this.commands.values()].map((command) => ({ ...command }));
  }

  clear(): void {
    this.commands.clear();
  }
}

class MemorySensitiveStore {
  private readonly values = new Map<string, string>();

  set(key: string, value: string): void {
    this.values.set(key, value);
  }

  get(key: string): string | undefined {
    return this.values.get(key);
  }

  clear(): void {
    this.values.clear();
  }
}

export interface SessionRuntimeOptions {
  readonly now?: () => number;
  readonly recoveryWindowMs?: number;
  readonly requestTimeoutMs?: number;
  readonly sleep?: (milliseconds: number) => Promise<void>;
}

export type SessionSnapshotListener = (snapshot: SessionSnapshot) => void;

export class SessionRuntime {
  readonly queryClient: QueryClient;
  readonly queryCache: QueryCache;
  readonly pendingCommands = new PendingCommandStore();

  private state: SessionSnapshot = { status: 'anonymous', epoch: 0 };
  private identityFingerprint: string | undefined;
  private readonly sensitive = new MemorySensitiveStore();
  private readonly activeRequests = new Set<AbortController>();
  private readonly now: () => number;
  private readonly recoveryWindowMs: number;
  private readonly requestTimeoutMs: number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly listeners = new Set<SessionSnapshotListener>();

  constructor(
    private readonly adapter: ContractAdapter,
    options: SessionRuntimeOptions = {},
  ) {
    this.now = options.now ?? (() => Date.now());
    this.recoveryWindowMs = options.recoveryWindowMs ?? DEFAULT_RECOVERY_WINDOW_MS;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 30_000;
    this.sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
    this.queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    this.queryCache = new QueryCache(this.queryClient);
  }

  get snapshot(): SessionSnapshot {
    const snapshot: SessionSnapshot = { ...this.state };
    const csrfToken = this.sensitive.get('csrfToken');
    if (csrfToken) snapshot.csrfToken = csrfToken;
    return snapshot;
  }

  subscribe(listener: SessionSnapshotListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async bootstrap(): Promise<SessionSnapshot> {
    const operationEpoch = this.state.epoch;
    const controller = this.trackRequest();
    this.setState({ status: 'bootstrapping', epoch: operationEpoch });
    try {
      const response = await this.adapter.bootstrap(controller.signal);
      if (this.state.epoch !== operationEpoch) return this.snapshot;
      if (response.authenticated && response.user && response.csrfToken) {
        this.activateSession(response.user, response.identity, response.csrfToken);
      } else {
        this.transitionToAnonymous();
      }
    } catch (error) {
      if (this.state.epoch !== operationEpoch) return this.snapshot;
      this.setState({ status: 'error', epoch: this.state.epoch, problem: toProblem(error) });
    } finally {
      this.activeRequests.delete(controller);
    }
    return this.snapshot;
  }

  async login(input: LoginInput): Promise<SessionSnapshot> {
    const operationEpoch = this.state.epoch;
    const previousState = this.state;
    const controller = this.trackRequest();
    this.setState({ status: 'bootstrapping', epoch: operationEpoch });
    try {
      const credentials = await this.adapter.login(input, controller.signal);
      if (this.state.epoch !== operationEpoch) return this.snapshot;
      this.activateSession(credentials.user, credentials.identity, credentials.csrfToken);
    } catch (error) {
      if (this.state.epoch !== operationEpoch) return this.snapshot;
      if (previousState.status === 'authenticated' && this.identityFingerprint !== undefined) {
        this.setState(previousState);
      } else {
        this.setState({ status: 'error', epoch: this.state.epoch, problem: toProblem(error) });
      }
    } finally {
      this.activeRequests.delete(controller);
    }
    return this.snapshot;
  }

  async logout(): Promise<SessionSnapshot> {
    const operationEpoch = this.state.epoch;
    const controller = this.trackRequest();
    this.setState({ status: 'logging-out', epoch: operationEpoch });
    let failure: unknown;
    try {
      await this.adapter.logout(controller.signal, this.sensitive.get('csrfToken'));
    } catch (error) {
      failure = error;
    } finally {
      if (this.state.epoch === operationEpoch) this.transitionToAnonymous();
      this.activeRequests.delete(controller);
    }
    if (failure && this.state.epoch === operationEpoch) throw failure;
    return this.snapshot;
  }

  async rotateCsrf(): Promise<SessionSnapshot> {
    const operationEpoch = this.state.epoch;
    const controller = this.trackRequest();
    try {
      return await this.rotateCsrfWithDeadline(
        operationEpoch,
        controller.signal,
        Date.now() + this.requestTimeoutMs,
      );
    } finally {
      this.activeRequests.delete(controller);
    }
  }

  async request<T>(request: ApiRequest): Promise<HttpResponse<T>> {
    const epoch = this.state.epoch;
    const controller = this.trackRequest();
    const deadline = Date.now() + this.requestTimeoutMs;
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.requestTimeoutMs);
    let csrfReplayUsed = false;
    try {
      while (true) {
        try {
          const prepared = this.prepareRequest(request);
          const response = await this.adapter.request(prepared, controller.signal);
          if (timedOut) throw new RequestTimeoutError();
          if (this.state.epoch !== epoch) throw new SessionEpochChangedError();
          return response as HttpResponse<T>;
        } catch (error) {
          if (timedOut) throw new RequestTimeoutError();
          if (this.state.epoch !== epoch) throw new SessionEpochChangedError();
          if (isSessionInvalidation(error) && this.state.status === 'authenticated') {
            this.transitionToAnonymous();
            throw error;
          }
          if (!csrfReplayUsed && isCsrfFailure(error)) {
            csrfReplayUsed = true;
            await this.rotateCsrfWithDeadline(epoch, controller.signal, deadline);
            continue;
          }
          throw error;
        }
      }
    } finally {
      clearTimeout(timeoutId);
      this.activeRequests.delete(controller);
    }
  }

  async query<T>(key: string, request: ApiRequest): Promise<T> {
    const epoch = this.state.epoch;
    const response = await this.request<T>(request);
    if (this.state.epoch !== epoch) throw new SessionEpochChangedError();
    this.queryCache.set(key, response.data, epoch);
    return response.data;
  }

  async executeCommand(request: ApiRequest): Promise<CommandExecutionResponse<unknown>> {
    if (request.operationId === undefined) throw new Error('operationId is required for command execution.');
    const idempotencyKey = request.idempotencyKey ?? createIdempotencyKey();
    const command: PendingCommand = {
      id: createRequestId(),
      idempotencyKey,
      sessionEpoch: this.state.epoch,
      status: 'in-flight',
      state: 'submitting',
      ...(request.operationId === undefined ? {} : { operationId: request.operationId }),
      method: request.method,
      href: request.href,
      ...(request.body === undefined ? {} : { canonicalBody: canonicalBody(request.body) }),
      ...(request.etag === undefined ? {} : { etag: request.etag }),
      createdAt: this.now(),
      recoveryDeadline: this.now() + this.recoveryWindowMs,
    };
    this.pendingCommands.add(command);
    try {
      const response = await this.request({ ...request, idempotencyKey });
      const requestId = response.headers['X-Request-ID'] ?? response.headers['X-Request-Id'];
      this.pendingCommands.update(command.id, {
        ...(requestId === undefined ? {} : { requestId }),
        status: response.status === 202 ? 'in-flight' : 'succeeded',
        state: response.status === 202 ? 'querying-status' : 'succeeded',
      });
      return { ...response, commandId: command.id };
    } catch (error) {
      if (this.state.epoch !== command.sessionEpoch) throw new SessionEpochChangedError();
      const problem = toProblem(error);
      if (isResultUnknownFailure(error, problem)) {
        this.pendingCommands.update(command.id, {
          status: 'in-flight',
          state: 'result-unknown',
          problem,
        });
      } else {
        this.pendingCommands.update(command.id, {
          status: 'failed',
          state: 'failed-stable',
          problem,
        });
      }
      throw error;
    }
  }

  async recoverPendingCommand(commandId: string): Promise<HttpResponse<unknown>> {
    const stored = this.pendingCommands.get(commandId);
    if (stored === undefined) throw new PendingCommandNotFoundError(commandId);
    if (stored.status === 'failed' && stored.problem !== undefined) {
      throw new PendingCommandFailedError(stored.problem);
    }
    if (stored.sessionEpoch !== this.state.epoch) throw new SessionEpochChangedError();
    if (stored.recoveryDeadline !== undefined && this.now() > stored.recoveryDeadline) {
      this.markRecoveryWindowExpired(commandId);
      throw new PendingCommandRecoveryError('The pending command recovery window has expired.');
    }
    if (stored.operationId === undefined || stored.href === undefined || stored.method === undefined) {
      throw new PendingCommandRecoveryError('The pending command snapshot is incomplete.');
    }

    this.pendingCommands.update(commandId, { status: 'in-flight', state: 'querying-status' });
    try {
      while (true) {
        const statusResponse = await this.request({
          method: 'GET',
          href: '/api/v1/commands/status',
          operationId: 'getCommandStatus',
          idempotencyKey: stored.idempotencyKey,
          requiresCsrf: false,
          headers: { 'X-Command-Operation': stored.operationId },
        });
        const status = parseCommandStatus(statusResponse.data, stored.operationId);
        if (status.state === 'IN_PROGRESS') {
          this.pendingCommands.update(commandId, { state: 'in-progress' });
          const delay = status.retryAfterMs > 0 ? status.retryAfterMs : parseRetryAfter(statusResponse.headers);
          if (this.now() + delay > (stored.recoveryDeadline ?? this.now())) {
            this.markRecoveryWindowExpired(commandId);
            throw new PendingCommandRecoveryError('The pending command recovery window has expired.');
          }
          await this.sleep(delay);
          continue;
        }
        if (status.state === 'RECOVERY_REQUIRED') {
          return this.replayPendingCommand(stored);
        }
        if (status.state === 'FAILED') {
          const problem = toProblem(status.problem);
          this.pendingCommands.update(commandId, { status: 'failed', state: 'failed-stable', problem });
          throw new PendingCommandFailedError(problem);
        }
        const href = status.resource?.href ?? status.resultHref;
        if (href === null || href === undefined) {
          throw new PendingCommandRecoveryError('The command succeeded without an authoritative resource reference.');
        }
        const authoritative = await this.request({ method: 'GET', href, requiresCsrf: false });
        this.pendingCommands.update(commandId, { status: 'succeeded', state: 'succeeded' });
        return authoritative;
      }
    } catch (error) {
      const problem = toProblem(error);
      if (problem.status === 404 && problem.code === 'COMMAND_NOT_FOUND') {
        const current = this.pendingCommands.get(commandId);
        if (current?.recoveryAttempts === 0 || current?.recoveryAttempts === undefined) {
          this.pendingCommands.update(commandId, {
            state: 'command-not-found',
            recoveryAttempts: (current?.recoveryAttempts ?? 0) + 1,
          });
          return this.replayPendingCommand({ ...stored, recoveryAttempts: 1 });
        }
      }
      if (this.state.epoch !== stored.sessionEpoch) throw new SessionEpochChangedError();
      const current = this.pendingCommands.get(commandId);
      if (
        error instanceof PendingCommandRecoveryError
        && current?.status === 'failed'
        && current.state === 'failed-stable'
        && current.problem?.code === 'RECOVERY_WINDOW_EXPIRED'
      ) {
        throw error;
      }
      this.pendingCommands.update(commandId, {
        status: isResultUnknownFailure(error, problem) ? 'in-flight' : 'failed',
        state: isResultUnknownFailure(error, problem) ? 'result-unknown' : 'failed-stable',
        problem,
      });
      throw error;
    }
  }

  private async replayPendingCommand(command: PendingCommand): Promise<HttpResponse<unknown>> {
    if (command.recoveryDeadline !== undefined && this.now() > command.recoveryDeadline) {
      this.markRecoveryWindowExpired(command.id);
      throw new PendingCommandRecoveryError('The pending command recovery window has expired.');
    }
    if (command.href === undefined || command.method === undefined) {
      throw new PendingCommandRecoveryError('The pending command snapshot is incomplete.');
    }
    this.pendingCommands.update(command.id, { state: 'replaying-same-command', status: 'in-flight' });
    try {
      const response = await this.request({
        method: command.method,
        href: command.href,
        ...(command.operationId === undefined ? {} : { operationId: command.operationId }),
        ...(command.canonicalBody === undefined ? {} : { body: JSON.parse(command.canonicalBody) as unknown }),
        ...(command.etag === undefined ? {} : { etag: command.etag }),
        idempotencyKey: command.idempotencyKey,
      });
      this.pendingCommands.update(command.id, {
        status: response.status === 202 ? 'in-flight' : 'succeeded',
        state: response.status === 202 ? 'querying-status' : 'succeeded',
      });
      return response;
    } catch (error) {
      const problem = toProblem(error);
      this.pendingCommands.update(command.id, {
        status: isResultUnknownFailure(error, problem) ? 'in-flight' : 'failed',
        state: isResultUnknownFailure(error, problem) ? 'result-unknown' : 'failed-stable',
        problem,
      });
      throw error;
    }
  }

  private prepareRequest(request: ApiRequest): ApiRequest {
    const appOrigin = typeof location === 'undefined' ? 'http://localhost' : location.origin;
    const headerOptions = { requestId: createRequestId() } as Parameters<typeof createRequestHeaders>[0];
    const requiresCsrf = request.requiresCsrf ?? MUTATING_METHODS.has(request.method.toUpperCase());
    const csrfToken = this.sensitive.get('csrfToken');
    if (requiresCsrf && !csrfToken) throw new CsrfTokenMissingError();
    if (csrfToken) headerOptions.csrfToken = csrfToken;
    if (request.idempotencyKey) headerOptions.idempotencyKey = request.idempotencyKey;
    if (request.etag) headerOptions.etag = request.etag;

    const prepared: ApiRequest = {
      ...request,
      href: assertSafeApiHref(request.href, appOrigin),
      headers: {
        ...(request.headers ?? {}),
        ...createRequestHeaders(headerOptions),
      },
    };
    if (request.body !== undefined) prepared.body = typeof request.body === 'string' ? request.body : stableStringify(request.body);
    return prepared;
  }

  observeIdentity(identity: SessionIdentity, user: SessionUser = this.state.user ?? {
    id: identity.userId,
    organizationId: identity.organizationId,
    displayName: identity.userId,
  }): boolean {
    const fingerprint = createIdentityFingerprint(identity);
    if (this.identityFingerprint === fingerprint) return false;
    const epoch = this.advanceEpoch();
    this.identityFingerprint = fingerprint;
    this.setState({ status: 'authenticated', epoch, user, identity });
    return true;
  }

  private activateSession(user: SessionUser, identity: SessionIdentity, csrfToken: string): void {
    const fingerprint = createIdentityFingerprint(identity);
    if (this.identityFingerprint === fingerprint) {
      this.sensitive.set('csrfToken', csrfToken);
      this.setState({ status: 'authenticated', epoch: this.state.epoch, user, identity });
      return;
    }
    const epoch = this.advanceEpoch();
    this.identityFingerprint = fingerprint;
    this.sensitive.set('csrfToken', csrfToken);
    this.setState({ status: 'authenticated', epoch, user, identity });
  }

  private transitionToAnonymous(): void {
    const epoch = this.advanceEpoch();
    this.identityFingerprint = undefined;
    this.setState({ status: 'anonymous', epoch });
  }

  private advanceEpoch(): number {
    for (const controller of this.activeRequests) controller.abort();
    this.activeRequests.clear();
    this.queryCache.clear();
    this.pendingCommands.clear();
    this.sensitive.clear();
    return this.state.epoch + 1;
  }

  private markRecoveryWindowExpired(commandId: string): void {
    this.pendingCommands.update(commandId, {
      status: 'failed',
      state: 'failed-stable',
      problem: {
        type: 'about:blank',
        title: 'Pending command recovery window expired',
        status: 409,
        code: 'RECOVERY_WINDOW_EXPIRED',
      },
    });
  }

  private async rotateCsrfWithDeadline(
    operationEpoch: number,
    parentSignal: AbortSignal,
    deadline: number,
  ): Promise<SessionSnapshot> {
    const controller = this.trackRequest();
    let timedOut = false;
    const abortChild = () => controller.abort();
    const remaining = Math.max(0, deadline - Date.now());
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, remaining);
    parentSignal.addEventListener('abort', abortChild, { once: true });
    let cancelListener: (() => void) | undefined;
    try {
      if (parentSignal.aborted || remaining === 0) {
        timedOut = this.state.epoch === operationEpoch;
        controller.abort();
        if (this.state.epoch !== operationEpoch) throw new SessionEpochChangedError();
        throw new RequestTimeoutError();
      }
      const cancellation = new Promise<never>((_, reject) => {
        cancelListener = () => {
          reject(this.state.epoch === operationEpoch
            ? new RequestTimeoutError()
            : new SessionEpochChangedError());
        };
        if (controller.signal.aborted) cancelListener();
        else controller.signal.addEventListener('abort', cancelListener, { once: true });
      });
      const response = await Promise.race([
        this.adapter.rotateCsrf(controller.signal),
        cancellation,
      ]);
      if (this.state.epoch !== operationEpoch) throw new SessionEpochChangedError();
      if (timedOut || parentSignal.aborted) throw new RequestTimeoutError();
      this.sensitive.set('csrfToken', response.csrfToken);
      return this.snapshot;
    } catch (error) {
      if (this.state.epoch !== operationEpoch) throw new SessionEpochChangedError();
      if (timedOut || parentSignal.aborted) throw new RequestTimeoutError();
      throw error;
    } finally {
      clearTimeout(timeoutId);
      parentSignal.removeEventListener('abort', abortChild);
      if (cancelListener) controller.signal.removeEventListener('abort', cancelListener);
      this.activeRequests.delete(controller);
    }
  }

  private trackRequest(): AbortController {
    const controller = new AbortController();
    this.activeRequests.add(controller);
    return controller;
  }

  private setState(state: SessionSnapshot): void {
    this.state = state;
    const snapshot = this.snapshot;
    for (const listener of this.listeners) listener(snapshot);
  }
}

function canonicalBody(value: unknown): string {
  return typeof value === 'string' ? value : stableStringify(value);
}

function toProblem(error: unknown): ProblemDetails {
  if (error instanceof ApiProblemError) {
    return { ...error.problem, headers: { ...error.headers } };
  }
  if (error instanceof RequestTimeoutError) {
    return {
      type: 'about:blank',
      title: 'Request timeout',
      status: 408,
      code: error.code,
      retryable: true,
      detail: error.message,
    };
  }
  if (isProblemDetails(error)) return error;
  if (error instanceof PendingCommandFailedError) return error.problem;
  return {
    type: 'about:blank',
    title: 'Request failed',
    status: 500,
    detail: error instanceof Error ? error.message : 'Unexpected request failure',
  };
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.type === 'string' && typeof record.title === 'string' && typeof record.status === 'number';
}

function isCsrfFailure(error: unknown): boolean {
  const problem = toProblem(error);
  return problem.status === 403 && problem.code === 'CSRF_FAILED';
}

function isResultUnknownFailure(error: unknown, problem: ProblemDetails): boolean {
  if (problem.status === 502 || problem.status === 503) return true;
  if (error instanceof RequestTimeoutError) return true;
  return error instanceof TypeError || (error instanceof Error && error.name === 'AbortError');
}

function isSessionInvalidation(error: unknown): boolean {
  const problem = toProblem(error);
  return problem.status === 401 && (problem.code === 'AUTHENTICATION_REQUIRED' || problem.code === 'SESSION_EXPIRED');
}

function createIdentityFingerprint(identity: SessionIdentity): string {
  return stableStringify({
    ...identity,
    capabilities: [...identity.capabilities].sort(),
  });
}

interface ParsedCommandStatus {
  state: 'IN_PROGRESS' | 'RECOVERY_REQUIRED' | 'SUCCEEDED' | 'FAILED';
  retryAfterMs: number;
  resource: { href: string } | null;
  resultHref: string | null;
  problem: ProblemDetails | null;
}

function parseCommandStatus(value: unknown, operationId: string): ParsedCommandStatus {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new PendingCommandRecoveryError('Invalid command status response.');
  const record = value as Record<string, unknown>;
  if (record.operationId !== operationId) throw new PendingCommandRecoveryError('Command status operation does not match the pending command.');
  if (!['IN_PROGRESS', 'RECOVERY_REQUIRED', 'SUCCEEDED', 'FAILED'].includes(String(record.state))) throw new PendingCommandRecoveryError('Unknown command status state.');
  if (typeof record.retryAfterMs !== 'number' || record.retryAfterMs < 0) throw new PendingCommandRecoveryError('Invalid command retry delay.');
  const resource = record.resource;
  const parsedResource = resource === null ? null : isRecord(resource) && typeof resource.href === 'string' ? { href: resource.href } : undefined;
  if (parsedResource === undefined) throw new PendingCommandRecoveryError('Invalid command resource reference.');
  const resultHref = record.resultHref === null ? null : typeof record.resultHref === 'string' ? record.resultHref : undefined;
  if (resultHref === undefined) throw new PendingCommandRecoveryError('Invalid command result href.');
  const problem = record.problem === null ? null : isProblemDetails(record.problem) ? record.problem : undefined;
  if (problem === undefined) throw new PendingCommandRecoveryError('Invalid command problem.');
  return { state: record.state as ParsedCommandStatus['state'], retryAfterMs: record.retryAfterMs, resource: parsedResource, resultHref, problem };
}

function parseRetryAfter(headers: Record<string, string>): number {
  const seconds = Number(headers['Retry-After'] ?? headers['retry-after'] ?? 0);
  return Number.isInteger(seconds) && seconds >= 0 ? seconds * 1000 : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
