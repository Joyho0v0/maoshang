import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Pool, PoolClient, QueryResultRow } from 'pg';
import {
  CommandFailureError,
  IdempotencyConflictError,
  type CommandResult,
  type CommandStatus,
  type ResourceReference,
  isResourceReference,
  requireResourceReference,
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
       completed_at, expires_at, http_status, response_body, response_headers, resource_type, resource_id, resource_version, problem_body,
       resource_href
FROM integration.idempotency_record
WHERE organization_id = $1 AND actor_user_id = $2 AND operation_id = $3 AND key_hash = $4
`;

export const IDEMPOTENCY_FENCE_SQL = `
SELECT id, organization_id, actor_user_id, operation_id, key_hash, request_hash,
       state, owner_token, lease_expires_at, attempt_count, started_at,
       completed_at, expires_at, http_status, response_body, response_headers, resource_type, resource_id, resource_version, problem_body,
       resource_href
FROM integration.idempotency_record
WHERE id = $1
FOR UPDATE
`;

export const IDEMPOTENCY_TAKEOVER_SQL = `
UPDATE integration.idempotency_record
SET owner_token = $2, lease_expires_at = now() + interval '30 seconds', attempt_count = attempt_count + 1
WHERE id = $1 AND owner_token = $3 AND state = 'IN_PROGRESS' AND lease_expires_at <= now()
RETURNING id, state, attempt_count, lease_expires_at;
`;

export const IDEMPOTENCY_COMPLETE_SQL = `
UPDATE integration.idempotency_record
SET state = 'SUCCEEDED', completed_at = now(), http_status = $3,
    response_body = $4, response_headers = $5, resource_type = $6, resource_id = $7, resource_version = $8, resource_href = $9, lease_expires_at = now()
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
  response_headers: Record<string, string> | null;
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
        const takeover = await client.query<StoredIdempotencyRow>(IDEMPOTENCY_TAKEOVER_SQL, [row.id, ownerToken, row.owner_token]);
        if (takeover.rows[0] === undefined) {
          const current = await this.readById(client, row.id);
          if (!current.request_hash.equals(requestHash)) throw new IdempotencyConflictError();
          return { ...toStatus(current), claimRole: current.state === 'IN_PROGRESS' ? 'OBSERVER' as const : 'TERMINAL' as const };
        }
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
    const resource = requireResourceReference(result);
    const responseHeaders = normalizeResponseHeaders(result.responseHeaders);
    const updated = await client.query(IDEMPOTENCY_COMPLETE_SQL, [commandId, ownerToken, result.status, JSON.stringify(result.body), responseHeaders === undefined ? null : JSON.stringify(responseHeaders), resource?.type ?? null, resource?.id ?? null, resource?.version ?? null, resource?.href ?? result.resultHref ?? extractHref(result.body)]);
    if (updated.rowCount !== 1) throw new IdempotencyOwnershipLostError();
  }

  async fail(client: PoolClient, commandId: string, ownerToken: Buffer, problem: ProblemDocument): Promise<void> {
    const updated = await client.query(IDEMPOTENCY_FAIL_SQL, [commandId, ownerToken, problem.status, JSON.stringify(problem)]);
    if (updated.rowCount !== 1) throw new Error('Idempotency failure completion lost ownership.');
  }

  async releaseForRecovery(client: PoolClient, commandId: string, ownerToken: Buffer, code: string): Promise<void> {
    await client.query('UPDATE integration.idempotency_record SET lease_expires_at = now(), last_internal_error_code = $3 WHERE id = $1 AND owner_token = $2 AND state = \'IN_PROGRESS\'', [commandId, ownerToken, code]);
  }

  async execute<T>(input: PostgresIdempotencyInput, work: (client: PoolClient, claim: PostgresClaim) => Promise<CommandResult<T>>): Promise<CommandResult<T> | CommandStatus> {
    // Claim/observe/replay is deliberately a short transaction. Keeping the row
    // lock while the owner calls application code would make every observer wait
    // for the business transaction instead of receiving 202 immediately.
    const claim = await this.withTransaction((client) => this.claim(client, input));
    if (claim.state === 'SUCCEEDED') {
      const stored = await this.withTransaction((client) => this.readById(client, claim.commandId));
      const resource = toResourceReference(stored);
      const responseHeaders = normalizeResponseHeaders(stored.response_headers);
      return { status: claim.httpStatus ?? 200, body: stored.response_body as T, ...(stored.resource_href === null ? {} : { resultHref: stored.resource_href }), ...(resource === null ? {} : { resource }), ...(responseHeaders === undefined ? {} : { responseHeaders }), replayed: true };
    }
    if (claim.state === 'FAILED') throw new CommandFailureError(claim.problem ?? storedFailure());
    if (claim.claimRole !== 'OWNER') return claim;
    if (claim.ownerToken === undefined) throw new Error('Idempotency owner token is missing.');

    const outcome = await this.withTransaction(async (client) => {
      let savepointActive = false;
      try {
        const fencedClaim = await this.fenceOwner(client, claim);
        await client.query('SAVEPOINT idempotency_command');
        savepointActive = true;
        const result = await work(client, fencedClaim);
        if (result.status === 202) {
          if (!isInProgressCommandStatus(result.body, fencedClaim)) throw new Error('CommandStatusInProgress result is invalid.');
          await client.query('RELEASE SAVEPOINT idempotency_command');
          savepointActive = false;
          return { kind: 'result' as const, value: result };
        }
        await this.complete(client, fencedClaim.commandId, fencedClaim.ownerToken as Buffer, result);
        await client.query('RELEASE SAVEPOINT idempotency_command');
        savepointActive = false;
        return { kind: 'result' as const, value: result };
      } catch (error) {
        if (savepointActive) {
          await client.query('ROLLBACK TO SAVEPOINT idempotency_command');
          savepointActive = false;
        }
        if (error instanceof IdempotencyOwnershipLostError) return { kind: 'ownership-lost' as const, error };
        if (error instanceof CommandFailureError) {
          await this.fail(client, claim.commandId, claim.ownerToken as Buffer, error.problem);
          return { kind: 'failure' as const, error };
        }
        await this.releaseForRecovery(client, claim.commandId, claim.ownerToken as Buffer, error instanceof Error ? error.name : 'UNKNOWN_FAILURE');
        return { kind: 'transient' as const, error };
      }
    });
    if (outcome.kind === 'failure' || outcome.kind === 'transient' || outcome.kind === 'ownership-lost') throw outcome.error;
    return outcome.value;
  }

  async statusByKey(client: PoolClient, input: Omit<PostgresIdempotencyInput, 'requestHash'>): Promise<CommandStatus | undefined> {
    const row = await client.query<StoredIdempotencyRow>(IDEMPOTENCY_READ_SQL, [input.organizationId, input.actorId, input.operationId, hashBuffer(input.idempotencyKey)]);
    return row.rows[0] === undefined ? undefined : toStatus(row.rows[0]);
  }

  async statusById(client: PoolClient, commandId: string): Promise<CommandStatus | undefined> {
    const row = await client.query<StoredIdempotencyRow>('SELECT id, operation_id, key_hash, request_hash, state, owner_token, lease_expires_at, attempt_count, started_at, completed_at, expires_at, http_status, response_body, response_headers, resource_type, resource_id, resource_version, problem_body, resource_href FROM integration.idempotency_record WHERE id = $1', [commandId]);
    return row.rows[0] === undefined ? undefined : toStatus(row.rows[0]);
  }

  private async readById(client: PoolClient, id: string): Promise<StoredIdempotencyRow> {
    const result = await client.query<StoredIdempotencyRow>(IDEMPOTENCY_FENCE_SQL, [id]);
    const row = result.rows[0];
    if (row === undefined) throw new Error('Idempotency row disappeared during takeover.');
    return row;
  }

  private async fenceOwner(client: PoolClient, claim: PostgresClaim): Promise<PostgresClaim> {
    if (claim.ownerToken === undefined) throw new IdempotencyOwnershipLostError();
    const row = await this.readById(client, claim.commandId);
    if (row.operation_id !== claim.operationId || row.state !== 'IN_PROGRESS' || !row.owner_token.equals(claim.ownerToken) || row.lease_expires_at <= new Date()) {
      throw new IdempotencyOwnershipLostError();
    }
    return { ...toStatus(row), ownerToken: claim.ownerToken, claimRole: 'OWNER' as const };
  }
}

export class IdempotencyOwnershipLostError extends Error {
  constructor() {
    super('Idempotency command ownership was lost before completion.');
    this.name = 'IdempotencyOwnershipLostError';
  }
}

function storedFailure(): ProblemDocument {
  return buildProblem({ status: 500, code: 'INTERNAL_ERROR', title: 'Stored command failure', requestId: randomUUID(), retryable: false });
}

function toStatus(row: StoredIdempotencyRow): CommandStatus {
  const recovery = row.state === 'IN_PROGRESS' && row.lease_expires_at <= new Date();
  const resource = toResourceReference(row);
  if (row.state === 'SUCCEEDED' && (row.completed_at === null || row.http_status === null || row.http_status < 200 || row.http_status >= 300 || resource === null || row.problem_body !== null)) throw new Error('Persisted SUCCEEDED command has an invalid ResourceReference or terminal shape.');
  if (row.state === 'FAILED' && (row.completed_at === null || row.http_status === null || row.http_status < 400 || row.problem_body === null || resource !== null || row.resource_href !== null)) throw new Error('Persisted FAILED command has an invalid terminal shape.');
  if (row.state === 'IN_PROGRESS' && (row.completed_at !== null || row.http_status !== null || resource !== null || row.resource_href !== null || row.problem_body !== null)) throw new Error('Persisted IN_PROGRESS command has an invalid terminal shape.');
  return {
    commandId: row.id,
    operationId: row.operation_id,
    state: recovery ? 'RECOVERY_REQUIRED' : row.state,
    startedAt: row.started_at.toISOString(),
    completedAt: row.completed_at?.toISOString() ?? null,
    expiresAt: row.expires_at.toISOString(),
    retryAfterMs: recovery ? 0 : row.state === 'IN_PROGRESS' ? Math.max(1, row.lease_expires_at.getTime() - Date.now()) : 0,
    httpStatus: row.http_status,
    resource,
    resultHref: null,
    problem: row.problem_body,
    attemptCount: row.attempt_count,
  };
}

function toResourceReference(row: Pick<StoredIdempotencyRow, 'resource_type' | 'resource_id' | 'resource_version' | 'resource_href'>): ResourceReference | null {
  const hasResourcePart = row.resource_type !== null || row.resource_id !== null || row.resource_version !== null || row.resource_href !== null;
  if (!hasResourcePart) return null;
  if (row.resource_type === null || row.resource_id === null || row.resource_href === null) throw new Error('Persisted ResourceReference is incomplete.');
  const resource = { type: row.resource_type, id: row.resource_id, ...(row.resource_version === null ? {} : { version: row.resource_version }), href: row.resource_href };
  if (!isResourceReference(resource)) throw new Error('Persisted ResourceReference is invalid.');
  return resource;
}

function hashBuffer(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

function extractHref(value: unknown): string | null {
  return typeof value === 'object' && value !== null && 'href' in value && typeof value.href === 'string' ? value.href : null;
}

function isInProgressCommandStatus(value: unknown, claim: PostgresClaim): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  const required = ['commandId', 'operationId', 'state', 'startedAt', 'completedAt', 'expiresAt', 'retryAfterMs', 'httpStatus', 'resource', 'resultHref', 'problem', 'attemptCount'];
  if (Object.keys(candidate).some((key) => !required.includes(key)) || required.some((key) => !(key in candidate))) return false;
  return candidate.commandId === claim.commandId
    && candidate.operationId === claim.operationId
    && candidate.state === 'IN_PROGRESS'
    && typeof candidate.startedAt === 'string' && !Number.isNaN(Date.parse(candidate.startedAt))
    && candidate.completedAt === null
    && typeof candidate.expiresAt === 'string' && !Number.isNaN(Date.parse(candidate.expiresAt))
    && typeof candidate.retryAfterMs === 'number' && Number.isInteger(candidate.retryAfterMs) && candidate.retryAfterMs >= 1
    && candidate.httpStatus === null && candidate.resource === null && candidate.resultHref === null && candidate.problem === null
    && typeof candidate.attemptCount === 'number' && Number.isInteger(candidate.attemptCount) && candidate.attemptCount === claim.attemptCount;
}

function normalizeResponseHeaders(value: Record<string, string> | null | undefined): Record<string, string> | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Persisted response headers are invalid.');
  const allowed = new Set(['location', 'content-location', 'etag', 'retry-after', 'cache-control']);
  const normalized: Record<string, string> = {};
  for (const [name, headerValue] of Object.entries(value)) {
    const lowerName = name.toLowerCase();
    if (!allowed.has(lowerName) || typeof headerValue !== 'string' || headerValue.length === 0) throw new Error('Persisted response headers are invalid.');
    if ((lowerName === 'location' || lowerName === 'content-location') && !headerValue.startsWith('/api/v1/')) throw new Error('Persisted response headers are invalid.');
    if (lowerName === 'etag' && !/^"v[1-9][0-9]*"$/.test(headerValue)) throw new Error('Persisted response headers are invalid.');
    if (lowerName === 'retry-after' && !/^[0-9]+$/.test(headerValue)) throw new Error('Persisted response headers are invalid.');
    if (lowerName === 'cache-control' && headerValue !== 'no-store') throw new Error('Persisted response headers are invalid.');
    normalized[lowerName] = headerValue;
  }
  return normalized;
}
