import { createHash, randomBytes } from 'node:crypto';
import { FileDependencyUnavailableError, type UploadedObjectMetadata } from '../domain/files.js';

export interface UploadTransfer {
  kind: 'HTTP_PUT';
  method: 'PUT';
  locator: string;
  expiresAt: string;
  headers: Record<string, string>;
}

export interface DownloadTransfer {
  kind: 'HTTP_GET';
  method: 'GET';
  locator: string;
  expiresAt: string;
  headers: Record<string, string>;
}

export interface ObjectStorageAdapter {
  createUploadTransfer(input: { objectKey: string; contentType: string; sizeBytes: number; expiresAt: Date }): Promise<UploadTransfer>;
  createDownloadTransfer(input: { objectKey: string; expiresAt: Date }): Promise<DownloadTransfer>;
  headObject(objectKey: string): Promise<UploadedObjectMetadata | undefined>;
}

export interface ScanAdapter {
  scan(input: { objectKey: string; contentType: string; sizeBytes: number }): Promise<'CLEAN' | 'MALICIOUS' | 'UNKNOWN'>;
}

interface ControlledObject extends UploadedObjectMetadata {
  objectKey: string;
}

/**
 * Non-production adapter used until an approved object-storage integration is
 * selected. It deliberately uses an invalid reserved host and never performs
 * network I/O or accepts a client-supplied object key.
 */
export class ControlledFakeObjectStorageAdapter implements ObjectStorageAdapter {
  readonly isNonProductionFake = true;
  private readonly transfers = new Map<string, { direction: 'upload' | 'download'; objectKey: string; expiresAt: number }>();
  private readonly objects = new Map<string, ControlledObject>();

  async createUploadTransfer(input: { objectKey: string; contentType: string; sizeBytes: number; expiresAt: Date }): Promise<UploadTransfer> {
    const token = randomBytes(24).toString('base64url');
    const locator = `https://controlled-object-storage.invalid/upload/${token}`;
    this.transfers.set(locator, { direction: 'upload', objectKey: input.objectKey, expiresAt: input.expiresAt.getTime() });
    return {
      kind: 'HTTP_PUT',
      method: 'PUT',
      locator,
      expiresAt: input.expiresAt.toISOString(),
      headers: { 'Content-Type': input.contentType, 'Content-Length': String(input.sizeBytes), 'X-Controlled-Transfer': token },
    };
  }

  async createDownloadTransfer(input: { objectKey: string; expiresAt: Date }): Promise<DownloadTransfer> {
    const token = randomBytes(24).toString('base64url');
    const locator = `https://controlled-object-storage.invalid/download/${token}`;
    this.transfers.set(locator, { direction: 'download', objectKey: input.objectKey, expiresAt: input.expiresAt.getTime() });
    return {
      kind: 'HTTP_GET',
      method: 'GET',
      locator,
      expiresAt: input.expiresAt.toISOString(),
      headers: { 'X-Controlled-Transfer': token },
    };
  }

  async headObject(objectKey: string): Promise<UploadedObjectMetadata | undefined> {
    const object = this.objects.get(objectKey);
    if (object === undefined) return undefined;
    return { sizeBytes: object.sizeBytes, contentType: object.contentType, checksum: object.checksum };
  }

  /** Test-only controlled upload hook; not an HTTP or production upload path. */
  putForTest(locator: string, input: { sizeBytes: number; contentType: string; checksum?: string; bytes?: Uint8Array }): void {
    const transfer = this.transfers.get(locator);
    if (transfer === undefined || transfer.direction !== 'upload' || transfer.expiresAt <= Date.now()) throw new Error('Controlled upload transfer is invalid or expired.');
    const checksum = input.checksum ?? createHash('sha256').update(input.bytes ?? new Uint8Array(input.sizeBytes)).digest('hex');
    this.objects.set(transfer.objectKey, { objectKey: transfer.objectKey, sizeBytes: input.sizeBytes, contentType: input.contentType, checksum });
  }

  objectKeyForTest(locator: string): string | undefined {
    return this.transfers.get(locator)?.objectKey;
  }
}

/**
 * Controlled scanner fake. A real scanner must be selected and configured by
 * the operations/security owner before any non-test environment uses it.
 */
export class ControlledFakeScanAdapter implements ScanAdapter {
  readonly isNonProductionFake = true;

  constructor(private readonly result: 'CLEAN' | 'MALICIOUS' | 'UNKNOWN' = 'CLEAN', private readonly unavailable = false) {}

  async scan(): Promise<'CLEAN' | 'MALICIOUS' | 'UNKNOWN'> {
    if (this.unavailable) throw new FileDependencyUnavailableError();
    return this.result;
  }
}
