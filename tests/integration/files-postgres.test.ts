import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { expect, describe, it, beforeAll, afterAll } from 'vitest';
import type { AuthorizationPrincipal, DataScopeType } from '../../apps/api/src/modules/identity/domain/authz.js';
import { CommandFailureError, type CommandResult } from '../../apps/api/src/modules/integration/idempotency/in-memory-idempotency-store.js';
import { PostgresIdempotencyRepository } from '../../apps/api/src/modules/integration/idempotency/postgres-idempotency-repository.js';
import { FilesService, toApiFile } from '../../apps/api/src/modules/files/application/files.service.js';
import { FileDependencyUnavailableError, FileState } from '../../apps/api/src/modules/files/domain/files.js';
import { ControlledFakeObjectStorageAdapter, ControlledFakeScanAdapter, type ObjectStorageAdapter } from '../../apps/api/src/modules/files/infrastructure/file-adapters.js';
import { PostgresFilesStore } from '../../apps/api/src/modules/files/infrastructure/postgres-files.store.js';
import { FileCommandProcessor } from '../../apps/worker/src/file-command-processor.js';
import { PostgresOutboxSource } from '../../apps/worker/src/postgres-outbox-source.js';
import { OutboxWorker, type OutboxEvent } from '../../apps/worker/src/worker.js';

const databaseUrl = process.env.DATABASE_URL;

type FileCommandResult = CommandResult<Record<string, unknown>>;

const describeFilesPostgres = databaseUrl === undefined ? describe.skip : describe;

describeFilesPostgres('Files PostgreSQL vertical slice', () => {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 12 });
  const repository = new PostgresIdempotencyRepository(pool);
  const store = new PostgresFilesStore(pool);
  const storage = new ControlledFakeObjectStorageAdapter();
  const organizationId = randomUUID();
  const secondOrganizationId = randomUUID();
  const actorId = randomUUID();
  const otherActorId = randomUUID();
  const secondOrganizationActorId = randomUUID();
  const scanEventIds: string[] = [];
  const scanOutboxIds: string[] = [];

  function principal(organization: string, userId: string, scopeType: DataScopeType = 'ALL_ORG'): AuthorizationPrincipal {
    return {
      userId,
      organizationId: organization,
      status: 'ACTIVE',
      permissions: new Set(['file.create', 'file.read']),
      scopes: new Map([['FILE', { resourceType: 'FILE', scopeType, groupIds: [] }]]),
      authzVersion: 1,
      sessionEpoch: 1,
    };
  }

  async function applyMigrations(): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const migration of ['001_foundation.sql', '002_identity_authorization.sql', '003_files.sql']) {
        await client.query(await readFile(new URL(`../../packages/database/migrations/${migration}`, import.meta.url), 'utf8'));
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async function insertIdentity(organization: string, userId: string, suffix: string): Promise<void> {
    await pool.query(
      `INSERT INTO org.organization (id, code, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [organization, `files-${suffix}`, `Files ${suffix}`],
    );
    await pool.query(
      `INSERT INTO iam.user_account
        (id, organization_id, provider, provider_subject, username_normalized, display_name)
       VALUES ($1, $2, 'OIDC_SSO', $3, $4, $5)`,
      [userId, organization, `files-${suffix}-subject`, `files-${suffix}@example.test`, `Files ${suffix}`],
    );
  }

  async function createIntent(owner: AuthorizationPrincipal, suffix: string): Promise<{ fileId: string; first: FileCommandResult; replay: FileCommandResult }> {
    let fileId = '';
    const input = {
      actorId: owner.userId,
      organizationId: owner.organizationId,
      operationId: 'createUploadIntent',
      idempotencyKey: `files-intent-${suffix}`,
      requestHash: `files-intent-request-${suffix}`,
    };
    const first = await repository.execute(input, async (client) => {
      const created = await serviceFor(owner, storage).createUploadIntent(owner, {
        fileName: `${suffix}.pdf`,
        contentType: 'application/pdf',
        sizeBytes: 12,
        metadata: { suite: 'files-postgres' },
      }, randomUUID(), client);
      fileId = created.file.id;
      const href = `/api/v1/files/${fileId}`;
      return {
        status: 201,
        body: { file: toApiFile(created.file, href), href, transfer: created.transfer },
        persistedBody: {},
        resource: { type: 'FILE', id: fileId, version: created.file.version, href },
        resultHref: href,
        responseHeaders: { location: href, 'content-location': href, etag: '"v1"', 'cache-control': 'no-store' },
      } satisfies FileCommandResult;
    }, (stored) => serviceFor(owner, storage).replayUploadIntent(owner, fileId, randomUUID(), stored));
    const replay = await repository.execute(input, async () => {
      throw new Error('createUploadIntent replay executed its business callback');
    }, (stored) => serviceFor(owner, storage).replayUploadIntent(owner, fileId, randomUUID(), stored)) as FileCommandResult;
    return { fileId, first: first as FileCommandResult, replay };
  }

  function serviceFor(owner: AuthorizationPrincipal, adapter: ControlledFakeObjectStorageAdapter): FilesService {
    void owner;
    return new FilesService(store, adapter);
  }

  async function runLifecycle(owner: AuthorizationPrincipal, suffix: string, scanResult: 'CLEAN' | 'MALICIOUS'): Promise<{ fileId: string; completeCommandId: string }> {
    const intent = await createIntent(owner, suffix);
    const firstTransfer = (intent.first.body as { transfer: { locator: string } }).transfer;
    const replayTransfer = (intent.replay.body as { transfer: { locator: string } }).transfer;
    expect(storage.objectKeyForTest(firstTransfer.locator)).toBe(storage.objectKeyForTest(replayTransfer.locator));
    expect(replayTransfer.locator).not.toBe(firstTransfer.locator);
    storage.putForTest(replayTransfer.locator, { sizeBytes: 12, contentType: 'application/pdf' });

    const completeInput = {
      actorId: owner.userId,
      organizationId: owner.organizationId,
      operationId: 'completeUpload',
      idempotencyKey: `files-complete-${suffix}`,
      requestHash: `files-complete-request-${suffix}`,
    };
    const accepted = await repository.execute(completeInput, async (client, claim) => {
      const result = await serviceFor(owner, storage).completeUpload(owner, intent.fileId, { action: 'COMPLETE' }, '"v1"', randomUUID(), client, claim);
      return result as FileCommandResult;
    }) as FileCommandResult;
    expect(accepted.status).toBe(202);
    expect(accepted.body).toMatchObject({ state: 'IN_PROGRESS', operationId: 'completeUpload' });

    const processor = new FileCommandProcessor(store, repository, storage, new ControlledFakeScanAdapter(scanResult));
    const source = new PostgresOutboxSource(pool);
    const worker = new OutboxWorker(source, { publish: (event) => processor.process(event) });
    const firstBatch = await worker.runOnce(50);
    const secondBatch = await worker.runOnce(50);
    const thirdBatch = await worker.runOnce(50);
    const fourthBatch = await worker.runOnce(50);
    expect(firstBatch).toBeGreaterThanOrEqual(2);
    expect(firstBatch + secondBatch + thirdBatch + fourthBatch).toBe(4);

    const command = await repository.withTransaction((client) => repository.statusByKey(client, completeInput));
    expect(command).toMatchObject({ state: 'SUCCEEDED', httpStatus: 200, resource: { type: 'FILE', id: intent.fileId } });

    const stored = await pool.query<{ response_body: Record<string, unknown> }>(
      `SELECT response_body FROM integration.idempotency_record
        WHERE organization_id = $1 AND actor_user_id = $2 AND operation_id = $3`,
      [owner.organizationId, owner.userId, 'createUploadIntent'],
    );
    expect(stored.rows[0]?.response_body).toEqual({});
    expect(JSON.stringify(stored.rows[0]?.response_body)).not.toContain('controlled-object-storage.invalid');

    const file = await store.findFile(owner.organizationId, intent.fileId);
    expect(file?.status).toBe(scanResult === 'CLEAN' ? FileState.AVAILABLE : FileState.REJECTED);
    const scan = await pool.query<{ result: string }>('SELECT result FROM files.scan_result WHERE organization_id = $1 AND file_id = $2', [owner.organizationId, intent.fileId]);
    expect(scan.rows).toEqual([{ result: scanResult }]);
    const scanOutbox = await pool.query<{ id: string; payload: { scanEventId?: string } }>(`SELECT id, payload FROM integration.outbox_event WHERE organization_id = $1 AND aggregate_id = $2 AND event_type = 'file.scan.requested'`, [owner.organizationId, intent.fileId]);
    scanOutboxIds.push(scanOutbox.rows[0]?.id as string);
    scanEventIds.push(scanOutbox.rows[0]?.payload.scanEventId as string);
    return { fileId: intent.fileId, completeCommandId: accepted.body.commandId as string };
  }

  async function enqueueCompletion(owner: AuthorizationPrincipal, suffix: string): Promise<{ fileId: string; commandId: string }> {
    const intent = await createIntent(owner, suffix);
    const replayTransfer = (intent.replay.body as { transfer: { locator: string } }).transfer;
    storage.putForTest(replayTransfer.locator, { sizeBytes: 12, contentType: 'application/pdf' });
    const completeInput = {
      actorId: owner.userId,
      organizationId: owner.organizationId,
      operationId: 'completeUpload',
      idempotencyKey: `files-complete-${suffix}`,
      requestHash: `files-complete-request-${suffix}`,
    };
    const accepted = await repository.execute(completeInput, async (client, claim) => serviceFor(owner, storage).completeUpload(owner, intent.fileId, { action: 'COMPLETE' }, '"v1"', randomUUID(), client, claim)) as FileCommandResult;
    expect(accepted.status).toBe(202);
    return { fileId: intent.fileId, commandId: accepted.body.commandId as string };
  }

  async function claimNextTopic(source: PostgresOutboxSource, topic: string): Promise<OutboxEvent> {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const event = (await source.claimBatch(1))[0];
      if (event === undefined) break;
      if (event.topic === topic) return event;
      await source.markPublished(event.id, event.claimToken);
    }
    throw new Error(`Expected a pending ${topic} event.`);
  }

  async function resetNextTopicToPending(source: PostgresOutboxSource, topic: string): Promise<OutboxEvent> {
    const event = await claimNextTopic(source, topic);
    await pool.query(
      `UPDATE integration.outbox_event
          SET status = 'PENDING', attempts = 0, claimed_at = NULL, claim_owner_token = NULL, claim_expires_at = NULL
        WHERE id = $1`,
      [event.id],
    );
    return event;
  }

  beforeAll(async () => {
    await applyMigrations();
    await insertIdentity(organizationId, actorId, 'primary');
    await insertIdentity(organizationId, otherActorId, 'other');
    await insertIdentity(secondOrganizationId, secondOrganizationActorId, 'second');
  });

  afterAll(async () => {
    const eventIds = scanEventIds.filter((value): value is string => typeof value === 'string');
    if (eventIds.length > 0) await pool.query('DELETE FROM integration.inbox_consumption WHERE event_id = ANY($1::uuid[])', [eventIds]);
    await pool.query('ALTER TABLE audit.audit_event DISABLE TRIGGER audit_event_immutable');
    for (const organization of [organizationId, secondOrganizationId]) {
      await pool.query('DELETE FROM audit.audit_event WHERE organization_id = $1', [organization]);
      await pool.query('DELETE FROM files.scan_result WHERE organization_id = $1', [organization]);
      await pool.query('DELETE FROM files.file_link WHERE organization_id = $1', [organization]);
      await pool.query('DELETE FROM files.upload_intent WHERE organization_id = $1', [organization]);
      await pool.query('DELETE FROM files.file_object WHERE organization_id = $1', [organization]);
      await pool.query('DELETE FROM integration.outbox_event WHERE organization_id = $1', [organization]);
      await pool.query('DELETE FROM integration.idempotency_record WHERE organization_id = $1', [organization]);
      await pool.query('DELETE FROM org.membership WHERE organization_id = $1', [organization]);
      await pool.query('DELETE FROM iam.user_account WHERE organization_id = $1', [organization]);
      await pool.query('DELETE FROM core.user_account WHERE organization_id = $1', [organization]);
      await pool.query('DELETE FROM org.organization WHERE id = $1', [organization]);
      await pool.query('DELETE FROM core.organization WHERE id = $1', [organization]);
    }
    await pool.query('ALTER TABLE audit.audit_event ENABLE TRIGGER audit_event_immutable');
    await pool.end();
  });

  it('persists a fresh upload replay and drives CLEAN/MALICIOUS files through PostgreSQL outbox and scan inbox exactly once', async () => {
    const clean = await runLifecycle(principal(organizationId, actorId), 'clean', 'CLEAN');
    const rejected = await runLifecycle(principal(organizationId, actorId), 'malicious', 'MALICIOUS');

    const duplicateScan = await pool.query<{ id: string; organization_id: string; event_type: string; payload: Record<string, unknown> }>(
      `SELECT id, organization_id, event_type, payload
         FROM integration.outbox_event
        WHERE id = $1`,
      [scanOutboxIds[0]],
    );
    const duplicateEvent = duplicateScan.rows[0];
    if (duplicateEvent === undefined) throw new Error('Expected a persisted scan outbox event.');
    const processor = new FileCommandProcessor(store, repository, storage, new ControlledFakeScanAdapter('CLEAN'));
    const event: OutboxEvent = { id: duplicateEvent.id, organizationId: duplicateEvent.organization_id, topic: duplicateEvent.event_type, payload: duplicateEvent.payload };
    await processor.process(event);
    await processor.process(event);

    const fileRows = await pool.query<{ id: string; status: FileState; version: number }>(
      'SELECT id, status, version FROM files.file_object WHERE id = ANY($1::uuid[]) ORDER BY id',
      [[clean.fileId, rejected.fileId]],
    );
    expect(fileRows.rows).toHaveLength(2);
    expect(fileRows.rows.map((row) => row.status).sort()).toEqual([FileState.AVAILABLE, FileState.REJECTED].sort());
    expect(fileRows.rows.every((row) => row.version === 4)).toBe(true);
    await expect(pool.query(`SELECT count(*)::int AS count FROM files.scan_result WHERE file_id = $1`, [clean.fileId])).resolves.toMatchObject({ rows: [{ count: 1 }] });
    await expect(pool.query(`SELECT count(*)::int AS count FROM audit.audit_event WHERE organization_id = $1 AND resource_id = $2 AND action = 'file.available'`, [organizationId, clean.fileId])).resolves.toMatchObject({ rows: [{ count: 1 }] });
    await expect(pool.query(`SELECT count(*)::int AS count FROM audit.audit_event WHERE organization_id = $1 AND resource_id = $2 AND action = 'file.rejected'`, [organizationId, rejected.fileId])).resolves.toMatchObject({ rows: [{ count: 1 }] });
    await expect(pool.query(`SELECT count(*)::int AS count FROM integration.outbox_event WHERE organization_id = $1 AND aggregate_id = ANY($2::uuid[]) AND event_type = 'file.scan.requested'`, [organizationId, [clean.fileId, rejected.fileId]])).resolves.toMatchObject({ rows: [{ count: 2 }] });
    await expect(pool.query(`SELECT count(*)::int AS count FROM integration.inbox_consumption WHERE consumer_name = 'files.scan' AND event_id = ANY($1::uuid[])`, [scanEventIds])).resolves.toMatchObject({ rows: [{ count: 2 }] });
  });

  it('stores stable 404 complete failures for missing, cross-organization, and FILE OWN out-of-scope targets without business side effects', async () => {
    const owner = principal(organizationId, otherActorId);
    const actor = principal(organizationId, actorId, 'OWN');
    const crossOrganization = await createIntent(principal(secondOrganizationId, secondOrganizationActorId), 'cross-org');
    const outOfScope = await createIntent(owner, 'out-of-scope');
    const cases = [
      { fileId: randomUUID(), suffix: 'missing' },
      { fileId: crossOrganization.fileId, suffix: 'cross-org' },
      { fileId: outOfScope.fileId, suffix: 'out-of-scope' },
    ];
    for (const testCase of cases) {
      const before = await pool.query<{ files: number; audits: number; outbox: number }>(
        `SELECT
           (SELECT count(*) FROM files.file_object WHERE organization_id = $1) AS files,
           (SELECT count(*) FROM audit.audit_event WHERE organization_id = $1) AS audits,
           (SELECT count(*) FROM integration.outbox_event WHERE organization_id = $1) AS outbox`,
        [organizationId],
      );
      const input = {
        actorId: actor.userId,
        organizationId: actor.organizationId,
        operationId: 'completeUpload',
        idempotencyKey: `files-not-found-${testCase.suffix}`,
        requestHash: `files-not-found-request-${testCase.suffix}`,
      };
      const requestId = randomUUID();
      const failure = async (): Promise<never> => repository.execute(input, async (client, claim) => serviceFor(actor, storage).completeUpload(actor, testCase.fileId, { action: 'COMPLETE' }, '"v1"', requestId, client, claim)) as Promise<never>;
      await expect(failure()).rejects.toSatisfy((error: unknown) => error instanceof CommandFailureError && error.problem.status === 404 && error.problem.code === 'RESOURCE_NOT_FOUND');
      await expect(failure()).rejects.toSatisfy((error: unknown) => error instanceof CommandFailureError && error.problem.status === 404 && error.problem.code === 'RESOURCE_NOT_FOUND');
      const after = await pool.query<{ files: number; audits: number; outbox: number }>(
        `SELECT
           (SELECT count(*) FROM files.file_object WHERE organization_id = $1) AS files,
           (SELECT count(*) FROM audit.audit_event WHERE organization_id = $1) AS audits,
           (SELECT count(*) FROM integration.outbox_event WHERE organization_id = $1) AS outbox`,
        [organizationId],
      );
      expect(after.rows).toEqual(before.rows);
    }
  });

  it('rejects an upload intent whose object key does not match its file object', async () => {
    const client = await pool.connect();
    const fileId = randomUUID();
    const objectKey = `objects/${randomUUID()}/${randomUUID()}`;
    const mismatchedObjectKey = `objects/${randomUUID()}/${randomUUID()}`;
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO files.file_object
          (id, organization_id, created_by, object_key, original_name, declared_content_type, declared_size_bytes)
         VALUES ($1, $2, $3, $4, 'constraint-check.pdf', 'application/pdf', 12)`,
        [fileId, organizationId, actorId, objectKey],
      );
      await expect(
        client.query(
          `INSERT INTO files.upload_intent
            (file_id, organization_id, object_key, expires_at, created_by)
           VALUES ($1, $2, $3, now() + interval '15 minutes', $4)`,
          [fileId, organizationId, mismatchedObjectKey, actorId],
        ),
      ).rejects.toSatisfy((error: unknown) => (error as { code?: string }).code === '23503');
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('serializes concurrent complete and scan deliveries to one state transition and one audit/outbox effect', async () => {
    const owner = principal(organizationId, actorId);
    const { fileId } = await enqueueCompletion(owner, `concurrent-${randomUUID()}`);
    const source = new PostgresOutboxSource(pool);
    const completion = await claimNextTopic(source, 'file.complete.requested');
    const processor = new FileCommandProcessor(store, repository, storage, new ControlledFakeScanAdapter('CLEAN'));
    await Promise.all([
      processor.process(completion),
      processor.process({ ...completion, payload: { ...completion.payload } }),
    ]);
    await source.markPublished(completion.id, completion.claimToken);

    const scan = await claimNextTopic(source, 'file.scan.requested');
    await Promise.all([
      processor.process(scan),
      processor.process({ ...scan, payload: { ...scan.payload } }),
    ]);
    await source.markPublished(scan.id, scan.claimToken);

    await expect(pool.query<{ status: FileState; version: number }>('SELECT status, version FROM files.file_object WHERE id = $1', [fileId])).resolves.toMatchObject({ rows: [{ status: FileState.AVAILABLE, version: 4 }] });
    await expect(pool.query<{ count: number }>("SELECT count(*)::int AS count FROM files.scan_result WHERE file_id = $1", [fileId])).resolves.toMatchObject({ rows: [{ count: 1 }] });
    await expect(pool.query<{ count: number }>("SELECT count(*)::int AS count FROM integration.inbox_consumption WHERE consumer_name = 'files.scan' AND event_id = $1", [scan.payload.scanEventId])).resolves.toMatchObject({ rows: [{ count: 1 }] });
    await expect(pool.query<{ count: number }>("SELECT count(*)::int AS count FROM audit.audit_event WHERE resource_id = $1 AND action IN ('file.scan.started', 'file.available')", [fileId])).resolves.toMatchObject({ rows: [{ count: 2 }] });
    await expect(pool.query<{ count: number }>("SELECT count(*)::int AS count FROM integration.outbox_event WHERE aggregate_id = $1 AND event_type IN ('file.scan.requested', 'file.available')", [fileId])).resolves.toMatchObject({ rows: [{ count: 2 }] });
  });

  it('fences a crash-after-claim takeover and ignores the stale duplicate scan delivery', async () => {
    const owner = principal(organizationId, actorId);
    const { fileId } = await enqueueCompletion(owner, `takeover-${randomUUID()}`);
    const source = new PostgresOutboxSource(pool);
    const completion = await claimNextTopic(source, 'file.complete.requested');
    const processor = new FileCommandProcessor(store, repository, storage, new ControlledFakeScanAdapter('CLEAN'));
    await processor.process(completion);
    await source.markPublished(completion.id, completion.claimToken);

    const stale = await claimNextTopic(source, 'file.scan.requested');
    await pool.query('UPDATE integration.outbox_event SET claim_expires_at = now() - interval \'1 second\' WHERE id = $1', [stale.id]);
    const takeover = (await source.claimBatch(1))[0];
    if (takeover === undefined) throw new Error('Expected a reclaimed file scan event.');
    expect(takeover.attempts).toBe(2);
    await Promise.all([processor.process(stale), processor.process(takeover)]);
    await source.markPublished(takeover.id, takeover.claimToken);

    await expect(pool.query<{ status: string; attempts: number }>('SELECT status, attempts FROM integration.outbox_event WHERE id = $1', [takeover.id])).resolves.toMatchObject({ rows: [{ status: 'PUBLISHED', attempts: 2 }] });
    await expect(pool.query<{ status: FileState }>('SELECT status FROM files.file_object WHERE id = $1', [fileId])).resolves.toMatchObject({ rows: [{ status: FileState.AVAILABLE }] });
    await expect(pool.query<{ count: number }>("SELECT count(*)::int AS count FROM files.scan_result WHERE file_id = $1", [fileId])).resolves.toMatchObject({ rows: [{ count: 1 }] });
    await expect(pool.query<{ count: number }>("SELECT count(*)::int AS count FROM audit.audit_event WHERE resource_id = $1 AND action = 'file.available'", [fileId])).resolves.toMatchObject({ rows: [{ count: 1 }] });
    await expect(pool.query<{ count: number }>("SELECT count(*)::int AS count FROM integration.outbox_event WHERE aggregate_id = $1 AND event_type = 'file.available'", [fileId])).resolves.toMatchObject({ rows: [{ count: 1 }] });
  });

  it('quarantines a completion after five unavailable object-head attempts with stable command and database terminals', async () => {
    const owner = principal(organizationId, actorId);
    const { fileId, commandId } = await enqueueCompletion(owner, `retry-exhausted-${randomUUID()}`);
    const unavailableStorage: ObjectStorageAdapter = {
      createUploadTransfer: (input) => storage.createUploadTransfer(input),
      createDownloadTransfer: (input) => storage.createDownloadTransfer(input),
      async headObject() {
        throw new FileDependencyUnavailableError();
      },
    };
    const source = new PostgresOutboxSource(pool);
    const resetCompletion = await resetNextTopicToPending(source, 'file.complete.requested');
    expect(resetCompletion.payload.fileId).toBe(fileId);
    const pendingSnapshot = await store.findWorkerFile(organizationId, fileId);
    expect(pendingSnapshot?.file.status).toBe(FileState.PENDING_UPLOAD);
    expect(pendingSnapshot?.intentStatus).toBe('ACTIVE');
    expect(pendingSnapshot?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    const processor = new FileCommandProcessor(store, repository, unavailableStorage, new ControlledFakeScanAdapter('CLEAN'));
    const worker = new OutboxWorker(source, { publish: (event) => processor.process(event) });
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      if (attempt > 1) await pool.query('UPDATE integration.outbox_event SET available_at = now() WHERE aggregate_id = $1 AND event_type = \'file.complete.requested\'', [fileId]);
      if (attempt < 5) {
        await expect(worker.runOnce(1)).rejects.toThrow(FileDependencyUnavailableError);
      } else {
        await expect(worker.runOnce(1)).resolves.toBe(1);
      }
    }

    await expect(pool.query<{ status: FileState; rejection_reason: string }>('SELECT status, rejection_reason FROM files.file_object WHERE id = $1', [fileId])).resolves.toMatchObject({ rows: [{ status: FileState.QUARANTINED, rejection_reason: 'FileDependencyUnavailableError' }] });
    await expect(pool.query<{ status: string }>('SELECT status FROM files.upload_intent WHERE file_id = $1', [fileId])).resolves.toMatchObject({ rows: [{ status: 'REJECTED' }] });
    await expect(pool.query<{ result: string }>('SELECT result FROM files.scan_result WHERE file_id = $1', [fileId])).resolves.toMatchObject({ rows: [{ result: 'ERROR' }] });
    await expect(pool.query<{ state: string; http_status: number; code: string }>("SELECT state, http_status, problem_body->>'code' AS code FROM integration.idempotency_record WHERE id = $1", [commandId])).resolves.toMatchObject({ rows: [{ state: 'FAILED', http_status: 503, code: 'DEPENDENCY_UNAVAILABLE' }] });
    await expect(pool.query<{ count: number }>("SELECT count(*)::int AS count FROM audit.audit_event WHERE resource_id = $1 AND action = 'file.quarantined'", [fileId])).resolves.toMatchObject({ rows: [{ count: 1 }] });
    await expect(pool.query<{ count: number }>("SELECT count(*)::int AS count FROM integration.outbox_event WHERE aggregate_id = $1 AND event_type = 'file.quarantined'", [fileId])).resolves.toMatchObject({ rows: [{ count: 1 }] });
    await expect(pool.query<{ status: string; attempts: number }>("SELECT status, attempts FROM integration.outbox_event WHERE aggregate_id = $1 AND event_type = 'file.complete.requested'", [fileId])).resolves.toMatchObject({ rows: [{ status: 'PUBLISHED', attempts: 5 }] });
  });
});
