import { describe, expect, it } from 'vitest';
import { createCursor, parseCursor } from '../../apps/api/src/common/http/cursor.js';

describe('keyset cursor', () => {
  it('rejects a cursor reused with another filter or sort', () => {
    const cursor = createCursor({ updatedAt: '2026-01-01T00:00:00.000Z', id: '00000000-0000-4000-8000-000000000001' }, '-updatedAt,-id', { status: ['DRAFT'] });
    expect(parseCursor(cursor, '-updatedAt,-id', { status: ['DRAFT'] })).toEqual({ updatedAt: '2026-01-01T00:00:00.000Z', id: '00000000-0000-4000-8000-000000000001' });
    expect(() => parseCursor(cursor, '-updatedAt,-id', { status: ['APPROVED'] })).toThrow('INVALID_CURSOR');
    expect(() => parseCursor(cursor, 'updatedAt,id', { status: ['DRAFT'] })).toThrow('INVALID_CURSOR');
  });
});
