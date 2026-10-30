import { buildProblem } from '../../api/src/common/http/problem.js';
import { FileDependencyUnavailableError, FileIntegrityError, validateUploadedObject } from '../../api/src/modules/files/domain/files.js';
import { FileCommandFailureError } from '../../api/src/modules/files/application/files.service.js';
import type { PostgresFilesStore, FileRecord } from '../../api/src/modules/files/infrastructure/postgres-files.store.js';
import type { ObjectStorageAdapter, ScanAdapter } from '../../api/src/modules/files/infrastructure/file-adapters.js';
import type { PostgresIdempotencyRepository } from '../../api/src/modules/integration/idempotency/postgres-idempotency-repository.js';
import type { CommandResult } from '../../api/src/modules/integration/idempotency/in-memory-idempotency-store.js';
import type { OutboxEvent } from './worker.js';

export class FileCommandProcessor {
  constructor(
    private readonly store: PostgresFilesStore,
    private readonly repository: PostgresIdempotencyRepository,
    private readonly objectStorage: ObjectStorageAdapter,
    private readonly scanner: ScanAdapter,
  ) {}

  async process(event: OutboxEvent): Promise<void> {
    if (event.topic === 'file.complete.requested') {
      await this.processCompletion(event);
      return;
    }
    if (event.topic === 'file.scan.requested') {
      await this.processScan(event);
    }
  }

  private async processCompletion(event: OutboxEvent): Promise<void> {
    const command = parseCompletion(event.payload);
    const snapshot = await this.store.findWorkerFile(command.organizationId, command.fileId);
    if (snapshot === undefined) throw new Error('File completion target is missing.');
    if (snapshot.file.status !== 'PENDING_UPLOAD') return;
    if (snapshot.intentStatus !== 'ACTIVE' || snapshot.expiresAt.getTime() <= Date.now()) {
      await this.finishExpiredCompletion(command);
      return;
    }
    const object = await this.objectStorage.headObject(snapshot.objectKey);
    if (object === undefined) throw new FileDependencyUnavailableError();
    try {
      validateUploadedObject({
        declaredSizeBytes: snapshot.file.sizeBytes,
        declaredContentType: snapshot.file.contentType,
        ...(snapshot.file.checksum === undefined ? {} : { declaredChecksum: snapshot.file.checksum }),
        actualSizeBytes: object.sizeBytes,
        actualContentType: object.contentType,
        actualChecksum: object.checksum,
      });
    } catch (error) {
      if (!(error instanceof FileIntegrityError)) throw error;
      await this.finishRejectedCompletion(command, error);
      return;
    }

    await this.repository.withTransaction(async (client) => {
      const ownerState = await this.repository.checkCommandOwner(client, command.commandId, command.operationId, command.ownerToken);
      if (ownerState !== 'OWNED') return;
      await client.query('SAVEPOINT file_complete');
      try {
        const uploaded = await this.store.markUploaded(client, command.organizationId, command.fileId, object, command.eventId);
        if (uploaded === undefined) throw new Error('File completion state changed before worker commit.');
        const file = await this.store.markScanning(client, command.organizationId, command.fileId, command.eventId);
        if (file === undefined) throw new Error('File upload state changed before scan enqueue.');
        const result: CommandResult<Record<string, unknown>> = {
          status: 200,
          body: toApiFile(file),
          resource: { type: 'FILE', id: file.id, version: file.version, href: `/api/v1/files/${file.id}` },
        };
        await this.repository.complete(client, command.commandId, command.ownerToken, result);
        await client.query('RELEASE SAVEPOINT file_complete');
      } catch (error) {
        await client.query('ROLLBACK TO SAVEPOINT file_complete');
        if (error instanceof FileCommandFailureError) {
          await this.repository.fail(client, command.commandId, command.ownerToken, error.problem);
          await client.query('RELEASE SAVEPOINT file_complete');
          return;
        }
        throw error;
      }
    });
  }

  private async finishRejectedCompletion(command: ParsedCompletion, error: FileIntegrityError): Promise<void> {
    await this.repository.withTransaction(async (client) => {
      const ownerState = await this.repository.checkCommandOwner(client, command.commandId, command.operationId, command.ownerToken);
      if (ownerState !== 'OWNED') return;
      await client.query('SAVEPOINT file_reject');
      try {
        await this.store.markIntegrityRejected(client, command.organizationId, command.fileId, command.eventId, `integrity-${error.reason}`);
        const problem = buildProblem({ status: 409, code: 'BUSINESS_RULE_VIOLATION', title: 'Uploaded file integrity check failed', requestId: command.requestId, retryable: false });
        await this.repository.fail(client, command.commandId, command.ownerToken, problem);
        await client.query('RELEASE SAVEPOINT file_reject');
      } catch (failure) {
        await client.query('ROLLBACK TO SAVEPOINT file_reject');
        throw failure;
      }
    });
  }

  private async finishExpiredCompletion(command: ParsedCompletion): Promise<void> {
    await this.repository.withTransaction(async (client) => {
      const ownerState = await this.repository.checkCommandOwner(client, command.commandId, command.operationId, command.ownerToken);
      if (ownerState !== 'OWNED') return;
      await client.query('SAVEPOINT file_expired');
      try {
        await this.store.markUploadIntentExpired(client, command.organizationId, command.fileId, command.eventId);
        const problem = buildProblem({
          status: 409,
          code: 'STATE_CONFLICT',
          title: 'File state conflict',
          requestId: command.requestId,
          retryable: false,
          meta: { resourceType: 'FILE', resourceId: command.fileId, currentState: 'UPLOAD_INTENT_EXPIRED' },
        });
        await this.repository.fail(client, command.commandId, command.ownerToken, problem);
        await client.query('RELEASE SAVEPOINT file_expired');
      } catch (failure) {
        await client.query('ROLLBACK TO SAVEPOINT file_expired');
        throw failure;
      }
    });
  }

  private async processScan(event: OutboxEvent): Promise<void> {
    const command = parseScan(event.payload);
    const snapshot = await this.store.findWorkerFile(command.organizationId, command.fileId);
    if (snapshot === undefined || snapshot.file.status !== 'SCANNING') return;
    const result = await this.scanner.scan({ objectKey: snapshot.objectKey, contentType: snapshot.file.contentType, sizeBytes: snapshot.file.sizeBytes });
    await this.repository.withTransaction(async (client) => {
      await this.store.applyScanResult(client, {
        organizationId: command.organizationId,
        fileId: command.fileId,
        eventId: command.scanEventId,
        result,
        engine: 'controlled-fake',
        engineVersion: '1',
      });
    });
  }
}

interface ParsedCompletion {
  eventId: string;
  fileId: string;
  organizationId: string;
  commandId: string;
  operationId: string;
  ownerToken: Buffer;
  requestId: string;
}

interface ParsedScan {
  fileId: string;
  organizationId: string;
  scanEventId: string;
}

function parseCompletion(payload: Record<string, unknown>): ParsedCompletion {
  if (!isRecord(payload) || !isString(payload.eventId) || !isString(payload.fileId) || !isString(payload.organizationId) || !isString(payload.commandId) || !isString(payload.operationId) || !isString(payload.ownerToken) || !isString(payload.requestId)) throw new Error('Invalid file completion payload.');
  const ownerToken = Buffer.from(payload.ownerToken, 'base64');
  if (ownerToken.length < 16) throw new Error('Invalid file completion owner token.');
  return { eventId: payload.eventId, fileId: payload.fileId, organizationId: payload.organizationId, commandId: payload.commandId, operationId: payload.operationId, ownerToken, requestId: payload.requestId };
}

function parseScan(payload: Record<string, unknown>): ParsedScan {
  if (!isRecord(payload) || !isString(payload.fileId) || !isString(payload.organizationId) || !isString(payload.scanEventId)) throw new Error('Invalid file scan payload.');
  return { fileId: payload.fileId, organizationId: payload.organizationId, scanEventId: payload.scanEventId };
}

function toApiFile(file: FileRecord): Record<string, unknown> {
  return {
    id: file.id,
    organizationId: file.organizationId,
    version: file.version,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    fileName: file.fileName,
    contentType: file.contentType,
    sizeBytes: file.sizeBytes,
    ...(file.checksum === undefined ? {} : { checksum: file.checksum }),
    status: file.status,
    metadata: file.metadata,
    href: `/api/v1/files/${file.id}`,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
