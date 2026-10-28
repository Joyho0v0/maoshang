import type { CommandStatus, InMemoryIdempotencyStore } from '../idempotency/in-memory-idempotency-store.js';

export class CommandStatusService {
  constructor(private readonly store: InMemoryIdempotencyStore) {}

  get(commandId: string): CommandStatus | undefined {
    return this.store.status(commandId);
  }

  getByKey(input: { actorId: string; organizationId: string; operationId: string; idempotencyKey: string }): CommandStatus | undefined {
    return this.store.statusByKey(input);
  }
}
