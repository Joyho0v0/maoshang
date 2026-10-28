import type { Pool } from 'pg';
import type { OutboxEvent, OutboxSource } from './worker.js';

export class PostgresOutboxSource implements OutboxSource {
  constructor(private readonly pool: Pool) {}

  async claimBatch(limit: number): Promise<OutboxEvent[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<{ id: string; topic: string; payload: Record<string, unknown> }>(
        `WITH candidates AS (
           SELECT id
           FROM integration.outbox_event
           WHERE status IN ('PENDING', 'FAILED') AND available_at <= now()
           ORDER BY available_at, id
           FOR UPDATE SKIP LOCKED
           LIMIT $1
         )
         UPDATE integration.outbox_event AS event
         SET status = 'CLAIMED', claimed_at = now(), attempts = event.attempts + 1
         FROM candidates
         WHERE event.id = candidates.id
         RETURNING event.id, event.event_type AS topic, event.payload`,
        [limit],
      );
      await client.query('COMMIT');
      return result.rows;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async markPublished(id: string): Promise<void> {
    await this.pool.query("UPDATE integration.outbox_event SET status = 'PUBLISHED', published_at = now() WHERE id = $1 AND status = 'CLAIMED'", [id]);
  }

  async markFailed(id: string, error: unknown): Promise<void> {
    const code = error instanceof Error ? error.name : 'PUBLISH_FAILED';
    await this.pool.query(
      "UPDATE integration.outbox_event SET status = CASE WHEN attempts >= 5 THEN 'FAILED' ELSE 'PENDING' END, available_at = now() + interval '5 seconds', last_error_code = $2 WHERE id = $1 AND status = 'CLAIMED'",
      [id, code],
    );
  }
}
