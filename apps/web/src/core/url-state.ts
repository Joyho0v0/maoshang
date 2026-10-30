export interface UrlState {
  readonly tab?: string;
  readonly sort?: string;
  readonly cursor?: string;
  readonly filter?: Readonly<Record<string, string>>;
}

const ALLOWED_FILTER_KEYS = ['status', 'type', 'state', 'ownerId'] as const;
type AllowedFilterKey = (typeof ALLOWED_FILTER_KEYS)[number];
const ALLOWED_FILTER_SET = new Set<string>(ALLOWED_FILTER_KEYS);
const ALLOWED_TOP_LEVEL_KEYS = new Set(['tab', 'sort', 'cursor']);

const ALLOWED_TABS = new Set([
  'workspace', 'customers', 'catalog', 'orders', 'files', 'payments',
  'inventory', 'documents', 'tasks', 'organization', 'audit', 'dashboard',
]);
const ALLOWED_SORTS = new Set([
  'createdAt', 'updatedAt', 'name', 'status', 'orderNo', 'skuCode',
]);
const ALLOWED_TYPES = new Set([
  'customer', 'catalog', 'order', 'export', 'file', 'payment', 'inventory',
  'document', 'task',
]);
const ALLOWED_STATUSES = new Set([
  'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CLOSED', 'DRAFT',
  'CONFIRMED', 'FULFILLED', 'ACTIVE', 'INACTIVE', 'PENDING', 'PAID',
  'FAILED', 'REVERSED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'FINALIZED',
  'ISSUED', 'VOID',
]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CURSOR_PATTERN = /^[A-Za-z0-9._~=-]{1,256}$/;
const MAX_ROUTE_VALUE_LENGTH = 64;

/**
 * Serializes only public, bounded route state. Every key has a value codec;
 * key names alone are not treated as a privacy boundary.
 */
export function serializeUrlState(state: UrlState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.tab !== undefined && isValidTab(state.tab)) params.set('tab', state.tab);
  if (state.sort !== undefined && isValidSort(state.sort)) params.set('sort', state.sort);
  if (state.cursor !== undefined && isValidCursor(state.cursor)) params.set('cursor', state.cursor);
  for (const key of ALLOWED_FILTER_KEYS) {
    const value = state.filter?.[key];
    if (value !== undefined && isValidFilterValue(key, value)) params.set(`filter[${key}]`, value);
  }
  return params;
}

export function parseUrlState(params: URLSearchParams): UrlState {
  const state: { tab?: string; sort?: string; cursor?: string; filter?: Record<string, string> } = {};
  const tab = params.get('tab');
  const sort = params.get('sort');
  const cursor = params.get('cursor');
  if (tab !== null && isValidTab(tab)) state.tab = tab;
  if (sort !== null && isValidSort(sort)) state.sort = sort;
  if (cursor !== null && isValidCursor(cursor)) state.cursor = cursor;

  const filter: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    const match = /^filter\[([^\]]+)\]$/.exec(key);
    const filterKey = match?.[1];
    if (filterKey === undefined || !ALLOWED_FILTER_SET.has(filterKey)) continue;
    if (isValidFilterValue(filterKey as AllowedFilterKey, value)) filter[filterKey] = value;
  }
  if (Object.keys(filter).length > 0) state.filter = filter;
  return state;
}

export function isAllowedUrlStateKey(key: string): boolean {
  if (ALLOWED_TOP_LEVEL_KEYS.has(key)) return true;
  const match = /^filter\[([^\]]+)\]$/.exec(key);
  return match !== null && ALLOWED_FILTER_SET.has(match[1] ?? '');
}

function isValidTab(value: string): boolean {
  return value.length <= MAX_ROUTE_VALUE_LENGTH && ALLOWED_TABS.has(value);
}

function isValidSort(value: string): boolean {
  return value.length <= MAX_ROUTE_VALUE_LENGTH && ALLOWED_SORTS.has(value);
}

function isValidCursor(value: string): boolean {
  return CURSOR_PATTERN.test(value);
}

function isValidFilterValue(key: AllowedFilterKey, value: string): boolean {
  if (value.length === 0 || value.length > MAX_ROUTE_VALUE_LENGTH) return false;
  if (key === 'ownerId') return UUID_PATTERN.test(value);
  if (key === 'type') return ALLOWED_TYPES.has(value);
  return ALLOWED_STATUSES.has(value);
}
