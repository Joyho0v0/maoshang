import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient, QueryResultRow } from 'pg';
import { FileState, type ScanResult, type UploadedObjectMetadata } from '../domain/files.js';

export interface FileRecord {
  id: string;
  organizationId: string;
  createdBy: string;
  businessGroupId?: string;
  objectKey: string;
  fileName: string;
  contentType: string;
  detectedContentType?: string;
  sizeBytes: number;
  actualSizeBytes?: number;
  checksum?: string;
  status: FileState;
  metadata: Record<string, unknown>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface FileLinkRecord {
  resourceType: string;
  resourceId: string;
  purpose: string;
  resourceOwnerId?: string;
  resourceBusinessGroupId?: string;
}

export interface FileWithLinks extends FileRecord {
  links: readonly FileLinkRecord[];
}

export interface UploadIntentInsert {
  fileId: string;
  organizationId: string;
  createdBy: string;
  businessGroupId?: string;
  objectKey: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  checksum?: string;
  metadata: Record<string, unknown>;
  expiresAt: Date;
  requestId: string;
}

export interface CompletionSnapshot {
  file: FileRecord;
  objectKey: string;
  expiresAt: Date;
  intentStatus: 'ACTIVE' | 'CONSUMED' | 'EXPIRED' | 'REJECTED';
}

export interface WorkerFileSnapshot {
  file: FileRecord;
  objectKey: string;
  expiresAt: Date;
  intentStatus: 'ACTIVE' | 'CONSUMED' | 'EXPIRED' | 'REJECTED';
}

export type UploadIntentReplaySnapshot = WorkerFileSnapshot;

export interface FileAuditInput {
  organizationId: string;
  actorUserId?: string;
  action: string;
  resourceId: string;
  outcome: 'SUCCEEDED' | 'DENIED' | 'FAILED';
  reason?: string;
  requestId: string;
}

interface FileRow extends QueryResultRow {
  id: string;
  organization_id: string;
  created_by: string;
  business_group_id: string | null;
  object_key: string;
  original_name: string;
  declared_content_type: string;
  detected_content_type: string | null;
  declared_size_bytes: number | string;
  actual_size_bytes: number | string | null;
  declared_checksum: string | null;
  actual_checksum: string | null;
  status: FileState;
  metadata: Record<string, unknown>;
  version: number | string;
  created_at: Date;
  updated_at: Date;
}

interface IntentRow extends QueryResultRow {
  intent_expires_at: Date;
  intent_status: 'ACTIVE' | 'CONSUMED' | 'EXPIRED' | 'REJECTED';
}

interface LinkRow extends QueryResultRow {
  resource_type: string;
  resource_id: string;
  purpose: string;
  resource_owner_id: string | null;
  resource_business_group_id: string | null;
}

export class PostgresFilesStore {
  constructor(private readonly pool: Pool) {}

  async createUploadIntent(client: PoolClient, input: UploadIntentInsert): Promise<FileRecord> {
    const inserted = await client.query<FileRow>(
      `INSERT INTO files.file_object
        (id, organization_id, created_by, business_group_id, object_key, original_name,
         declared_content_type, declared_size_bytes, declared_checksum, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
       RETURNING id, organization_id, created_by, business_group_id, object_key,
                 original_name, declared_content_type, detected_content_type,
                 declared_size_bytes, actual_size_bytes, declared_checksum,
                 actual_checksum, status, metadata, version, created_at, updated_at`,
      [input.fileId, input.organizationId, input.createdBy, input.businessGroupId ?? null, input.objectKey, input.fileName, input.contentType, input.sizeBytes, input.checksum ?? null, JSON.stringify(input.metadata)],
    );
    const row = inserted.rows[0];
    if (row === undefined) throw new Error('File insert returned no row.');
    await client.query(
      `INSERT INTO files.upload_intent (file_id, organization_id, object_key, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [input.fileId, input.organizationId, input.objectKey, input.expiresAt, input.createdBy],
    );
    await this.appendAudit(client, {
      organizationId: input.organizationId,
      actorUserId: input.createdBy,
      action: 'file.upload_intent.created',
      resourceId: input.fileId,
      outcome: 'SUCCEEDED',
      requestId: input.requestId,
    });
    await this.appendOutbox(client, input.organizationId, input.fileId, 'file.upload_intent.created', { fileId: input.fileId });
    return mapFile(row);
  }

  async findFile(organizationId: string, fileId: string): Promise<FileRecord | undefined> {
    const result = await this.pool.query<FileRow>(fileSelect() + ' WHERE f.organization_id = $1 AND f.id = $2', [organizationId, fileId]);
    const row = result.rows[0];
    return row === undefined ? undefined : mapFile(row);
  }

  async findFileForUpdate(client: PoolClient, organizationId: string, fileId: string): Promise<FileRecord | undefined> {
    const result = await client.query<FileRow>(fileSelect() + ' WHERE f.organization_id = $1 AND f.id = $2 FOR UPDATE', [organizationId, fileId]);
    const row = result.rows[0];
    return row === undefined ? undefined : mapFile(row);
  }

  async findFileWithLinks(organizationId: string, fileId: string): Promise<FileWithLinks | undefined> {
    const file = await this.findFile(organizationId, fileId);
    if (file === undefined) return undefined;
    const links = await this.pool.query<LinkRow>(
      `SELECT resource_type, resource_id, purpose, resource_owner_id, resource_business_group_id
         FROM files.file_link
        WHERE organization_id = $1 AND file_id = $2
        ORDER BY linked_at DESC, id`,
      [organizationId, fileId],
    );
    return { ...file, links: links.rows.map((row) => ({
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      purpose: row.purpose,
      ...(row.resource_owner_id === null ? {} : { resourceOwnerId: row.resource_owner_id }),
      ...(row.resource_business_group_id === null ? {} : { resourceBusinessGroupId: row.resource_business_group_id }),
    })) };
  }

  async findCompletionSnapshot(client: PoolClient, organizationId: string, fileId: string): Promise<CompletionSnapshot | undefined> {
    const result = await client.query<FileRow & IntentRow>(
      `${fileSelect(', ui.expires_at AS intent_expires_at, ui.status AS intent_status')}
       JOIN files.upload_intent AS ui ON ui.organization_id = f.organization_id AND ui.file_id = f.id
       WHERE f.organization_id = $1 AND f.id = $2
       FOR UPDATE OF f, ui`,
      [organizationId, fileId],
    );
    const row = result.rows[0];
    return row === undefined ? undefined : { file: mapFile(row), objectKey: row.object_key, expiresAt: row.intent_expires_at, intentStatus: row.intent_status };
  }

  async findWorkerFile(organizationId: string, fileId: string): Promise<WorkerFileSnapshot | undefined> {
    const result = await this.pool.query<FileRow & IntentRow>(
      `${fileSelect(', ui.expires_at AS intent_expires_at, ui.status AS intent_status')}
       JOIN files.upload_intent AS ui ON ui.organization_id = f.organization_id AND ui.file_id = f.id
       WHERE f.organization_id = $1 AND f.id = $2`,
      [organizationId, fileId],
    );
    const row = result.rows[0];
    return row === undefined ? undefined : { file: mapFile(row), objectKey: row.object_key, expiresAt: row.intent_expires_at, intentStatus: row.intent_status };
  }

  async findUploadIntentForReplay(organizationId: string, fileId: string): Promise<UploadIntentReplaySnapshot | undefined> {
    return this.findWorkerFile(organizationId, fileId);
  }

  async markUploadIntentExpired(client: PoolClient, organizationId: string, fileId: string, eventId: string): Promise<void> {
    const expired = await client.query(
      `UPDATE files.upload_intent
          SET status = 'EXPIRED', consumed_at = clock_timestamp()
        WHERE organization_id = $1 AND file_id = $2 AND status = 'ACTIVE' AND expires_at <= clock_timestamp()`,
      [organizationId, fileId],
    );
    if (expired.rowCount === 1) {
      await this.appendAudit(client, { organizationId, action: 'file.upload_intent.expired', resourceId: fileId, outcome: 'FAILED', requestId: eventId });
    }
  }

  async markUploaded(client: PoolClient, organizationId: string, fileId: string, object: UploadedObjectMetadata, eventId: string): Promise<FileRecord | undefined> {
    const updated = await client.query<FileRow>(
      `UPDATE files.file_object AS fo
          SET status = 'UPLOADED', detected_content_type = $3, actual_size_bytes = $4,
              actual_checksum = $5, version = version + 1, updated_at = clock_timestamp()
        WHERE fo.organization_id = $1 AND fo.id = $2 AND fo.status = 'PENDING_UPLOAD'
          AND EXISTS (
            SELECT 1 FROM files.upload_intent AS ui
             WHERE ui.organization_id = fo.organization_id
               AND ui.file_id = fo.id
               AND ui.status = 'ACTIVE'
               AND ui.expires_at > clock_timestamp()
          )
       RETURNING id, organization_id, created_by, business_group_id, object_key,
                 original_name, declared_content_type, detected_content_type,
                 declared_size_bytes, actual_size_bytes, declared_checksum,
                 actual_checksum, status, metadata, version, created_at, updated_at`,
      [organizationId, fileId, object.contentType, object.sizeBytes, object.checksum],
    );
    const row = updated.rows[0];
    if (row === undefined) return undefined;
    await this.appendAudit(client, { organizationId, actorUserId: row.created_by, action: 'file.uploaded', resourceId: fileId, outcome: 'SUCCEEDED', requestId: eventId });
    return mapFile(row);
  }

  async markScanning(client: PoolClient, organizationId: string, fileId: string, eventId: string): Promise<FileRecord | undefined> {
    const updated = await client.query<FileRow>(
      `UPDATE files.file_object
          SET status = 'SCANNING', version = version + 1, updated_at = clock_timestamp()
        WHERE organization_id = $1 AND id = $2 AND status = 'UPLOADED'
       RETURNING id, organization_id, created_by, business_group_id, object_key,
                 original_name, declared_content_type, detected_content_type,
                 declared_size_bytes, actual_size_bytes, declared_checksum,
                 actual_checksum, status, metadata, version, created_at, updated_at`,
      [organizationId, fileId],
    );
    const row = updated.rows[0];
    if (row === undefined) return undefined;
    await client.query(
      `UPDATE files.upload_intent SET status = 'CONSUMED', consumed_at = clock_timestamp()
        WHERE organization_id = $1 AND file_id = $2 AND status = 'ACTIVE'`,
      [organizationId, fileId],
    );
    await this.appendAudit(client, { organizationId, actorUserId: row.created_by, action: 'file.scan.started', resourceId: fileId, outcome: 'SUCCEEDED', requestId: eventId });
    await this.appendOutbox(client, organizationId, fileId, 'file.scan.requested', { organizationId, fileId, scanEventId: eventId });
    return mapFile(row);
  }

  async markIntegrityRejected(client: PoolClient, organizationId: string, fileId: string, eventId: string, reason: string): Promise<FileRecord | undefined> {
    const updated = await client.query<FileRow>(
      `UPDATE files.file_object
          SET status = 'REJECTED', rejection_reason = $3, version = version + 1, updated_at = clock_timestamp()
        WHERE organization_id = $1 AND id = $2 AND status = 'PENDING_UPLOAD'
       RETURNING id, organization_id, created_by, business_group_id, object_key,
                 original_name, declared_content_type, detected_content_type,
                 declared_size_bytes, actual_size_bytes, declared_checksum,
                 actual_checksum, status, metadata, version, created_at, updated_at`,
      [organizationId, fileId, reason],
    );
    const row = updated.rows[0];
    if (row === undefined) return undefined;
    await client.query(
      `UPDATE files.upload_intent SET status = 'REJECTED', consumed_at = clock_timestamp()
        WHERE organization_id = $1 AND file_id = $2 AND status = 'ACTIVE'`,
      [organizationId, fileId],
    );
    await client.query(
      `INSERT INTO files.scan_result (id, organization_id, file_id, event_id, engine, engine_version, result, details)
       VALUES ($1, $2, $3, $4, 'integrity', '1', 'ERROR', $5::jsonb)`,
      [randomUUID(), organizationId, fileId, eventId, JSON.stringify({ reason })],
    );
    await this.appendAudit(client, { organizationId, actorUserId: row.created_by, action: 'file.rejected', resourceId: fileId, outcome: 'FAILED', reason, requestId: eventId });
    await this.appendOutbox(client, organizationId, fileId, 'file.rejected', { fileId, reason });
    return mapFile(row);
  }

  async markQuarantined(client: PoolClient, organizationId: string, fileId: string, eventId: string, stage: 'PENDING_UPLOAD' | 'SCANNING', reason: string): Promise<FileRecord | undefined> {
    const updated = await client.query<FileRow>(
      `UPDATE files.file_object
          SET status = 'QUARANTINED', rejection_reason = $3, version = version + 1, updated_at = clock_timestamp()
        WHERE organization_id = $1 AND id = $2 AND status = $4
       RETURNING id, organization_id, created_by, business_group_id, object_key,
                 original_name, declared_content_type, detected_content_type,
                 declared_size_bytes, actual_size_bytes, declared_checksum,
                 actual_checksum, status, metadata, version, created_at, updated_at`,
      [organizationId, fileId, reason, stage],
    );
    const row = updated.rows[0];
    if (row === undefined) return undefined;
    await client.query(
      `UPDATE files.upload_intent SET status = 'REJECTED', consumed_at = clock_timestamp()
        WHERE organization_id = $1 AND file_id = $2 AND status = 'ACTIVE'`,
      [organizationId, fileId],
    );
    await client.query(
      `INSERT INTO files.scan_result (id, organization_id, file_id, event_id, engine, engine_version, result, details)
       VALUES ($1, $2, $3, $4, 'files-worker', '1', 'ERROR', $5::jsonb)
       ON CONFLICT (file_id, event_id) DO NOTHING`,
      [randomUUID(), organizationId, fileId, eventId, JSON.stringify({ reason })],
    );
    await this.appendAudit(client, { organizationId, actorUserId: row.created_by, action: 'file.quarantined', resourceId: fileId, outcome: 'FAILED', reason, requestId: eventId });
    await this.appendOutbox(client, organizationId, fileId, 'file.quarantined', { organizationId, fileId, reason });
    return mapFile(row);
  }

  async applyScanResult(client: PoolClient, input: { organizationId: string; fileId: string; eventId: string; result: ScanResult; engine: string; engineVersion: string }): Promise<FileRecord | undefined> {
    const inbox = await client.query(
      `INSERT INTO integration.inbox_consumption (consumer_name, event_id)
       VALUES ('files.scan', $1)
       ON CONFLICT (consumer_name, event_id) DO NOTHING
       RETURNING event_id`,
      [input.eventId],
    );
    if (inbox.rowCount !== 1) return undefined;
    const status = input.result === 'CLEAN' ? FileState.AVAILABLE : FileState.REJECTED;
    const rejectionReason = input.result === 'CLEAN' ? null : input.result === 'MALICIOUS' ? 'scan-rejected' : 'scan-unknown';
    const updated = await client.query<FileRow>(
      `UPDATE files.file_object
          SET status = $3, rejection_reason = $4, version = version + 1, updated_at = clock_timestamp()
        WHERE organization_id = $1 AND id = $2 AND status = 'SCANNING'
       RETURNING id, organization_id, created_by, business_group_id, object_key,
                 original_name, declared_content_type, detected_content_type,
                 declared_size_bytes, actual_size_bytes, declared_checksum,
                 actual_checksum, status, metadata, version, created_at, updated_at`,
      [input.organizationId, input.fileId, status, rejectionReason],
    );
    const row = updated.rows[0];
    if (row === undefined) return undefined;
    await client.query(
      `INSERT INTO files.scan_result (id, organization_id, file_id, event_id, engine, engine_version, result, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, '{}'::jsonb)
       ON CONFLICT (file_id, event_id) DO NOTHING`,
      [randomUUID(), input.organizationId, input.fileId, input.eventId, input.engine, input.engineVersion, input.result],
    );
    const action = status === FileState.AVAILABLE ? 'file.available' : 'file.rejected';
    await this.appendAudit(client, { organizationId: input.organizationId, actorUserId: row.created_by, action, resourceId: input.fileId, outcome: 'SUCCEEDED', ...(rejectionReason === null ? {} : { reason: rejectionReason }), requestId: input.eventId });
    await this.appendOutbox(client, input.organizationId, input.fileId, action, { fileId: input.fileId });
    return mapFile(row);
  }

  async linkFile(client: PoolClient, input: { organizationId: string; fileId: string; resourceType: string; resourceId: string; purpose: string; linkedBy: string; resourceOwnerId?: string; resourceBusinessGroupId?: string }): Promise<void> {
    const file = await client.query<{ status: FileState }>('SELECT status FROM files.file_object WHERE organization_id = $1 AND id = $2 FOR UPDATE', [input.organizationId, input.fileId]);
    if (file.rows[0]?.status !== FileState.AVAILABLE) throw new Error('Only an available file can be linked.');
    await client.query(
      `INSERT INTO files.file_link
        (id, organization_id, file_id, resource_type, resource_id, purpose, linked_by, resource_owner_id, resource_business_group_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (organization_id, file_id, resource_type, resource_id, purpose) DO NOTHING`,
      [randomUUID(), input.organizationId, input.fileId, input.resourceType, input.resourceId, input.purpose, input.linkedBy, input.resourceOwnerId ?? null, input.resourceBusinessGroupId ?? null],
    );
    await this.appendAudit(client, { organizationId: input.organizationId, actorUserId: input.linkedBy, action: 'file.linked', resourceId: input.fileId, outcome: 'SUCCEEDED', requestId: input.fileId });
  }

  async recordDownloadIssued(organizationId: string, actorUserId: string, fileId: string, requestId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query<{ status: FileState }>('SELECT status FROM files.file_object WHERE organization_id = $1 AND id = $2', [organizationId, fileId]);
      if (current.rows[0]?.status !== FileState.AVAILABLE) throw new Error('File became unavailable before download intent audit.');
      await this.appendAudit(client, { organizationId, actorUserId, action: 'file.download_intent.created', resourceId: fileId, outcome: 'SUCCEEDED', requestId });
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async resolvePrimaryBusinessGroup(client: PoolClient, organizationId: string, userId: string, allowedGroupIds: readonly string[] = []): Promise<string | undefined> {
    if (allowedGroupIds.length === 0) return undefined;
    const result = await client.query<{ business_group_id: string }>(
      `SELECT business_group_id FROM org.membership
        WHERE organization_id = $1 AND user_id = $2 AND status = 'ACTIVE' AND valid_to IS NULL
          AND business_group_id = ANY($3::uuid[])
        ORDER BY is_primary DESC, id LIMIT 1`,
      [organizationId, userId, allowedGroupIds],
    );
    return result.rows[0]?.business_group_id;
  }

  private async appendAudit(client: PoolClient, input: FileAuditInput): Promise<void> {
    await client.query(
      `INSERT INTO audit.audit_event
        (id, organization_id, actor_user_id, action, resource_type, resource_id, outcome, reason, before_summary, after_summary, request_id)
       VALUES ($1, $2, $3, $4, 'FILE', $5, $6, $7, '{}'::jsonb, '{}'::jsonb, $8)`,
      [randomUUID(), input.organizationId, input.actorUserId ?? null, input.action, input.resourceId, input.outcome, input.reason ?? null, input.requestId],
    );
  }

  private async appendOutbox(client: PoolClient, organizationId: string, fileId: string, eventType: string, payload: Record<string, unknown>): Promise<void> {
    await client.query(
      `INSERT INTO integration.outbox_event
        (id, organization_id, aggregate_type, aggregate_id, event_type, payload)
       VALUES ($1, $2, 'FILE', $3, $4, $5::jsonb)`,
      [randomUUID(), organizationId, fileId, eventType, JSON.stringify(payload)],
    );
  }
}

function fileSelect(additionalColumns = ''): string {
  return `SELECT f.id, f.organization_id, f.created_by, f.business_group_id, f.object_key,
                 f.original_name, f.declared_content_type, f.detected_content_type,
                 f.declared_size_bytes, f.actual_size_bytes, f.declared_checksum,
                 f.actual_checksum, f.status, f.metadata, f.version, f.created_at, f.updated_at${additionalColumns}
            FROM files.file_object AS f`;
}

function mapFile(row: FileRow): FileRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    createdBy: row.created_by,
    ...(row.business_group_id === null ? {} : { businessGroupId: row.business_group_id }),
    objectKey: row.object_key,
    fileName: row.original_name,
    contentType: row.declared_content_type,
    ...(row.detected_content_type === null ? {} : { detectedContentType: row.detected_content_type }),
    sizeBytes: toSafeInteger(row.declared_size_bytes),
    ...(row.actual_size_bytes === null ? {} : { actualSizeBytes: toSafeInteger(row.actual_size_bytes) }),
    ...(row.actual_checksum === null ? row.declared_checksum === null ? {} : { checksum: row.declared_checksum } : { checksum: row.actual_checksum }),
    status: row.status,
    metadata: row.metadata ?? {},
    version: toSafeInteger(row.version),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function toSafeInteger(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error('Database integer is outside the supported API range.');
  return parsed;
}
