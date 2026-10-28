import type { Pool, PoolClient } from 'pg';

export const IDEMPOTENCY_CLAIM_SQL = `
INSERT INTO integration.idempotency_record
  (id, organization_id, actor_user_id, operation_id, key_hash, request_hash,
   state, owner_token, lease_expires_at, attempt_count, expires_at)
VALUES ($1, $2, $3, $4, $5, $6, 'IN_PROGRESS', $7, now() + interval '30 seconds', 1, now() + interval '24 hours')
ON CONFLICT (organization_id, actor_user_id, operation_id, key_hash)
DO NOTHING
RETURNING id, state, attempt_count, lease_expires_at;
`;

export const IDEMPOTENCY_TAKEOVER_SQL = `
UPDATE integration.idempotency_record
SET owner_token = $2, lease_expires_at = now() + interval '30 seconds', attempt_count = attempt_count + 1
WHERE id = $1 AND state = 'IN_PROGRESS' AND lease_expires_at <= now()
RETURNING id, state, attempt_count, lease_expires_at;
`;

export class PostgresIdempotencyRepository {
  constructor(private readonly pool: Pool) {}

  async withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
