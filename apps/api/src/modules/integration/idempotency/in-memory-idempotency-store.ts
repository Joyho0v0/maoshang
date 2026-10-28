import { createHash, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { buildProblem, type ProblemDocument } from '../../../common/http/problem.js';

export interface IdempotencyCommand<T> {
  actorId: string;
  organizationId: string;
  operationId: string;
  idempotencyKey: string;
  requestHash: string;
  run: () => Promise<CommandResult<T>>;
}
export interface CommandResult<T = unknown> {
  status: number;
  body: T;
  resultHref?: string;
  resource?: ResourceReference;
  replayed?: boolean;
}

export interface ResourceReference {
  type: string;
  id: string;
  version?: number;
  href: string;
}

export function requireResourceReference(result: CommandResult<unknown>): ResourceReference | undefined {
  if (result.status < 200 || result.status >= 300) return result.resource;
  const resource = result.resource;
  if (resource === undefined || !isResourceReference(resource)) throw new Error('Successful idempotency result requires a valid ResourceReference.');
  return resource;
}

type RecordState = 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED';

interface CommandRecord {
  commandId: string;
  keyHash: string;
  requestHash: string;
  actorId: string;
  organizationId: string;
  operationId: string;
  state: RecordState;
  leaseExpiresAt: number;
  attemptCount: number;
  startedAt: string;
  completedAt: string | null;
  expiresAt: string;
  httpStatus: number | null;
  resource: unknown | null;
  resultHref: string | null;
  resourceReference: ResourceReference | null;
  problem: ProblemDocument | null;
  result: CommandResult<unknown> | undefined;
  promise: Promise<CommandResult<unknown>> | undefined;
}

export interface CommandStatus {
  commandId: string;
  operationId: string;
  state: 'IN_PROGRESS' | 'RECOVERY_REQUIRED' | 'SUCCEEDED' | 'FAILED';
  startedAt: string;
  completedAt: string | null;
  expiresAt: string;
  retryAfterMs: number;
  httpStatus: number | null;
  resource: unknown | null;
  resultHref: string | null;
  problem: ProblemDocument | null;
  attemptCount: number;
}

export class IdempotencyConflictError extends Error {
  readonly status = 409;
  readonly code = 'IDEMPOTENCY_KEY_REUSED';

  constructor() {
    super('Idempotency key was already used with a different request.');
    this.name = 'IdempotencyConflictError';
  }
}

export class CommandFailureError extends Error {
  constructor(readonly problem: ProblemDocument) {
    super(problem.title);
    this.name = 'CommandFailureError';
  }
}

@Injectable()
export class InMemoryIdempotencyStore {
  private readonly records = new Map<string, CommandRecord>();

  constructor(private readonly options: { leaseMs?: number; retentionMs?: number } = {}) {}

  async execute<T>(command: IdempotencyCommand<T>): Promise<CommandResult<T>> {
    const key = this.keyOf(command);
    const existing = this.records.get(key);
    if (existing !== undefined) {
      this.assertHash(existing, command.requestHash);
      if (existing.state === 'SUCCEEDED' && existing.result !== undefined) return { ...existing.result, replayed: true } as CommandResult<T>;
      if (existing.state === 'FAILED') throw new CommandFailureError(existing.problem ?? this.internalFailure());
      if (existing.promise !== undefined) return existing.promise as Promise<CommandResult<T>>;
      if (existing.leaseExpiresAt > Date.now()) throw new Error('Idempotency command is already in progress without an observable owner.');
      this.recover(existing);
    } else {
      this.records.set(key, this.newRecord(command));
    }

    const record = this.records.get(key) as CommandRecord;
    const promise = command.run().then((result) => {
      if (result.status === 202 && isInProgressCommandStatus(result.body)) {
        record.promise = undefined;
        return result;
      }
      this.complete(record.commandId, result);
      return result;
    }).catch((error: unknown) => {
      record.promise = undefined;
      if (error instanceof CommandFailureError) {
        this.fail(record.commandId, error.problem);
      } else {
        record.leaseExpiresAt = Date.now();
      }
      throw error;
    });
    record.promise = promise as Promise<CommandResult<unknown>>;
    return promise;
  }

  claim(input: { actorId: string; organizationId: string; operationId: string; idempotencyKey: string; requestHash: string }): CommandStatus {
    const key = this.keyOf(input);
    const existing = this.records.get(key);
    if (existing !== undefined) {
      this.assertHash(existing, input.requestHash);
      if (existing.state === 'SUCCEEDED' || existing.state === 'FAILED') return this.toStatus(existing);
      if (existing.leaseExpiresAt > Date.now()) return this.toStatus(existing);
      this.recover(existing);
      return this.toStatus(existing);
    }
    const record = this.newRecord(input);
    this.records.set(key, record);
    return this.toStatus(record);
  }

  complete(commandId: string, result: CommandResult<unknown>): CommandStatus {
    const record = this.requireRecord(commandId);
    const resourceReference = requireResourceReference(result);
    if (record.state !== 'IN_PROGRESS') return this.toStatus(record);
    record.state = 'SUCCEEDED';
    record.result = result;
    record.completedAt = new Date().toISOString();
    record.httpStatus = result.status;
    record.resource = result.body;
    record.resultHref = result.resultHref ?? extractHref(result.body);
    record.resourceReference = resourceReference ?? null;
    record.promise = undefined;
    return this.toStatus(record);
  }

  fail(commandId: string, problem: ProblemDocument): CommandStatus {
    const record = this.requireRecord(commandId);
    record.state = 'FAILED';
    record.completedAt = new Date().toISOString();
    record.httpStatus = problem.status;
    record.problem = problem;
    record.result = undefined;
    record.resource = null;
    record.resourceReference = null;
    record.resultHref = null;
    record.promise = undefined;
    return this.toStatus(record);
  }

  status(commandId: string): CommandStatus | undefined {
    const record = this.findByCommandId(commandId);
    return record === undefined ? undefined : this.toStatus(record);
  }

  statusByKey(input: { actorId: string; organizationId: string; operationId: string; idempotencyKey: string }): CommandStatus | undefined {
    const record = this.records.get(this.keyOf(input));
    return record === undefined ? undefined : this.toStatus(record);
  }

  takeover(commandId: string): CommandStatus {
    const record = this.requireRecord(commandId);
    if (record.state !== 'IN_PROGRESS' || record.leaseExpiresAt > Date.now()) throw new Error('Command lease is not recoverable.');
    this.recover(record);
    return this.toStatus(record);
  }

  debugRecord(commandId: string): { keyHash: string; requestHash: string; state: RecordState } | undefined {
    const record = this.findByCommandId(commandId);
    return record === undefined ? undefined : { keyHash: record.keyHash, requestHash: record.requestHash, state: record.state };
  }

  private newRecord(input: { actorId: string; organizationId: string; operationId: string; idempotencyKey: string; requestHash: string }): CommandRecord {
    const now = Date.now();
    return {
      commandId: randomUUID(),
      keyHash: hash(input.idempotencyKey),
      requestHash: hash(input.requestHash),
      actorId: input.actorId,
      organizationId: input.organizationId,
      operationId: input.operationId,
      state: 'IN_PROGRESS',
      leaseExpiresAt: now + this.leaseMs(),
      attemptCount: 1,
      startedAt: new Date(now).toISOString(),
      completedAt: null,
      expiresAt: new Date(now + (this.options.retentionMs ?? 24 * 60 * 60 * 1000)).toISOString(),
      httpStatus: null,
      resource: null,
      resourceReference: null,
      resultHref: null,
      problem: null,
      result: undefined,
      promise: undefined,
    };
  }

  private recover(record: CommandRecord): void {
    record.state = 'IN_PROGRESS';
    record.leaseExpiresAt = Date.now() + this.leaseMs();
    record.attemptCount += 1;
    record.problem = null;
    record.httpStatus = null;
    record.completedAt = null;
  }

  private keyOf(input: { actorId: string; organizationId: string; operationId: string; idempotencyKey: string }): string {
    return `${input.organizationId}:${input.actorId}:${input.operationId}:${hash(input.idempotencyKey)}`;
  }

  private assertHash(record: CommandRecord, requestHash: string): void {
    if (record.requestHash !== hash(requestHash)) throw new IdempotencyConflictError();
  }

  private requireRecord(commandId: string): CommandRecord {
    const record = this.findByCommandId(commandId);
    if (record === undefined) throw new Error('Command not found.');
    return record;
  }

  private findByCommandId(commandId: string): CommandRecord | undefined {
    return [...this.records.values()].find((record) => record.commandId === commandId);
  }

  private toStatus(record: CommandRecord): CommandStatus {
    const recovery = record.state === 'IN_PROGRESS' && record.leaseExpiresAt <= Date.now();
    return {
      commandId: record.commandId,
      operationId: record.operationId,
      state: recovery ? 'RECOVERY_REQUIRED' : record.state,
      startedAt: record.startedAt,
      completedAt: record.completedAt,
      expiresAt: record.expiresAt,
      retryAfterMs: recovery ? 0 : record.state === 'IN_PROGRESS' ? Math.max(1, record.leaseExpiresAt - Date.now()) : 0,
      httpStatus: record.httpStatus,
      resource: record.resourceReference,
      resultHref: record.resultHref,
      problem: record.problem,
      attemptCount: record.attemptCount,
    };
  }

  private leaseMs(): number {
    return this.options.leaseMs ?? 30_000;
  }

  private internalFailure(): ProblemDocument {
    return buildProblem({
      status: 500,
      code: 'INTERNAL_ERROR',
      title: 'Stored command failure',
      requestId: randomUUID(),
      retryable: false,
    });
  }
}

function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function extractHref(value: unknown): string | null {
  return typeof value === 'object' && value !== null && 'href' in value && typeof value.href === 'string' ? value.href : null;
}

function isResourceReference(value: unknown): value is ResourceReference {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.type === 'string' && candidate.type.length > 0
    && RESOURCE_TYPES.has(candidate.type)
    && typeof candidate.id === 'string' && UUID_PATTERN.test(candidate.id)
    && typeof candidate.href === 'string' && HREF_PATTERN.test(candidate.href)
    && (candidate.version === undefined || (typeof candidate.version === 'number' && Number.isInteger(candidate.version) && candidate.version >= 1));
}

function isInProgressCommandStatus(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    && (value as Record<string, unknown>).state === 'IN_PROGRESS'
    && typeof (value as Record<string, unknown>).commandId === 'string';
}

const RESOURCE_TYPES = new Set([
  'USER',
  'ORGANIZATION',
  'CUSTOMER',
  'PRODUCT',
  'SKU',
  'ORDER',
  'PAYMENT',
  'FILE',
  'DOCUMENT',
  'TASK',
  'INVENTORY_OPERATION',
  'INVENTORY_RESERVATION',
  'INVENTORY_OBSERVATION',
]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HREF_PATTERN = /^\/api\/v1\/.+/;
