import type { DataScopeGrant, DataScopeType } from '../../identity/domain/authz.js';

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export enum FileState {
  PENDING_UPLOAD = 'PENDING_UPLOAD',
  UPLOADED = 'UPLOADED',
  SCANNING = 'SCANNING',
  AVAILABLE = 'AVAILABLE',
  REJECTED = 'REJECTED',
  QUARANTINED = 'QUARANTINED',
}

export type ScanResult = 'CLEAN' | 'MALICIOUS' | 'UNKNOWN';

export interface UploadedObjectMetadata {
  sizeBytes: number;
  contentType: string;
  checksum: string;
}

export interface DeclaredObjectMetadata {
  declaredSizeBytes: number;
  declaredContentType: string;
  declaredChecksum?: string;
  actualSizeBytes: number;
  actualContentType: string;
  actualChecksum: string;
}

export class FileIntegrityError extends Error {
  constructor(readonly reason: 'size' | 'content-type' | 'checksum') {
    super('Uploaded object metadata does not match the declared file metadata.');
    this.name = 'FileIntegrityError';
  }
}

export class FilePolicyError extends Error {
  constructor(readonly reason: 'size' | 'content-type') {
    super(reason === 'size' ? 'File size is too large or invalid.' : 'File media type is not supported.');
    this.name = 'FilePolicyError';
  }
}

export class FileStateConflictError extends Error {
  constructor(readonly currentState: FileState) {
    super('The file is not in a state that accepts this command.');
    this.name = 'FileStateConflictError';
  }
}

export class FileDependencyUnavailableError extends Error {
  constructor() {
    super('The file dependency is temporarily unavailable.');
    this.name = 'FileDependencyUnavailableError';
  }
}

export class FileObjectNotFoundError extends Error {
  constructor() {
    super('The uploaded object was not found.');
    this.name = 'FileObjectNotFoundError';
  }
}

export class FileNotFoundError extends Error {
  constructor() {
    super('The file is not available.');
    this.name = 'FileNotFoundError';
  }
}

export class FileAuthorizationDeniedError extends Error {
  constructor() {
    super('The file is not available to this principal.');
    this.name = 'FileAuthorizationDeniedError';
  }
}

const FILE_LINK_PURPOSES = new Set([
  'ATTACHMENT',
  'DOCUMENT',
  'EVIDENCE',
  'IMAGE',
  'PROOF',
]);

export const FILE_LINK_RESOURCE_TYPES = new Set(['CUSTOMER', 'DOCUMENT', 'INVENTORY', 'ORDER', 'PAYMENT', 'TASK']);

export function isAllowedFileLink(resourceType: string, purpose: string): boolean {
  const normalizedType = resourceType.trim().toUpperCase();
  const normalizedPurpose = purpose.trim().toUpperCase();
  return FILE_LINK_RESOURCE_TYPES.has(normalizedType)
    && (FILE_LINK_PURPOSES.has(normalizedPurpose)
      || normalizedPurpose === `${normalizedType}_ATTACHMENT`
      || normalizedPurpose === `${normalizedType}_EVIDENCE`
      || normalizedPurpose === `${normalizedType}_PROOF`);
}

export function assertCompleteAction(action: string): void {
  if (action !== 'COMPLETE' && action !== 'COMPLETE_UPLOAD') throw new FileStateConflictError(FileState.PENDING_UPLOAD);
}

export function assertSupportedContentType(contentType: string, sizeBytes: number): void {
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_FILE_SIZE_BYTES) throw new FilePolicyError('size');
  if (!isSupportedContentType(contentType)) throw new FilePolicyError('content-type');
}

export function isSupportedContentType(contentType: string): boolean {
  const normalized = contentType.trim().toLowerCase();
  return normalized === 'application/pdf'
    || normalized === 'application/json'
    || normalized === 'text/plain'
    || normalized === 'application/zip'
    || normalized === 'application/vnd.ms-excel'
    || normalized === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || normalized === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    || normalized === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    || /^image\/(?:jpeg|png|webp|gif|bmp|tiff)$/.test(normalized);
}

export function validateUploadedObject(input: DeclaredObjectMetadata): true {
  if (input.actualSizeBytes !== input.declaredSizeBytes) throw new FileIntegrityError('size');
  if (input.actualContentType.trim().toLowerCase() !== input.declaredContentType.trim().toLowerCase()) throw new FileIntegrityError('content-type');
  if (input.declaredChecksum !== undefined && input.declaredChecksum !== input.actualChecksum) throw new FileIntegrityError('checksum');
  return true;
}

export function nextFileStateAfterScan(result: ScanResult): FileState.AVAILABLE | FileState.REJECTED {
  return result === 'CLEAN' ? FileState.AVAILABLE : FileState.REJECTED;
}

export interface FileVisibilityInput {
  organizationId: string;
  principalOrganizationId: string;
  createdBy: string;
  businessGroupId?: string | null;
  linkedResourceType?: string | null;
  linkedResourcePurpose?: string | null;
  linkedResourceOwnerId?: string | null;
  linkedResourceGroupId?: string | null;
  userId: string;
  permissions: ReadonlySet<string>;
  fileScope: { scopeType: DataScopeType; groupIds: readonly string[] };
  resourceScope?: DataScopeGrant | null;
}

export function isFileVisibleToPrincipal(input: FileVisibilityInput): boolean {
  if (input.organizationId.length === 0
    || input.organizationId !== input.principalOrganizationId
    || input.permissions.has('file.read') === false) return false;
  const resourceType = input.linkedResourceType?.trim().toUpperCase();
  const purpose = input.linkedResourcePurpose;
  if (resourceType === undefined || purpose === undefined || purpose === null || !isAllowedFileLink(resourceType, purpose)) return false;
  const resourceGrant = input.resourceScope;
  if (resourceGrant === undefined || resourceGrant === null || resourceGrant.resourceType !== resourceType) return false;
  if (input.permissions.has(`${resourceType.toLowerCase()}.read`) === false) return false;
  if (!matchesScope(input.fileScope, input.userId, input.createdBy, input.businessGroupId)) return false;
  return matchesScope(resourceGrant, input.userId, input.linkedResourceOwnerId, input.linkedResourceGroupId);
}

export function matchesScope(scope: Pick<DataScopeGrant, 'scopeType' | 'groupIds'>, userId: string, ownerId?: string | null, groupId?: string | null): boolean {
  if (scope.scopeType === 'ALL_ORG') return true;
  if (scope.scopeType === 'OWN') return ownerId === userId;
  return groupId !== undefined && groupId !== null && scope.groupIds.includes(groupId);
}

export function buildServerObjectKey(organizationId: string, fileId: string, nonce: string): string {
  if (organizationId.length === 0 || fileId.length === 0 || nonce.length < 16) throw new Error('Cannot build a file object key from incomplete server values.');
  return `private/${organizationId}/${fileId}/${nonce}`;
}
