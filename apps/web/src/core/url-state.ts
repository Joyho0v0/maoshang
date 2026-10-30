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

/**
 * Serializes only short, non-sensitive navigation state. Free-text search,
 * contact data, filenames and business content intentionally have no URL key.
 */
export function serializeUrlState(state: UrlState): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of ['tab', 'sort', 'cursor'] as const) {
    const value = state[key];
    if (value !== undefined && value.length > 0) params.set(key, value);
  }
  for (const key of ALLOWED_FILTER_KEYS) {
    const value = state.filter?.[key];
    if (value !== undefined && value.length > 0) params.set(`filter[${key}]`, value);
  }
  return params;
}

export function parseUrlState(params: URLSearchParams): UrlState {
  const state: { tab?: string; sort?: string; cursor?: string; filter?: Record<string, string> } = {};
  for (const key of ['tab', 'sort', 'cursor'] as const) {
    const value = params.get(key);
    if (value !== null && value.length > 0) state[key] = value;
  }
  const filter: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    const match = /^filter\[([^\]]+)\]$/.exec(key);
    if (match === null || !ALLOWED_FILTER_SET.has(match[1] ?? '') || value.length === 0) continue;
    filter[match[1] as AllowedFilterKey] = value;
  }
  if (Object.keys(filter).length > 0) state.filter = filter;
  return state;
}

export function isAllowedUrlStateKey(key: string): boolean {
  if (ALLOWED_TOP_LEVEL_KEYS.has(key)) return true;
  const match = /^filter\[([^\]]+)\]$/.exec(key);
  return match !== null && ALLOWED_FILTER_SET.has(match[1] ?? '');
}
