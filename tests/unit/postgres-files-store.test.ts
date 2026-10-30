import { describe, expect, it } from 'vitest';
import { FileState } from '../../apps/api/src/modules/files/domain/files.js';
import { PostgresFilesStore } from '../../apps/api/src/modules/files/infrastructure/postgres-files.store.js';
import type { Pool } from 'pg';

const organizationId = '00000000-0000-4000-8000-000000000001';
const fileId = '00000000-0000-4000-8000-000000000002';
const userId = '00000000-0000-4000-8000-000000000003';
const groupId = '00000000-0000-4000-8000-000000000004';

describe('Postgres Files store invariants', () => {
  it('writes the trusted organization into the scan event payload in the same transaction', async () => {
    const queries: Array<{ text: string; values?: unknown[] }> = [];
    const row = {
      id: fileId,
      organization_id: organizationId,
      created_by: userId,
      business_group_id: groupId,
      object_key: 'private/object-key-with-enough-length',
      original_name: 'receipt.pdf',
      declared_content_type: 'application/pdf',
      detected_content_type: null,
      declared_size_bytes: 12,
      actual_size_bytes: 12,
      declared_checksum: null,
      actual_checksum: 'checksum',
      status: FileState.SCANNING,
      metadata: {},
      version: 2,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const client = {
      query: async (text: string, values?: unknown[]) => {
        queries.push(values === undefined ? { text } : { text, values });
        return queries.length === 1 ? { rows: [row], rowCount: 1 } : { rows: [], rowCount: 1 };
      },
    };
    const store = new PostgresFilesStore({} as Pool);

    await store.markScanning(client as never, organizationId, fileId, '00000000-0000-4000-8000-000000000005');

    const outbox = queries.find((query) => query.text.includes('integration.outbox_event'));
    expect(outbox?.values?.[4]).toEqual(expect.stringContaining(`"organizationId":"${organizationId}"`));
    expect(outbox?.values?.[4]).toEqual(expect.stringContaining(`"fileId":"${fileId}"`));
  });

  it('fences upload acceptance on the database expiry clock after the external HEAD call', async () => {
    const queries: string[] = [];
    const client = {
      query: async (text: string) => {
        queries.push(text);
        return { rows: [], rowCount: 0 };
      },
    };
    const store = new PostgresFilesStore({} as Pool);

    await store.markUploaded(client as never, organizationId, fileId, { sizeBytes: 12, contentType: 'application/pdf', checksum: 'checksum' }, 'event-1');

    expect(queries[0]).toContain("ui.expires_at > clock_timestamp()");
  });

  it('restricts GROUP_SET upload intent membership selection to the granted business groups', async () => {
    let values: unknown[] | undefined;
    const client = {
      query: async (_text: string, queryValues?: unknown[]) => {
        values = queryValues;
        return { rows: [{ business_group_id: groupId }], rowCount: 1 };
      },
    };
    const store = new PostgresFilesStore({} as Pool);

    await expect(store.resolvePrimaryBusinessGroup(client as never, organizationId, userId, [groupId])).resolves.toBe(groupId);
    expect(values).toEqual([organizationId, userId, [groupId]]);
  });
});
