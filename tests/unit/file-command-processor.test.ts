import { describe, expect, it } from 'vitest';
import { FileCommandProcessor } from '../../apps/worker/src/file-command-processor.js';
import { FileState } from '../../apps/api/src/modules/files/domain/files.js';
import type { PostgresFilesStore } from '../../apps/api/src/modules/files/infrastructure/postgres-files.store.js';
import type { ObjectStorageAdapter, ScanAdapter } from '../../apps/api/src/modules/files/infrastructure/file-adapters.js';
import type { PostgresIdempotencyRepository } from '../../apps/api/src/modules/integration/idempotency/postgres-idempotency-repository.js';

const organizationId = '00000000-0000-4000-8000-000000000001';
const fileId = '00000000-0000-4000-8000-000000000002';
const commandId = '00000000-0000-4000-8000-000000000003';
const eventId = '00000000-0000-4000-8000-000000000004';
const ownerToken = Buffer.alloc(32, 1).toString('base64');

function file(status: FileState) {
  return {
    id: fileId,
    organizationId,
    createdBy: '00000000-0000-4000-8000-000000000005',
    objectKey: `private/${organizationId}/${fileId}/nonce-value`,
    fileName: 'receipt.pdf',
    contentType: 'application/pdf',
    sizeBytes: 12,
    status,
    metadata: {},
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function repository(log: { failed: unknown[]; completed: unknown[]; transactions: number[] }) {
  return {
    async withTransaction(work: (client: unknown) => Promise<unknown>) {
      repositoryClientQueries.push([]);
      return work({ query: async (text: string) => { repositoryClientQueries.at(-1)?.push(text); return { rowCount: 1, rows: [] }; } });
    },
    async checkCommandOwner() { return 'OWNED' as const; },
    async fail(_client: unknown, _commandId: string, _owner: Buffer, problem: unknown) { log.failed.push(problem); },
    async complete(_client: unknown, _commandId: string, _owner: Buffer, result: unknown) { log.completed.push(result); },
  } as unknown as PostgresIdempotencyRepository;
}

const repositoryClientQueries: string[][] = [];

function completionEvent(attempts = 1) {
  return {
    id: eventId,
    topic: 'file.complete.requested',
    organizationId,
    attempts,
    payload: { eventId, fileId, organizationId, commandId, operationId: 'completeUpload', ownerToken, requestId: 'request-1' },
  };
}

describe('Files Worker command processor', () => {
  it('rejects an outbox scan whose tenant envelope disagrees with its payload', async () => {
    const processor = new FileCommandProcessor({} as PostgresFilesStore, {} as PostgresIdempotencyRepository, {} as ObjectStorageAdapter, {} as ScanAdapter);
    await expect(processor.process({ id: eventId, topic: 'file.scan.requested', organizationId, payload: { fileId, organizationId: '00000000-0000-4000-8000-000000000099', scanEventId: eventId } })).rejects.toThrow(/organization/i);
  });

  it('turns a confirmed missing object into one terminal rejected command, not retry exhaustion', async () => {
    const log = { failed: [] as unknown[], completed: [], transactions: [] as number[] };
    const store = {
      async findWorkerFile() { return { file: file(FileState.PENDING_UPLOAD), objectKey: 'private/object', expiresAt: new Date(Date.now() + 60_000), intentStatus: 'ACTIVE' as const }; },
      async markIntegrityRejected(_client: unknown, _org: string, _file: string, _event: string, reason: string) { log.transactions.push(1); expect(reason).toBe('object-not-found'); return file(FileState.REJECTED); },
    } as unknown as PostgresFilesStore;
    const storage = { async headObject() { return undefined; } } as unknown as ObjectStorageAdapter;
    const processor = new FileCommandProcessor(store, repository(log), storage, {} as ScanAdapter);

    await processor.process(completionEvent());

    expect(log.transactions).toEqual([1]);
    expect(log.failed).toHaveLength(1);
    expect(log.failed[0]).toMatchObject({ code: 'BUSINESS_RULE_VIOLATION', status: 409 });
  });

  it('quarantines a scan after the fifth unavailable attempt with an auditable store transition', async () => {
    const log = { failed: [] as unknown[], completed: [], transactions: [] as number[] };
    const store = {
      async findWorkerFile() { return { file: file(FileState.SCANNING), objectKey: 'private/object', expiresAt: new Date(Date.now() + 60_000), intentStatus: 'CONSUMED' as const }; },
      async markQuarantined(_client: unknown, _org: string, _file: string, _event: string, stage: string, reason: string) { log.transactions.push(1); expect(stage).toBe('SCANNING'); expect(reason).toBe('Error'); return file(FileState.QUARANTINED); },
    } as unknown as PostgresFilesStore;
    const scanner = { async scan() { throw new Error('scanner timeout'); } } as unknown as ScanAdapter;
    const processor = new FileCommandProcessor(store, repository(log), {} as ObjectStorageAdapter, scanner);

    await processor.process({ id: eventId, topic: 'file.scan.requested', organizationId, attempts: 5, payload: { fileId, organizationId, scanEventId: eventId } });

    expect(log.transactions).toEqual([1]);
    expect(log.failed).toHaveLength(0);
  });
});
