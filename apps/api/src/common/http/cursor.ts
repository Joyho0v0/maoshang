import { createHash } from 'node:crypto';

export interface CursorPosition { updatedAt: string; id: string; }
interface CursorEnvelope extends CursorPosition { sort: string; filterHash: string; }

export const DEFAULT_SORT = '-updatedAt,-id';
export const ALLOWED_SORTS = new Set(['-updatedAt,-id', 'updatedAt,id', '-createdAt,-id', 'createdAt,id']);

export function parsePageSize(value: unknown): number {
  const candidate = value === undefined ? 20 : Number(value);
  if (!Number.isInteger(candidate) || candidate < 1 || candidate > 100) throw new Error('INVALID_PAGE_SIZE');
  return candidate;
}

export function parseSort(value: unknown): string {
  const sort = value === undefined ? DEFAULT_SORT : String(value);
  if (!ALLOWED_SORTS.has(sort)) throw new Error('UNKNOWN_SORT');
  return sort;
}

export function createCursor(position: CursorPosition, sort: string, filters: unknown): string {
  const envelope: CursorEnvelope = { ...position, sort, filterHash: hashFilters(filters) };
  return Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64url');
}

export function parseCursor(value: unknown, sort: string, filters: unknown): CursorPosition | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length < 1 || value.length > 512) throw new Error('INVALID_CURSOR');
  try {
    const decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<CursorEnvelope>;
    if (decoded.sort !== sort || decoded.filterHash !== hashFilters(filters) || typeof decoded.updatedAt !== 'string' || typeof decoded.id !== 'string') throw new Error('INVALID_CURSOR');
    return { updatedAt: decoded.updatedAt, id: decoded.id };
  } catch {
    throw new Error('INVALID_CURSOR');
  }
}

export function hashFilters(value: unknown): string {
  return createHash('sha256').update(stableJson(value), 'utf8').digest('hex');
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (typeof value !== 'object' || value === null) return JSON.stringify(value) ?? 'null';
  return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`).join(',')}}`;
}
