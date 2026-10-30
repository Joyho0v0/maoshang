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

  it('persists only the explicit safe projection, never a signed transfer body', async () => {
    const queries: Array<{ text: string; values?: unknown[] }> = [];
    const client = {
      query: async (text: string, values?: unknown[]) => {
        queries.push(values === undefined ? { text } : { text, values });
        return { rows: [], rowCount: 1 };
      },
    } as unknown as PoolClient;
    const pool = { connect: async () => ({ query: async () => ({ rows: [] }), release: () => undefined }) } as unknown as Pool;
    const repository = new PostgresIdempotencyRepository(pool);
    const locator = 'https://controlled-object-storage.invalid/upload/secret';

    await repository.complete(client, 'command-1', Buffer.alloc(32, 1), {
      status: 201,
      body: { file: { id: '00000000-0000-4000-8000-000000000003' }, transfer: { locator, headers: { 'X-Controlled-Transfer': 'secret' } } },
      persistedBody: {},
      resource: { type: 'FILE', id: '00000000-0000-4000-8000-000000000003', href: '/api/v1/files/00000000-0000-4000-8000-000000000003' },
    });

    const complete = queries.find((query) => query.text.includes("state = 'SUCCEEDED'"));
    expect(complete?.values?.[3]).toBe('{}');
    expect(JSON.stringify(complete?.values)).not.toContain(locator);
    expect(JSON.stringify(complete?.values)).not.toContain('secret');
  });
});
