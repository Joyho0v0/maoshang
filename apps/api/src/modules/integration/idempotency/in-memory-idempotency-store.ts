import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';

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
}

type RecordState = 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED';

interface CommandRecord {
  commandId: string;
  key: string;
  requestHash: string;
  state: RecordState;
  leaseExpiresAt: number;
  attemptCount: number;
  result: CommandResult<unknown> | undefined;
  promise: Promise<CommandResult<unknown>> | undefined;
}

export interface CommandStatus {
  commandId: string;
  state: 'IN_PROGRESS' | 'RECOVERY_REQUIRED' | 'SUCCEEDED' | 'FAILED';
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

@Injectable()
export class InMemoryIdempotencyStore {
  private readonly records = new Map<string, CommandRecord>();

  constructor(private readonly options: { leaseMs?: number } = {}) {}

  async execute<T>(command: IdempotencyCommand<T>): Promise<CommandResult<T>> {
    const key = this.keyOf(command);
    const existing = this.records.get(key);
    if (existing !== undefined) {
      this.assertHash(existing, command.requestHash);
      if (existing.result !== undefined) return existing.result as CommandResult<T>;
      if (existing.promise !== undefined) return existing.promise as Promise<CommandResult<T>>;
      if (existing.leaseExpiresAt > Date.now()) {
        throw new Error('Idempotency command is already in progress without an observable owner.');
      }
      existing.state = 'IN_PROGRESS';
      existing.leaseExpiresAt = this.expiry();
      existing.attemptCount += 1;
    } else {
      this.records.set(key, {
        commandId: randomUUID(),
        key,
        requestHash: command.requestHash,
        state: 'IN_PROGRESS',
        leaseExpiresAt: this.expiry(),
        attemptCount: 1,
        result: undefined,
        promise: undefined,
      });
    }

    const record = this.records.get(key) as CommandRecord;
    const promise = command.run().then((result) => {
      record.state = 'SUCCEEDED';
      record.result = result;
      record.promise = undefined;
      return result;
    }).catch((error: unknown) => {
      record.state = 'FAILED';
      record.promise = undefined;
      throw error;
    });
    record.promise = promise as Promise<CommandResult<unknown>>;
    return promise;
  }

  claim(input: { actorId: string; organizationId: string; operationId: string; idempotencyKey: string; requestHash: string }): { commandId: string; state: 'IN_PROGRESS'; attemptCount: number } {
    const key = `${input.organizationId}:${input.actorId}:${input.operationId}:${input.idempotencyKey}`;
    const existing = this.records.get(key);
    if (existing !== undefined) {
      this.assertHash(existing, input.requestHash);
      if (existing.state === 'IN_PROGRESS' && existing.leaseExpiresAt > Date.now()) {
        return { commandId: existing.commandId, state: 'IN_PROGRESS', attemptCount: existing.attemptCount };
      }
      existing.state = 'IN_PROGRESS';
      existing.leaseExpiresAt = this.expiry();
      existing.attemptCount += 1;
      return { commandId: existing.commandId, state: 'IN_PROGRESS', attemptCount: existing.attemptCount };
    }
    const record: CommandRecord = { commandId: randomUUID(), key, requestHash: input.requestHash, state: 'IN_PROGRESS', leaseExpiresAt: this.expiry(), attemptCount: 1, result: undefined, promise: undefined };
    this.records.set(key, record);
    return { commandId: record.commandId, state: 'IN_PROGRESS', attemptCount: 1 };
  }

  status(commandId: string): CommandStatus | undefined {
    const record = this.findByCommandId(commandId);
    if (record === undefined) return undefined;
    if (record.state === 'IN_PROGRESS' && record.leaseExpiresAt <= Date.now()) {
      return { commandId, state: 'RECOVERY_REQUIRED', attemptCount: record.attemptCount };
    }
    return { commandId, state: record.state, attemptCount: record.attemptCount };
  }

  statusByKey(input: { actorId: string; organizationId: string; operationId: string; idempotencyKey: string }): CommandStatus | undefined {
    const key = `${input.organizationId}:${input.actorId}:${input.operationId}:${input.idempotencyKey}`;
    const record = this.records.get(key);
    return record === undefined ? undefined : this.status(record.commandId);
  }

  takeover(commandId: string): CommandStatus {
    const record = this.findByCommandId(commandId);
    if (record === undefined) throw new Error('Command not found.');
    if (record.state !== 'IN_PROGRESS' || record.leaseExpiresAt > Date.now()) throw new Error('Command lease is not recoverable.');
    record.leaseExpiresAt = this.expiry();
    record.attemptCount += 1;
    return { commandId, state: 'IN_PROGRESS', attemptCount: record.attemptCount };
  }

  private keyOf(command: Omit<IdempotencyCommand<unknown>, 'run'>): string {
    return `${command.organizationId}:${command.actorId}:${command.operationId}:${command.idempotencyKey}`;
  }

  private assertHash(record: CommandRecord, requestHash: string): void {
    if (record.requestHash !== requestHash) throw new IdempotencyConflictError();
  }

  private findByCommandId(commandId: string): CommandRecord | undefined {
    return [...this.records.values()].find((record) => record.commandId === commandId);
  }

  private expiry(): number {
    return Date.now() + (this.options.leaseMs ?? 30_000);
  }
}
