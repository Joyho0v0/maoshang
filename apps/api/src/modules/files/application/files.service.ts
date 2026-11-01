import { randomBytes, randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import type { AuthorizationPrincipal } from '../../identity/domain/authz.js';
import { CommandFailureError, type CommandResult } from '../../integration/idempotency/in-memory-idempotency-store.js';
import type { PostgresClaim } from '../../integration/idempotency/postgres-idempotency-repository.js';
import { buildProblem, type ProblemDocument } from '../../../common/http/problem.js';
import { formatEtag, parseEtag } from '../../../common/http/etag.js';
import {
  assertCompleteAction,
  assertSupportedContentType,
  FileAuthorizationDeniedError,
  FileDependencyUnavailableError,
  FileIntegrityError,
  FileNotFoundError,
  FilePolicyError,
  FileState,
  FileStateConflictError,
  isFileVisibleToPrincipal,
  isAllowedFileLink,
  matchesScope,
  buildServerObjectKey,
} from '../domain/files.js';
import type { DownloadTransfer, ObjectStorageAdapter, UploadTransfer } from '../infrastructure/file-adapters.js';
import type { PostgresFilesStore, FileRecord, FileWithLinks } from '../infrastructure/postgres-files.store.js';

const UPLOAD_INTENT_TTL_MS = 15 * 60 * 1000;
const DOWNLOAD_INTENT_TTL_MS = 5 * 60 * 1000;

export interface FileCreateRequest {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  checksum?: string;
  metadata?: Record<string, unknown>;
}

export interface FileCommandRequest {
  action: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface OrderFileAuthorizationResolver {
  resolve(organizationId: string, orderId: string, executor?: { query: PoolClient['query'] }): Promise<{ ownerUserId: string; businessGroupId: string | null } | undefined>;
}

export class FileIntentExpiredError extends Error {
  constructor() {
    super('The upload intent has expired.');
    this.name = 'FileIntentExpiredError';
  }
}

export class FilesService {
  constructor(
    private readonly store: PostgresFilesStore,
    private readonly objectStorage: ObjectStorageAdapter,
    private readonly orderResolver?: OrderFileAuthorizationResolver,
  ) {}

  async createUploadIntent(principal: AuthorizationPrincipal, input: FileCreateRequest, requestId: string, client: PoolClient): Promise<{ file: FileRecord; href: string; transfer: UploadTransfer }> {
    if (principal.status !== 'ACTIVE') throw new FileCommandFailureError(permissionDenied(requestId));
    let fileName: string;
    let contentType: string;
    let checksum: string | undefined;
    let metadata: Record<string, unknown>;
    try {
      assertSupportedContentType(input.contentType, input.sizeBytes);
      fileName = normalizeFileName(input.fileName);
      contentType = normalizeContentType(input.contentType);
      checksum = normalizeChecksum(input.checksum);
      metadata = sanitizeMetadata(input.metadata);
    } catch (error) {
      throw new FileCommandFailureError(uploadInputProblem(error, requestId));
    }
    if (!principal.permissions.has('file.create') || principal.scopes.get('FILE')?.resourceType !== 'FILE') throw new FileCommandFailureError(permissionDenied(requestId));

    const fileId = randomUUID();
    const scope = principal.scopes.get('FILE') as { resourceType: string; scopeType: 'OWN' | 'GROUP_SET' | 'ALL_ORG'; groupIds: readonly string[] };
    const businessGroupId = scope.scopeType === 'GROUP_SET'
      ? await this.store.resolvePrimaryBusinessGroup(client, principal.organizationId, principal.userId, scope.groupIds)
      : undefined;
    if (scope.scopeType === 'GROUP_SET' && businessGroupId === undefined) throw new FileCommandFailureError(permissionDenied(requestId));
    const objectKey = buildServerObjectKey(principal.organizationId, fileId, randomBytes(24).toString('hex'));
    const expiresAt = new Date(Date.now() + UPLOAD_INTENT_TTL_MS);

    // The configured adapter for this task is explicitly a local controlled
    // fake. A real provider signer must be introduced only through a separate
    // approved adapter and an async boundary, never while a DB lock is held.
    const transfer = await this.objectStorage.createUploadTransfer({ objectKey, contentType, sizeBytes: input.sizeBytes, expiresAt });
    const file = await this.store.createUploadIntent(client, {
      fileId,
      organizationId: principal.organizationId,
      createdBy: principal.userId,
      ...(businessGroupId === undefined ? {} : { businessGroupId }),
      objectKey,
      fileName,
      contentType,
      sizeBytes: input.sizeBytes,
      ...(checksum === undefined ? {} : { checksum }),
      metadata,
      expiresAt,
      requestId,
    });
    return { file, href: `/api/v1/files/${file.id}`, transfer };
  }

  async getFile(principal: AuthorizationPrincipal, fileId: string): Promise<FileRecord> {
    this.assertActive(principal);
    const file = await this.store.findFileWithLinks(principal.organizationId, fileId);
    if (file === undefined || (!canReadFileMetadata(principal, file) && !(await this.hasAuthorizedLink(principal, file)))) throw new FileNotFoundError();
    return file;
  }

  async completeUpload(principal: AuthorizationPrincipal, fileId: string, input: FileCommandRequest, expectedEtag: string | undefined, requestId: string, client: PoolClient, claim: PostgresClaim): Promise<CommandResult<Record<string, unknown>>> {
    if (principal.status !== 'ACTIVE') throw new FileCommandFailureError(permissionDenied(requestId));
    if (!principal.permissions.has('file.create') || principal.scopes.get('FILE')?.resourceType !== 'FILE') throw new FileCommandFailureError(permissionDenied(requestId));
    try {
      assertCompleteAction(input.action);
    } catch (error) {
      if (error instanceof FileStateConflictError) throw new FileCommandFailureError(stateConflict(requestId, { id: fileId, status: error.currentState }));
      throw error;
    }
    const expectedVersion = parseEtag(expectedEtag);
    if (expectedVersion === undefined) throw new FileCommandFailureError(buildProblem({ status: 400, code: 'VALIDATION_FAILED', title: 'Validation failed', requestId, retryable: false, violations: [{ field: 'If-Match', code: 'INVALID', message: 'A valid file version ETag is required.' }] }));
    const snapshot = await this.store.findCompletionSnapshot(client, principal.organizationId, fileId);
    if (snapshot === undefined || !canMutateFile(principal, snapshot.file)) throw new FileCommandFailureError(resourceNotFound(requestId));
    if (snapshot.file.version !== expectedVersion) throw new FileCommandFailureError(versionConflict(requestId, snapshot.file));
    if (snapshot.file.status !== FileState.PENDING_UPLOAD) throw new FileCommandFailureError(stateConflict(requestId, snapshot.file));
    if (snapshot.intentStatus !== 'ACTIVE' || snapshot.expiresAt.getTime() <= Date.now()) throw new FileCommandFailureError(fileConflict(requestId, fileId, 'UPLOAD_INTENT_EXPIRED'));
    if (claim.ownerToken === undefined) throw new Error('File command idempotency owner token is missing.');

    const eventId = randomUUID();
    await client.query(
      `INSERT INTO integration.outbox_event
        (id, organization_id, aggregate_type, aggregate_id, event_type, payload)
       VALUES ($1, $2, 'FILE', $3, 'file.complete.requested', $4::jsonb)`,
      [eventId, principal.organizationId, fileId, JSON.stringify({
        eventId,
        fileId,
        organizationId: principal.organizationId,
        actorUserId: principal.userId,
        requestId,
        commandId: claim.commandId,
        operationId: 'completeUpload',
        ownerToken: claim.ownerToken.toString('base64'),
        startedAt: claim.startedAt,
        expiresAt: claim.expiresAt,
        retryAfterMs: claim.retryAfterMs,
      })],
    );
    const body = {
      commandId: claim.commandId,
      operationId: 'completeUpload',
      state: 'IN_PROGRESS',
      startedAt: claim.startedAt,
      completedAt: null,
      expiresAt: claim.expiresAt,
      retryAfterMs: Math.max(1, claim.retryAfterMs),
      httpStatus: null,
      resource: null,
      resultHref: null,
      problem: null,
    };
    return { status: 202, body };
  }

  async replayUploadIntent(principal: AuthorizationPrincipal, fileId: string, requestId: string, stored: CommandResult<unknown>): Promise<CommandResult<unknown>> {
    if (principal.status !== 'ACTIVE' || !principal.permissions.has('file.create') || principal.scopes.get('FILE')?.resourceType !== 'FILE') {
      throw new FileCommandFailureError(permissionDenied(requestId));
    }
    const resource = stored.resource;
    if (resource?.type !== 'FILE' || resource.id !== fileId) throw new FileCommandFailureError(fileConflict(requestId, fileId, 'UPLOAD_INTENT_UNAVAILABLE'));
    const snapshot = await this.store.findUploadIntentForReplay(principal.organizationId, fileId);
    if (snapshot === undefined) throw new FileCommandFailureError(fileConflict(requestId, fileId, 'UPLOAD_INTENT_UNAVAILABLE'));
    if (!canMutateFile(principal, snapshot.file)) throw new FileCommandFailureError(permissionDenied(requestId));
    if (snapshot.file.status !== FileState.PENDING_UPLOAD) throw new FileCommandFailureError(stateConflict(requestId, snapshot.file));
    const now = Date.now();
    if (snapshot.intentStatus !== 'ACTIVE' || snapshot.expiresAt.getTime() <= now) throw new FileCommandFailureError(fileConflict(requestId, fileId, 'UPLOAD_INTENT_EXPIRED'));
    const expiresAt = new Date(Math.min(snapshot.expiresAt.getTime(), now + UPLOAD_INTENT_TTL_MS));
    const transfer = await this.objectStorage.createUploadTransfer({ objectKey: snapshot.objectKey, contentType: snapshot.file.contentType, sizeBytes: snapshot.file.sizeBytes, expiresAt });
    const href = `/api/v1/files/${fileId}`;
    return {
      status: 201,
      body: { file: toApiFile(snapshot.file, href), href, transfer },
      resource: { type: 'FILE', id: fileId, version: snapshot.file.version, href },
      resultHref: href,
      responseHeaders: { location: href, 'content-location': href, etag: formatEtag(snapshot.file.version), 'cache-control': 'no-store' },
    };
  }

  async createDownloadIntent(principal: AuthorizationPrincipal, fileId: string, requestId: string): Promise<{ file: FileRecord; href: string; transfer: DownloadTransfer }> {
    this.assertActive(principal);
    const fileWithLinks = await this.store.findFileWithLinks(principal.organizationId, fileId);
    if (fileWithLinks === undefined || (!canReadFileMetadata(principal, fileWithLinks) && !(await this.hasAuthorizedLink(principal, fileWithLinks)))) throw new FileNotFoundError();
    if (fileWithLinks.status !== FileState.AVAILABLE) throw new FileCommandFailureError(fileNotReady(requestId, fileWithLinks));
    const transfer = await this.objectStorage.createDownloadTransfer({ objectKey: fileWithLinks.objectKey, expiresAt: new Date(Date.now() + DOWNLOAD_INTENT_TTL_MS) });
    const latest = await this.store.findFileWithLinks(principal.organizationId, fileId);
    if (latest === undefined || latest.status !== FileState.AVAILABLE || (!canReadFileMetadata(principal, latest) && !(await this.hasAuthorizedLink(principal, latest)))) throw new FileNotFoundError();
    await this.store.recordDownloadIssued(principal.organizationId, principal.userId, fileId, requestId);
    return { file: latest, href: `/api/v1/files/${fileId}`, transfer };
  }

  async linkOrderImage(client: PoolClient, input: { principal: AuthorizationPrincipal; fileId: string; orderId: string; ownerUserId: string; businessGroupId: string | null; requiredPermission: 'order.create' | 'order.update' }): Promise<void> {
    this.assertActive(input.principal);
    if (!input.principal.permissions.has('file.read') || !input.principal.permissions.has(input.requiredPermission)) throw new FileAuthorizationDeniedError();
    const currentOrder = this.orderResolver === undefined ? undefined : await this.orderResolver.resolve(input.principal.organizationId, input.orderId, client);
    const ownerUserId = currentOrder?.ownerUserId ?? input.ownerUserId;
    const businessGroupId = currentOrder?.businessGroupId ?? input.businessGroupId;
    const file = await this.store.findFileForUpdate(client, input.principal.organizationId, input.fileId);
    const fileScope = input.principal.scopes.get('FILE');
    const orderScope = input.principal.scopes.get('ORDER');
    if (file === undefined || file.status !== FileState.AVAILABLE || fileScope === undefined || orderScope === undefined
      || !matchesScope(fileScope, input.principal.userId, file.createdBy, file.businessGroupId)
      || !matchesScope(orderScope, input.principal.userId, ownerUserId, businessGroupId)) throw new FileAuthorizationDeniedError();
    await this.store.linkFile(client, {
      organizationId: input.principal.organizationId,
      fileId: input.fileId,
      resourceType: 'ORDER',
      resourceId: input.orderId,
      purpose: 'IMAGE',
      linkedBy: input.principal.userId,
      resourceOwnerId: ownerUserId,
      ...(businessGroupId === null ? {} : { resourceBusinessGroupId: businessGroupId }),
    });
  }

  async linkAvailableFile(client: PoolClient, input: { principal: AuthorizationPrincipal; fileId: string; resourceType: string; resourceId: string; purpose: string; resourceOwnerId?: string; resourceBusinessGroupId?: string }): Promise<void> {
    this.assertActive(input.principal);
    const normalizedResourceType = input.resourceType.trim().toUpperCase();
    if (!input.principal.permissions.has('file.create')
      || input.principal.scopes.get('FILE')?.resourceType !== 'FILE'
      || !input.principal.permissions.has(`${normalizedResourceType.toLowerCase()}.read`)
      || !isAllowedFileLink(normalizedResourceType, input.purpose)) throw new FileAuthorizationDeniedError();
    const file = await this.store.findFile(input.principal.organizationId, input.fileId);
    const fileScope = input.principal.scopes.get('FILE');
    const resourceType = normalizedResourceType;
    const resourceScope = input.principal.scopes.get(resourceType);
    if (file === undefined || fileScope === undefined || resourceScope === undefined
      || !canMutateFile(input.principal, file)
      || !matchesScope(resourceScope, input.principal.userId, input.resourceOwnerId, input.resourceBusinessGroupId)) throw new FileAuthorizationDeniedError();
    await this.store.linkFile(client, {
      organizationId: input.principal.organizationId,
      fileId: input.fileId,
      resourceType,
      resourceId: input.resourceId,
      purpose: input.purpose,
      linkedBy: input.principal.userId,
      ...(input.resourceOwnerId === undefined ? {} : { resourceOwnerId: input.resourceOwnerId }),
      ...(input.resourceBusinessGroupId === undefined ? {} : { resourceBusinessGroupId: input.resourceBusinessGroupId }),
    });
  }

  private assertActive(principal: AuthorizationPrincipal): void {
    if (principal.status !== 'ACTIVE') throw new FileAuthorizationDeniedError();
  }

  private async hasAuthorizedLink(principal: AuthorizationPrincipal, file: FileWithLinks): Promise<boolean> {
    const fileScope = principal.scopes.get('FILE');
    if (fileScope === undefined) return false;
    for (const link of file.links) {
      const resourceType = link.resourceType.toUpperCase();
      const resourceScope = principal.scopes.get(resourceType);
      let ownerId = link.resourceOwnerId;
      let groupId = link.resourceBusinessGroupId;
      if (resourceType === 'ORDER' && this.orderResolver !== undefined) {
        const current = await this.orderResolver.resolve(principal.organizationId, link.resourceId);
        if (current === undefined) continue;
        ownerId = current.ownerUserId;
        groupId = current.businessGroupId ?? undefined;
      }
      if (isFileVisibleToPrincipal({
        organizationId: file.organizationId,
        principalOrganizationId: principal.organizationId,
        createdBy: file.createdBy,
        ...(file.businessGroupId === undefined ? {} : { businessGroupId: file.businessGroupId }),
        linkedResourceType: resourceType,
        linkedResourcePurpose: link.purpose,
        ...(ownerId === undefined ? {} : { linkedResourceOwnerId: ownerId }),
        ...(groupId === undefined ? {} : { linkedResourceGroupId: groupId }),
        userId: principal.userId,
        permissions: principal.permissions,
        fileScope,
        ...(resourceScope === undefined ? {} : { resourceScope }),
      })) return true;
    }
    return false;
  }
}

export class FileCommandFailureError extends CommandFailureError {
  constructor(problem: ProblemDocument) {
    super(problem);
    this.name = 'FileCommandFailureError';
  }
}

function normalizeFileName(value: string): string {
  const name = value.trim();
  if (name.length < 1 || name.length > 256 || hasControlCharacter(name)) throw new Error('File name is invalid.');
  return name;
}

function normalizeContentType(value: string): string {
  const contentType = value.trim().toLowerCase();
  if (contentType.length < 1 || contentType.length > 256 || /[\s;]/.test(contentType)) throw new Error('File media type is invalid.');
  return contentType;
}

function normalizeChecksum(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const checksum = value.trim();
  if (checksum.length < 1 || checksum.length > 256 || hasControlCharacter(checksum)) throw new Error('File checksum is invalid.');
  return checksum;
}

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
}

function sanitizeMetadata(value: Record<string, unknown> | undefined): Record<string, unknown> {
  if (value === undefined) return {};
  const json = JSON.stringify(value);
  if (json === undefined || json.length > 32_768) throw new Error('File metadata is invalid.');
  return JSON.parse(json) as Record<string, unknown>;
}

function canMutateFile(principal: AuthorizationPrincipal, file: FileRecord): boolean {
  const scope = principal.scopes.get('FILE');
  if (scope === undefined || scope.resourceType !== 'FILE' || file.organizationId !== principal.organizationId) return false;
  if (scope.scopeType === 'ALL_ORG') return true;
  if (scope.scopeType === 'OWN') return file.createdBy === principal.userId;
  return file.businessGroupId !== undefined && scope.groupIds.includes(file.businessGroupId);
}

function canReadFileMetadata(principal: AuthorizationPrincipal, file: FileRecord): boolean {
  if (!principal.permissions.has('file.read')) return false;
  const scope = principal.scopes.get('FILE');
  if (scope === undefined || scope.resourceType !== 'FILE' || file.organizationId !== principal.organizationId) return false;
  if (scope.scopeType === 'ALL_ORG') return true;
  if (scope.scopeType === 'OWN') return file.createdBy === principal.userId;
  return file.businessGroupId !== undefined && scope.groupIds.includes(file.businessGroupId);
}

function resourceNotFound(requestId: string): ProblemDocument {
  return buildProblem({ status: 404, code: 'RESOURCE_NOT_FOUND', title: 'Resource not found', requestId, retryable: false });
}

function versionConflict(requestId: string, file: FileRecord): ProblemDocument {
  return buildProblem({ status: 409, code: 'VERSION_CONFLICT', title: 'Resource version conflict', requestId, retryable: false, meta: { currentVersion: file.version, currentEtag: formatEtag(file.version), resourceHref: `/api/v1/files/${file.id}` } });
}

function stateConflict(requestId: string, file: Pick<FileRecord, 'id' | 'status'>): ProblemDocument {
  return buildProblem({ status: 409, code: 'STATE_CONFLICT', title: 'File state conflict', requestId, retryable: false, meta: { resourceType: 'FILE', resourceId: file.id, currentState: file.status } });
}

function fileConflict(requestId: string, fileId: string, state: string): ProblemDocument {
  return buildProblem({ status: 409, code: 'STATE_CONFLICT', title: 'File state conflict', requestId, retryable: false, meta: { resourceType: 'FILE', resourceId: fileId, currentState: state } });
}

function fileNotReady(requestId: string, file: FileRecord): ProblemDocument {
  return buildProblem({ status: 409, code: 'FILE_NOT_READY', title: 'File is not ready', requestId, retryable: true, meta: { fileId: file.id, state: file.status, statusHref: `/api/v1/files/${file.id}` } });
}

function permissionDenied(requestId: string): ProblemDocument {
  return buildProblem({ status: 403, code: 'PERMISSION_DENIED', title: 'Permission denied', requestId, retryable: false });
}

function uploadInputProblem(error: unknown, requestId: string): ProblemDocument {
  if (error instanceof FilePolicyError) {
    return error.reason === 'size'
      ? buildProblem({ status: 413, code: 'FILE_TOO_LARGE', title: 'File is too large', requestId, retryable: false })
      : buildProblem({ status: 415, code: 'UNSUPPORTED_MEDIA_TYPE', title: 'Unsupported file media type', requestId, retryable: false });
  }
  return buildProblem({
    status: 400,
    code: 'VALIDATION_FAILED',
    title: 'Validation failed',
    requestId,
    retryable: false,
    violations: [{ field: 'file', code: 'INVALID', message: 'File metadata is invalid.' }],
  });
}

export function problemForFileError(error: unknown, requestId: string, fileId?: string): ProblemDocument | undefined {
  if (error instanceof FileCommandFailureError) return error.problem;
  if (error instanceof FileNotFoundError || error instanceof FileAuthorizationDeniedError) return buildProblem({ status: 404, code: 'RESOURCE_NOT_FOUND', title: 'Resource not found', requestId, retryable: false });
  if (error instanceof FileStateConflictError) return buildProblem({ status: 409, code: 'STATE_CONFLICT', title: 'File state conflict', requestId, retryable: false, meta: { resourceType: 'FILE', resourceId: fileId ?? '00000000-0000-4000-8000-000000000000', currentState: error.currentState } });
  if (error instanceof FileIntentExpiredError) return fileConflict(requestId, fileId ?? '00000000-0000-4000-8000-000000000000', 'UPLOAD_INTENT_EXPIRED');
  if (error instanceof FileDependencyUnavailableError) return buildProblem({ status: 503, code: 'DEPENDENCY_UNAVAILABLE', title: 'File dependency unavailable', requestId, retryable: true });
  if (error instanceof FileIntegrityError) return buildProblem({ status: 409, code: 'BUSINESS_RULE_VIOLATION', title: 'Uploaded file integrity check failed', requestId, retryable: false });
  if (error instanceof FilePolicyError) return uploadInputProblem(error, requestId);
  return undefined;
}

export function toApiFile(file: FileRecord, href: string): Record<string, unknown> {
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
    href,
  };
}
