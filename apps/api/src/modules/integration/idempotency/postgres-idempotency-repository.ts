import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Pool, PoolClient, QueryResultRow } from 'pg';
import {
  CommandFailureError,
  IdempotencyConflictError,
  type CommandResult,
  type CommandStatus,
  type ResourceReference,
} from './in-memory-idempotency-store.js';
import { buildProblem, type ProblemDocument } from '../../../common/http/problem.js';

export { IdempotencyConflictError } from './in-memory-idempotency-store.js';

export const IDEMPOTENCY_CLAIM_SQL = `
INSERT INTO integration.idempotency_record
  (id, organization_id, actor_user_id, operation_id, key_hash, request_hash,
   state, owner_token, lease_expires_at, attempt_count, expires_at)
VALUES ($1, $2, $3, $4, $5, $6, 'IN_PROGRESS', $7, now() + interval '30 seconds', 1, now() + interval '24 hours')
ON CONFLICT (organization_id, actor_user_id, operation_id, key_hash)
DO NOTHING
RETURNING id, state, attempt_count, lease_expires_at;
`;

export const IDEMPOTENCY_READ_SQL = `
SELECT id, organization_id, actor_user_id, operation_id, key_hash, request_hash,
       state, owner_token, lease_expires_at, attempt_count, started_at,
       completed_at, expires_at, http_status, response_body, resource_type, resource_id, resource_version, problem_body,
       resource_href
FROM integration.idempotency_record
WHERE organization_id = $1 AND actor_user_id = $2 AND operation_id = $3 AND key_hash = $4
FOR UPDATE
`;

export const IDEMPOTENCY_TAKEOVER_SQL = `
UPDATE integration.idempotency_record
SET owner_token = $2, lease_expires_at = now() + interval '30 seconds', attempt_count = attempt_count + 1
WHERE id = $1 AND state = 'IN_PROGRESS' AND lease_expires_at <= now()
RETURNING id, state, attempt_count, lease_expires_at;
`;

export const IDEMPOTENCY_COMPLETE_SQL = `
UPDATE integration.idempotency_record
SET state = 'SUCCEEDED', completed_at = now(), http_status = $3,
    response_body = $4, resource_type = $5, resource_id = $6, resource_version = $7, resource_href = $8, lease_expires_at = now()
WHERE id = $1 AND owner_token = $2 AND state = 'IN_PROGRESS'
RETURNING id, state, attempt_count;
`;

export const IDEMPOTENCY_FAIL_SQL = `
UPDATE integration.idempotency_record
SET state = 'FAILED', completed_at = now(), http_status = $3,
    problem_body = $4, lease_expires_at = now()
WHERE id = $1 AND owner_token = $2 AND state = 'IN_PROGRESS'
RETURNING id, state, attempt_count;
`;

export interface PostgresIdempotencyInput {
  actorId: string;
  organizationId: string;
  operationId: string;
  idempotencyKey: string;
  requestHash: string;
}
export interface PostgresClaim extends CommandStatus {
  ownerToken?: Buffer;
  claimRole: 'OWNER' | 'OBSERVER' | 'TERMINAL';
}

export const IDEMPOTENCY_REPOSITORY = 'IDEMPOTENCY_REPOSITORY';

interface StoredIdempotencyRow extends QueryResultRow {
  id: string;
  operation_id: string;
  key_hash: Buffer;
  request_hash: Buffer;
  state: 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED';
  owner_token: Buffer;
  lease_expires_at: Date;
  attempt_count: number;
  started_at: Date;
  completed_at: Date | null;
  expires_at: Date;
  http_status: number | null;
  response_body: unknown;
  resource_type: string | null;
  resource_id: string | null;
  resource_version: number | null;
  problem_body: ProblemDocument | null;
  resource_href: string | null;
}

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

  async claim(client: PoolClient, input: PostgresIdempotencyInput): Promise<PostgresClaim> {
    const keyHash = hashBuffer(input.idempotencyKey);
    const requestHash = hashBuffer(input.requestHash);
    const existing = await client.query<StoredIdempotencyRow>(IDEMPOTENCY_READ_SQL, [input.organizationId, input.actorId, input.operationId, keyHash]);
    if (existing.rows[0] !== undefined) {
      const row = existing.rows[0];
      if (!row.request_hash.equals(requestHash)) throw new IdempotencyConflictError();
      if (row.state === 'IN_PROGRESS' && row.lease_expires_at <= new Date()) {
        const ownerToken = randomBytes(32);
        const takeover = await client.query<StoredIdempotencyRow>(IDEMPOTENCY_TAKEOVER_SQL, [row.id, ownerToken]);
        if (takeover.rows[0] === undefined) return { ...toStatus(row), claimRole: 'OBSERVER' as const };
        const refreshed = await this.readById(client, row.id);
        return { ...toStatus(refreshed), ownerToken, claimRole: 'OWNER' as const };
      }
      return { ...toStatus(row), claimRole: row.state === 'IN_PROGRESS' ? 'OBSERVER' as const : 'TERMINAL' as const };
    }

    const ownerToken = randomBytes(32);
    const inserted = await client.query<StoredIdempotencyRow>(IDEMPOTENCY_CLAIM_SQL, [randomUUID(), input.organizationId, input.actorId, input.operationId, keyHash, requestHash, ownerToken]);
    if (inserted.rows[0] !== undefined) {
      const row = await this.readById(client, inserted.rows[0].id);
      return { ...toStatus(row), ownerToken, claimRole: 'OWNER' as const };
    }
    const raced = await client.query<StoredIdempotencyRow>(IDEMPOTENCY_READ_SQL, [input.organizationId, input.actorId, input.operationId, keyHash]);
    const row = raced.rows[0];
    if (row === undefined) throw new Error('Idempotency claim lost its concurrent row.');
    if (!row.request_hash.equals(requestHash)) throw new IdempotencyConflictError();
    return { ...toStatus(row), claimRole: row.state === 'IN_PROGRESS' ? 'OBSERVER' as const : 'TERMINAL' as const };
  }

  async complete(client: PoolClient, commandId: string, ownerToken: Buffer, result: CommandResult<unknown>): Promise<void> {
    const resource = result.resource;
    const updated = await client.query(IDEMPOTENCY_COMPLETE_SQL, [commandId, ownerToken, result.status, JSON.stringify(result.body), resource?.type ?? null, resource?.id ?? null, resource?.version ?? null, result.resultHref ?? resource?.href ?? extractHref(result.body)]);
    if (updated.rowCount !== 1) throw new Error('Idempotency completion lost ownership.');
  }

  async fail(client: PoolClient, commandId: string, ownerToken: Buffer, problem: ProblemDocument): Promise<void> {
    const updated = await client.query(IDEMPOTENCY_FAIL_SQL, [commandId, ownerToken, problem.status, JSON.stringify(problem)]);
    if (updated.rowCount !== 1) throw new Error('Idempotency failure completion lost ownership.');
  }

  async releaseForRecovery(client: PoolClient, commandId: string, ownerToken: Buffer, code: string): Promise<void> {
    await client.query('UPDATE integration.idempotency_record SET lease_expires_at = now(), last_internal_error_code = $3 WHERE id = $1 AND owner_token = $2 AND state = \'IN_PROGRESS\'', [commandId, ownerToken, code]);
  }

  async execute<T>(input: PostgresIdempotencyInput, work: (client: PoolClient, claim: PostgresClaim) => Promise<CommandResult<T>>): Promise<CommandResult<T> | CommandStatus> {
    const outcome = await this.withTransaction(async (client) => {
      const claim = await this.claim(client, input);
      if (claim.state === 'SUCCEEDED') {
        const stored = await this.readById(client, claim.commandId);
        const resource = toResourceReference(stored);
        return { kind: 'result' as const, value: { status: claim.httpStatus ?? 200, body: stored.response_body as T, ...(claim.resultHref === null ? {} : { resultHref: claim.resultHref }), ...(resource === null ? {} : { resource }) } };
      }
      if (claim.state === 'FAILED') return { kind: 'failure' as const, error: new CommandFailureError(claim.problem ?? storedFailure()) };
      if (claim.claimRole !== 'OWNER') return { kind: 'terminal' as const, value: claim };
      await client.query('SAVEPOINT idempotency_command');
      try {
        const result = await work(client, claim);
        await client.query('RELEASE SAVEPOINT idempotency_command');
        if (claim.ownerToken === undefined) throw new Error('Idempotency owner token is missing.');
        await this.complete(client, claim.commandId, claim.ownerToken, result);
        return { kind: 'result' as const, value: result };
      } catch (error) {
        await client.query('ROLLBACK TO SAVEPOINT idempotency_command');
        if (claim.ownerToken === undefined) throw new Error('Idempotency owner token is missing.');
        if (error instanceof CommandFailureError) {
          await this.fail(client, claim.commandId, claim.ownerToken, error.problem);
          return { kind: 'failure' as const, error };
        }
        await this.releaseForRecovery(client, claim.commandId, claim.ownerToken, error instanceof Error ? error.name : 'UNKNOWN_FAILURE');
        return { kind: 'transient' as const, error };
      }
    });
    if (outcome.kind === 'failure' || outcome.kind === 'transient') throw outcome.error;
    return outcome.value;
  }

  async statusByKey(client: PoolClient, input: Omit<PostgresIdempotencyInput, 'requestHash'>): Promise<CommandStatus | undefined> {
    const row = await client.query<StoredIdempotencyRow>(IDEMPOTENCY_READ_SQL, [input.organizationId, input.actorId, input.operationId, hashBuffer(input.idempotencyKey)]);
    return row.rows[0] === undefined ? undefined : toStatus(row.rows[0]);
  }

  async statusById(client: PoolClient, commandId: string): Promise<CommandStatus | undefined> {
    const row = await client.query<StoredIdempotencyRow>('SELECT id, operation_id, key_hash, request_hash, state, owner_token, lease_expires_at, attempt_count, started_at, completed_at, expires_at, http_status, response_body, resource_type, resource_id, resource_version, problem_body, resource_href FROM integration.idempotency_record WHERE id = $1', [commandId]);
    return row.rows[0] === undefined ? undefined : toStatus(row.rows[0]);
  }

  private async readById(client: PoolClient, id: string): Promise<StoredIdempotencyRow> {
    const result = await client.query<StoredIdempotencyRow>('SELECT id, operation_id, key_hash, request_hash, state, owner_token, lease_expires_at, attempt_count, started_at, completed_at, expires_at, http_status, response_body, resource_type, resource_id, resource_version, problem_body, resource_href FROM integration.idempotency_record WHERE id = $1 FOR UPDATE', [id]);
    const row = result.rows[0];
    if (row === undefined) throw new Error('Idempotency row disappeared during takeover.');
    return row;
  }
}

function storedFailure(): ProblemDocument {
  return buildProblem({ status: 500, code: 'INTERNAL_ERROR', title: 'Stored command failure', requestId: randomUUID(), retryable: false });
}

function toStatus(row: StoredIdempotencyRow): CommandStatus {
  const recovery = row.state === 'IN_PROGRESS' && row.lease_expires_at <= new Date();
  return {
    commandId: row.id,
    operationId: row.operation_id,
    state: recovery ? 'RECOVERY_REQUIRED' : row.state,
    startedAt: row.started_at.toISOString(),
    completedAt: row.completed_at?.toISOString() ?? null,
    expiresAt: row.expires_at.toISOString(),
    retryAfterMs: recovery ? 0 : row.state === 'IN_PROGRESS' ? Math.max(1, row.lease_expires_at.getTime() - Date.now()) : 0,
    httpStatus: row.http_status,
    resource: toResourceReference(row),
    resultHref: row.resource_href,
    problem: row.problem_body,
    attemptCount: row.attempt_count,
  };
}

function toResourceReference(row: Pick<StoredIdempotencyRow, 'resource_type' | 'resource_id' | 'resource_version' | 'resource_href'>): ResourceReference | null {
  if (row.resource_type === null || row.resource_id === null || row.resource_href === null) return null;
  return { type: row.resource_type, id: row.resource_id, ...(row.resource_version === null ? {} : { version: row.resource_version }), href: row.resource_href };
}

function hashBuffer(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

function extractHref(value: unknown): string | null {
  return typeof value === 'object' && value !== null && 'href' in value && typeof value.href === 'string' ? value.href : null;
}
