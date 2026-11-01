import { createHash } from 'node:crypto';

export interface CanonicalRequest {
  method: string;
  path: string;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
  ifMatch?: string;
}

export function canonicalizeRequest(request: CanonicalRequest): string {
  return JSON.stringify({
    version: 1,
    method: request.method.toUpperCase(),
    path: request.path,
    query: sortValue(request.query ?? {}),
    body: sortValue(request.body ?? null),
    ifMatch: request.ifMatch ?? null,
  });
}

export function canonicalRequestHash(request: CanonicalRequest): string {
  return createHash('sha256').update(canonicalizeRequest(request), 'utf8').digest('hex');
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, nested]) => [key, sortValue(nested)]));
}
