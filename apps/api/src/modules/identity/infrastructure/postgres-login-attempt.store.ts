import { createHash } from 'node:crypto';
import type { Pool } from 'pg';
import type { LoginAttemptAllowance, LoginAttemptKeys, LoginAttemptStore } from '../application/session.service.js';

export interface PostgresLoginAttemptStoreOptions {
  maxKeys?: number;
}

export class PostgresLoginAttemptStore implements LoginAttemptStore {
  private readonly maxKeys: number;

  constructor(private readonly pool: Pool, options: PostgresLoginAttemptStoreOptions = {}) {
    this.maxKeys = options.maxKeys ?? 10_000;
    if (!Number.isInteger(this.maxKeys) || this.maxKeys < 2) throw new Error('Login attempt bucket capacity must be at least two.');
  }

  async consume(keys: LoginAttemptKeys, limit: number, windowMs: number, now: number): Promise<LoginAttemptAllowance> {
    const bucketKeys = [this.digest('ip', keys.ip), this.digest('account', keys.account)];
    const nowDate = new Date(now);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // The capacity trim is global to the table. Serialize only this small
      // limiter transaction so concurrent API instances cannot each observe
      // an under-capacity snapshot and leave the bucket table over its bound.
      await client.query("SELECT pg_advisory_xact_lock(hashtext('multica.login_attempt_bucket'))");
      await client.query(
        `DELETE FROM integration.login_attempt_bucket
          WHERE last_seen_at < $1::timestamptz - ($2::bigint * interval '1 millisecond')`,
        [nowDate, windowMs],
      );
      for (const bucketKey of bucketKeys) {
        await client.query(
          `INSERT INTO integration.login_attempt_bucket
             (bucket_key, window_started_at, attempts, last_seen_at)
           VALUES ($1, $2, 1, $2)
           ON CONFLICT (bucket_key) DO UPDATE
             SET attempts = CASE
               WHEN integration.login_attempt_bucket.window_started_at <= $2::timestamptz - ($3::bigint * interval '1 millisecond') THEN 1
               ELSE integration.login_attempt_bucket.attempts + 1
             END,
             window_started_at = CASE
               WHEN integration.login_attempt_bucket.window_started_at <= $2::timestamptz - ($3::bigint * interval '1 millisecond') THEN $2
               ELSE integration.login_attempt_bucket.window_started_at
             END,
             last_seen_at = $2`,
          [bucketKey, nowDate, windowMs],
        );
      }
      const result = await client.query<{ attempts: number; window_started_at: Date }>(
        `SELECT attempts, window_started_at
           FROM integration.login_attempt_bucket
          WHERE bucket_key = ANY($1::text[])`,
        [bucketKeys],
      );
      await client.query(
        `WITH candidates AS (
           SELECT bucket_key,
                  row_number() OVER (ORDER BY last_seen_at ASC, bucket_key ASC) AS row_number,
                  count(*) OVER () AS total
             FROM integration.login_attempt_bucket
            WHERE NOT (bucket_key = ANY($1::text[]))
         ), overflow AS (
           SELECT bucket_key
             FROM candidates
            WHERE row_number <= GREATEST((SELECT count(*) FROM integration.login_attempt_bucket) - $2, 0)
         )
         DELETE FROM integration.login_attempt_bucket AS b
          WHERE b.bucket_key IN (SELECT bucket_key FROM overflow)`,
        [bucketKeys, this.maxKeys],
      );
      await client.query('COMMIT');

      const blocked = result.rows.filter((row) => row.attempts > limit);
      if (blocked.length === 0) return { allowed: true, retryAfterSeconds: 0 };
      const retryAfterSeconds = Math.max(...blocked.map((row) => Math.max(1, Math.ceil((row.window_started_at.getTime() + windowMs - now) / 1000))));
      return { allowed: false, retryAfterSeconds };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async clearAccount(accountKey: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM integration.login_attempt_bucket WHERE bucket_key = $1', [this.digest('account', accountKey)]);
    } finally {
      client.release();
    }
  }

  private digest(scope: 'ip' | 'account', value: string): string {
    return createHash('sha256').update(`${scope}:${value}`, 'utf8').digest('hex');
  }
}
