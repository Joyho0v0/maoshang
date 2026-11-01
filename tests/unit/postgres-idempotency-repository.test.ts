import type { Pool, PoolClient } from 'pg';
import { PostgresIdempotencyRepository } from '../../apps/api/src/modules/integration/idempotency/postgres-idempotency-repository.js';

describe('Postgres idempotency transaction safety', () => {
  it('configures bounded lock and statement timeouts for every transaction', async () => {
    const queries: Array<{ text: string; values?: unknown[] }> = [];
    const client = {
      query: async (text: string, values?: unknown[]) => {
        queries.push(values === undefined ? { text } : { text, values });
        return { rows: [], rowCount: 0 };
      },
      release: () => undefined,
    } as unknown as PoolClient;
    const pool = { connect: async () => client } as unknown as Pool;
    const repository = new PostgresIdempotencyRepository(pool);

    await repository.withTransaction(async () => undefined);

    expect(queries).toContainEqual({
      text: "SELECT set_config('lock_timeout', $1, true), set_config('statement_timeout', $2, true)",
      values: ['1000ms', '5000ms'],
    });
  });
});
