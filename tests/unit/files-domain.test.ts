import { describe, expect, it } from 'vitest';
import {
  FileIntegrityError,
  FileState,
  assertCompleteAction,
  assertSupportedContentType,
  isFileVisibleToPrincipal,
  nextFileStateAfterScan,
  validateUploadedObject,
} from '../../apps/api/src/modules/files/domain/files.js';

const orgId = '00000000-0000-4000-8000-000000000001';
const ownerId = '00000000-0000-4000-8000-000000000002';
const groupId = '00000000-0000-4000-8000-000000000003';

describe('files domain', () => {
  it('accepts only the explicit complete command action', () => {
    expect(() => assertCompleteAction('COMPLETE')).not.toThrow();
    expect(() => assertCompleteAction('COMPLETE_UPLOAD')).not.toThrow();
    expect(() => assertCompleteAction('DOWNLOAD')).toThrow(/complete/i);
  });

  it('enforces the non-production file media allowlist and size policy', () => {
    expect(() => assertSupportedContentType('application/pdf', 1024)).not.toThrow();
    expect(() => assertSupportedContentType('image/png', 1024)).not.toThrow();
    expect(() => assertSupportedContentType('application/x-msdownload', 1024)).toThrow(/media/i);
    expect(() => assertSupportedContentType('application/pdf', 50 * 1024 * 1024 + 1)).toThrow(/large|size/i);
  });

  it('fails closed when a completed object does not match the declared metadata', () => {
    expect(() => validateUploadedObject({
      declaredSizeBytes: 12,
      declaredContentType: 'application/pdf',
      declaredChecksum: 'a'.repeat(64),
      actualSizeBytes: 11,
      actualContentType: 'application/pdf',
      actualChecksum: 'a'.repeat(64),
    })).toThrow(FileIntegrityError);

    expect(() => validateUploadedObject({
      declaredSizeBytes: 12,
      declaredContentType: 'application/pdf',
      declaredChecksum: 'a'.repeat(64),
      actualSizeBytes: 12,
      actualContentType: 'application/octet-stream',
      actualChecksum: 'a'.repeat(64),
    })).toThrow(FileIntegrityError);
  });

  it('allows only scan-safe state transitions', () => {
    expect(nextFileStateAfterScan('CLEAN')).toBe(FileState.AVAILABLE);
    expect(nextFileStateAfterScan('MALICIOUS')).toBe(FileState.REJECTED);
    expect(nextFileStateAfterScan('UNKNOWN')).toBe(FileState.REJECTED);
  });

  it('applies organization, file scope, permission, and resource-link checks', () => {
    const base = {
      createdBy: ownerId,
      businessGroupId: groupId,
      linkedResourceType: 'ORDER',
      linkedResourceOwnerId: ownerId,
      linkedResourceGroupId: groupId,
    };
    expect(isFileVisibleToPrincipal({
      userId: ownerId,
      permissions: new Set(['file.read', 'order.read']),
      fileScope: { scopeType: 'OWN', groupIds: [] },
      ...base,
      organizationId: orgId,
    })).toBe(true);
    expect(isFileVisibleToPrincipal({
      userId: '00000000-0000-4000-8000-000000000099',
      permissions: new Set(['file.read', 'order.read']),
      fileScope: { scopeType: 'GROUP_SET', groupIds: [groupId] },
      ...base,
      organizationId: orgId,
    })).toBe(true);
    expect(isFileVisibleToPrincipal({
      userId: ownerId,
      permissions: new Set(['file.read', 'order.read']),
      fileScope: { scopeType: 'ALL_ORG', groupIds: [] },
      ...base,
      organizationId: '00000000-0000-4000-8000-000000000099',
    })).toBe(false);
    expect(isFileVisibleToPrincipal({
      userId: ownerId,
      permissions: new Set(['file.read']),
      fileScope: { scopeType: 'OWN', groupIds: [] },
      ...base,
      organizationId: orgId,
    })).toBe(false);
  });
});
