export interface UrlState {
  readonly tab?: string;
  readonly sort?: string;
  readonly cursor?: string;
  readonly filter?: Readonly<Record<string, string>>;
}

export interface UrlValueCodec {
  readonly serialize: (value: unknown) => string | undefined;
  readonly parse: (value: string) => string | undefined;
}

export interface UrlStateCodecDefinition {
  readonly topLevel?: Readonly<Partial<Record<'tab' | 'sort' | 'cursor', UrlValueCodec>>>;
  readonly filters?: Readonly<Record<string, UrlValueCodec>>;
}

export interface UrlStateCodec {
  readonly serialize: (state: UrlState) => URLSearchParams;
  readonly parse: (params: URLSearchParams) => UrlState;
  readonly isAllowedKey: (key: string) => boolean;
}

const MAX_ROUTE_VALUE_LENGTH = 256;
const MAX_CURSOR_LENGTH = 512;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Creates a route codec from the endpoint's public query allowlist and codecs.
 * Unknown keys and values that do not satisfy the endpoint codec are dropped.
 */
export function createUrlStateCodec(definition: UrlStateCodecDefinition): UrlStateCodec {
  const topLevel = definition.topLevel ?? {};
  const filters = definition.filters ?? {};
  const topLevelKeys = new Set(Object.keys(topLevel));
  const filterKeys = new Set(Object.keys(filters));

  function serialize(state: UrlState): URLSearchParams {
    const params = new URLSearchParams();
    for (const key of ['tab', 'sort', 'cursor'] as const) {
      const value = state[key];
      const serialized = value === undefined ? undefined : topLevel[key]?.serialize(value);
      if (serialized !== undefined) params.set(key, serialized);
    }
    for (const key of Object.keys(filters)) {
      const value = state.filter?.[key];
      const serialized = value === undefined ? undefined : filters[key]?.serialize(value);
      if (serialized !== undefined) params.set(`filter[${key}]`, serialized);
    }
    return params;
  }

  function parse(params: URLSearchParams): UrlState {
    const state: { tab?: string; sort?: string; cursor?: string; filter?: Record<string, string> } = {};
    for (const key of ['tab', 'sort', 'cursor'] as const) {
      const value = params.get(key);
      const parsed = value === null ? undefined : topLevel[key]?.parse(value);
      if (parsed !== undefined) state[key] = parsed;
    }

    const filter: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      const match = /^filter\[([^\]]+)\]$/.exec(key);
      const filterKey = match?.[1];
      const parsed = filterKey === undefined ? undefined : filters[filterKey]?.parse(value);
      if (parsed !== undefined && filterKey !== undefined) filter[filterKey] = parsed;
    }
    if (Object.keys(filter).length > 0) state.filter = filter;
    return state;
  }

  function isAllowedKey(key: string): boolean {
    if (topLevelKeys.has(key)) return true;
    const match = /^filter\[([^\]]+)\]$/.exec(key);
    return match !== null && filterKeys.has(match[1] ?? '');
  }

  return { serialize, parse, isAllowedKey };
}

export function boundedStringCodec(maxLength = MAX_ROUTE_VALUE_LENGTH): UrlValueCodec {
  return stringCodec((value) => value.length >= 1 && value.length <= maxLength);
}

/** Opaque cursors use only the frozen length contract; no character set is guessed here. */
export function opaqueCursorCodec(): UrlValueCodec {
  return boundedStringCodec(MAX_CURSOR_LENGTH);
}

export function enumCodec(values: readonly string[], maxLength = MAX_ROUTE_VALUE_LENGTH): UrlValueCodec {
  const allowed = new Set(values);
  return stringCodec((value) => value.length <= maxLength && allowed.has(value));
}

export function uuidCodec(): UrlValueCodec {
  return stringCodec((value) => UUID_PATTERN.test(value));
}

function stringCodec(predicate: (value: string) => boolean): UrlValueCodec {
  return {
    serialize: (value) => typeof value === 'string' && predicate(value) ? value : undefined,
    parse: (value) => predicate(value) ? value : undefined,
  };
}

// This is the public route/endpoint declaration for the shared list-state demo.
// Other endpoints can create their own codec with createUrlStateCodec instead of
// inheriting these values.
const publicRouteCodec = createUrlStateCodec({
  topLevel: {
    tab: enumCodec([
      'workspace', 'customers', 'catalog', 'orders', 'files', 'payments',
      'inventory', 'documents', 'tasks', 'organization', 'audit', 'dashboard',
    ]),
    sort: enumCodec([
      '-updatedAt,-id', 'updatedAt', '-updatedAt', 'id', '-id',
      'createdAt', '-createdAt', 'name', '-name', 'status', '-status',
      'orderNo', '-orderNo', 'skuCode', '-skuCode',
    ]),
    cursor: opaqueCursorCodec(),
  },
  filters: {
    status: enumCodec([
      'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CLOSED', 'DRAFT',
      'CONFIRMED', 'FULFILLED', 'ACTIVE', 'INACTIVE', 'PENDING', 'PAID',
      'FAILED', 'REVERSED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'FINALIZED',
      'ISSUED', 'VOID',
    ], 64),
    type: enumCodec([
      'customer', 'catalog', 'order', 'export', 'file', 'payment', 'inventory',
      'document', 'task',
    ], 64),
    state: enumCodec([
      'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CLOSED', 'DRAFT',
      'CONFIRMED', 'FULFILLED', 'ACTIVE', 'INACTIVE', 'PENDING', 'PAID',
      'FAILED', 'REVERSED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'FINALIZED',
      'ISSUED', 'VOID',
    ], 64),
    ownerId: uuidCodec(),
  },
});

export const serializeUrlState = publicRouteCodec.serialize;
export const parseUrlState = publicRouteCodec.parse;
export const isAllowedUrlStateKey = publicRouteCodec.isAllowedKey;
