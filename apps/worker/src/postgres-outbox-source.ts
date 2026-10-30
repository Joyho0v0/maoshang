import { randomBytes } from 'node:crypto';
import type { Pool } from 'pg';
import type { OutboxEvent, OutboxSource } from './worker.js';

export type PostgresOutboxTable = 'integration.outbox_event' | 'integration.identity_outbox_event';

export class PostgresOutboxSource implements OutboxSource {
  constructor(private readonly pool: Pool, private readonly table: PostgresOutboxTable = 'integration.outbox_event') {}

  async claimBatch(limit: number): Promise<OutboxEvent[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const claimToken = randomBytes(32);
      const result = await client.query<{ id: string; topic: string; payload: Record<string, unknown> }>(
        `WITH candidates AS (
           SELECT id
           FROM ${this.table}
           WHERE available_at <= now()
             AND (status = 'PENDING' OR (status = 'CLAIMED' AND (claim_expires_at <= now() OR claimed_at <= now() - interval '30 seconds')))
           ORDER BY available_at, id
           FOR UPDATE SKIP LOCKED
           LIMIT $1
         )
         UPDATE ${this.table} AS event
         SET status = 'CLAIMED', claimed_at = now(), claim_owner_token = $2,
             claim_expires_at = now() + interval '30 seconds', attempts = event.attempts + 1
         FROM candidates
         WHERE event.id = candidates.id
         RETURNING event.id, event.event_type AS topic, event.payload`,
        [limit, claimToken],
      );
      await client.query('COMMIT');
      return result.rows.map((row) => ({ ...row, claimToken, source: this.table === 'integration.outbox_event' ? 'foundation' as const : 'identity' as const }));
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async markPublished(id: string, claimToken?: Buffer): Promise<void> {
    if (claimToken === undefined) throw new Error('Outbox claim token is required.');
    const result = await this.pool.query(`UPDATE ${this.table} SET status = 'PUBLISHED', published_at = now(), claimed_at = NULL, claim_expires_at = NULL, claim_owner_token = NULL WHERE id = $1 AND status = 'CLAIMED' AND claim_owner_token = $2`, [id, claimToken]);
    if (result.rowCount !== 1) throw new Error('Outbox acknowledgement lost ownership.');
  }

  async markFailed(id: string, error: unknown, claimToken?: Buffer): Promise<void> {
    if (claimToken === undefined) throw new Error('Outbox claim token is required.');
    const code = error instanceof Error ? error.name : 'PUBLISH_FAILED';
    const result = await this.pool.query(
      `UPDATE ${this.table} SET status = CASE WHEN attempts >= 5 THEN 'FAILED' ELSE 'PENDING' END, available_at = now() + interval '5 seconds', last_error_code = $2, claimed_at = NULL, claim_expires_at = NULL, claim_owner_token = NULL WHERE id = $1 AND status = 'CLAIMED' AND claim_owner_token = $3`,
      [id, code, claimToken],
    );
    if (result.rowCount !== 1) throw new Error('Outbox failure update lost ownership.');
  }
}
