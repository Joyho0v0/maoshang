import { describe, expect, it } from 'vitest';
import { FileCommandFailureError, FilesService } from '../../apps/api/src/modules/files/application/files.service.js';
import { FileState } from '../../apps/api/src/modules/files/domain/files.js';
import type { PostgresFilesStore } from '../../apps/api/src/modules/files/infrastructure/postgres-files.store.js';
import type { ObjectStorageAdapter } from '../../apps/api/src/modules/files/infrastructure/file-adapters.js';

const organizationId = '00000000-0000-4000-8000-000000000001';
const userId = '00000000-0000-4000-8000-000000000002';
const fileId = '00000000-0000-4000-8000-000000000003';

function principal() {
  return {
    userId,
    organizationId,
    status: 'ACTIVE' as const,
    permissions: new Set(['file.create']),
    scopes: new Map([['FILE', { resourceType: 'FILE', scopeType: 'OWN' as const, groupIds: [] }]]),
    authzVersion: 1,
    sessionEpoch: 1,
  };
}

function downloadPrincipal(fileScope: 'ALL_ORG' | 'OWN' = 'ALL_ORG') {
  return {
    ...principal(),
    permissions: new Set(['file.read', 'order.read']),
    scopes: new Map([
      ['FILE', { resourceType: 'FILE', scopeType: fileScope, groupIds: [] }],
      ['ORDER', { resourceType: 'ORDER', scopeType: 'OWN' as const, groupIds: [] }],
    ]),
  };
}

function snapshot(expiresAt = new Date(Date.now() + 60_000)) {
  return {
    file: {
      id: fileId,
      organizationId,
      createdBy: userId,
      objectKey: `private/${organizationId}/${fileId}/nonce-value`,
      fileName: 'receipt.pdf',
      contentType: 'application/pdf',
      sizeBytes: 12,
      status: FileState.PENDING_UPLOAD,
      metadata: {},
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    objectKey: `private/${organizationId}/${fileId}/nonce-value`,
    expiresAt,
    intentStatus: 'ACTIVE' as const,
  };
}

describe('Files service security and command boundaries', () => {
  it('re-derives a fresh bounded upload transfer from a resource-only replay projection', async () => {
    const transfers: string[] = [];
    const storage: ObjectStorageAdapter = {
      async createUploadTransfer(input) {
        const locator = `https://controlled-object-storage.invalid/upload/${transfers.length + 1}`;
        transfers.push(locator);
        return { kind: 'HTTP_PUT', method: 'PUT', locator, expiresAt: input.expiresAt.toISOString(), headers: { 'X-Controlled-Transfer': String(transfers.length) } };
      },
      async createDownloadTransfer() { throw new Error('not used'); },
      async headObject() { return undefined; },
    };
    const store = { findUploadIntentForReplay: async () => snapshot() } as unknown as PostgresFilesStore;
    const service = new FilesService(store, storage);
    const stored = { status: 201, body: {}, resource: { type: 'FILE', id: fileId, version: 1, href: `/api/v1/files/${fileId}` } };

    const first = await service.replayUploadIntent(principal(), fileId, 'request-1', stored);
    const second = await service.replayUploadIntent(principal(), fileId, 'request-2', stored);

    expect(transfers).toHaveLength(2);
    expect(first.body).toMatchObject({ file: { id: fileId }, transfer: { locator: transfers[0] } });
    expect(second.body).toMatchObject({ file: { id: fileId }, transfer: { locator: transfers[1] } });
    expect(first.body).not.toEqual(second.body);
    expect(first.responseHeaders).toMatchObject({ 'cache-control': 'no-store' });
  });

  it('returns a stable resource-not-found command failure for missing or out-of-scope complete targets', async () => {
    const store = { findCompletionSnapshot: async () => undefined } as unknown as PostgresFilesStore;
    const service = new FilesService(store, {} as ObjectStorageAdapter);
    await expect(service.completeUpload(principal(), fileId, { action: 'COMPLETE' }, '"v1"', 'request-1', {} as never, { ownerToken: Buffer.alloc(32), commandId: 'command-1', operationId: 'completeUpload' } as never)).rejects.toSatisfy((error: unknown) => error instanceof FileCommandFailureError && error.problem.status === 404 && error.problem.code === 'RESOURCE_NOT_FOUND');
  });

  it('fails closed when FILE scope allows the organization but the linked business resource is outside its scope', async () => {
    const storedFile = { ...snapshot(), file: { ...snapshot().file, status: FileState.AVAILABLE } };
    const store = {
      async findFileWithLinks() {
        return { ...storedFile.file, links: [{ resourceType: 'ORDER', resourceId: '00000000-0000-4000-8000-000000000006', purpose: 'ORDER_ATTACHMENT', resourceOwnerId: '00000000-0000-4000-8000-000000000007' }] };
      },
    } as unknown as PostgresFilesStore;
    const storage: ObjectStorageAdapter = {
      async createUploadTransfer() { throw new Error('not used'); },
      async createDownloadTransfer() { throw new Error('must not sign an unauthorized transfer'); },
      async headObject() { return undefined; },
    };
    const service = new FilesService(store, storage);

    await expect(service.createDownloadIntent(downloadPrincipal(), fileId, 'request-1')).rejects.toThrow();
  });

  it('returns a declared state conflict when an upload-intent replay targets a file already advanced by completion', async () => {
    const advanced = snapshot();
    advanced.file.status = FileState.SCANNING;
    const store = { findUploadIntentForReplay: async () => advanced } as unknown as PostgresFilesStore;
    const service = new FilesService(store, {} as ObjectStorageAdapter);

    await expect(service.replayUploadIntent(principal(), fileId, 'request-1', {
      status: 201,
      body: {},
      resource: { type: 'FILE', id: fileId, version: 2, href: `/api/v1/files/${fileId}` },
    })).rejects.toSatisfy((error: unknown) => error instanceof FileCommandFailureError && error.problem.status === 409 && error.problem.code === 'STATE_CONFLICT');
  });

  it.each([FileState.AVAILABLE, FileState.REJECTED, FileState.QUARANTINED])('returns a declared state conflict when replay targets %s', async (status) => {
    const advanced = snapshot();
    advanced.file.status = status;
    const service = new FilesService({ findUploadIntentForReplay: async () => advanced } as unknown as PostgresFilesStore, {} as ObjectStorageAdapter);

    await expect(service.replayUploadIntent(principal(), fileId, 'request-1', {
      status: 201,
      body: {},
      resource: { type: 'FILE', id: fileId, version: 2, href: `/api/v1/files/${fileId}` },
    })).rejects.toSatisfy((error: unknown) => error instanceof FileCommandFailureError && error.problem.status === 409 && error.problem.code === 'STATE_CONFLICT');
  });

  it('uses declared authorization failure when the principal can no longer create files', async () => {
    const service = new FilesService({ findUploadIntentForReplay: async () => snapshot() } as unknown as PostgresFilesStore, {} as ObjectStorageAdapter);
    const revoked = { ...principal(), permissions: new Set<string>() };

    await expect(service.replayUploadIntent(revoked, fileId, 'request-1', {
      status: 201,
      body: {},
      resource: { type: 'FILE', id: fileId, version: 1, href: `/api/v1/files/${fileId}` },
    })).rejects.toSatisfy((error: unknown) => error instanceof FileCommandFailureError && error.problem.status === 403 && error.problem.code === 'PERMISSION_DENIED');
  });
});
