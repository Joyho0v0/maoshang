import type { CommandStatus } from '../idempotency/in-memory-idempotency-store.js';
import type { PostgresIdempotencyRepository } from '../idempotency/postgres-idempotency-repository.js';
import type { PoolClient } from 'pg';

export class CommandStatusService {
  constructor(private readonly store: PostgresIdempotencyRepository, private readonly clientFactory: () => Promise<PoolClient>) {}

  async get(commandId: string): Promise<CommandStatus | undefined> {
    const client = await this.clientFactory();
    try {
      await client.query('BEGIN');
      const status = await this.store.statusById(client, commandId);
      await client.query('COMMIT');
      return status;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getByKey(input: { actorId: string; organizationId: string; operationId: string; idempotencyKey: string }): Promise<CommandStatus | undefined> {
    const client = await this.clientFactory();
    try {
      await client.query('BEGIN');
      const status = await this.store.statusByKey(client, input);
      await client.query('COMMIT');
      return status;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
