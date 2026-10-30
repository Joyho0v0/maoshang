import { inject } from 'vue';

import {
  DOMAIN_API_KEY,
  pageStateForError,
  toDomainApiError,
  type DomainApi,
  type DomainPageState,
} from '../core/domain-api';
import { enumCodec, serializeUrlState } from '../core/url-state';

export function useDomainApi(): DomainApi {
  const api = inject<DomainApi>(DOMAIN_API_KEY);
  if (api === undefined) throw new Error('Domain API provider is missing.');
  return api;
}

export function routeString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function routeStatus(value: unknown): string | undefined {
  return enumCodec([
    'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'INACTIVE', 'ACTIVE', 'CONFIRMED', 'FULFILLED', 'CANCELLED',
  ], 64).parse(routeString(value) ?? '');
}

export function listState(
  pending: boolean,
  dataLength: number | undefined,
  error: unknown,
): DomainPageState {
  if (pending) return 'loading';
  if (error !== undefined && error !== null) return pageStateForError(error);
  return dataLength === 0 ? 'empty' : 'ready';
}

export function problemTitle(error: unknown): string {
  return toDomainApiError(error).problem.title;
}

export function problemRequestId(error: unknown): string {
  return toDomainApiError(error).problem.requestId ?? '';
}

export function pageStateMessage(state: DomainPageState): { heading: string; message: string } {
  switch (state) {
    case 'loading': return { heading: '正在同步', message: '正在读取冻结契约允许的业务数据。' };
    case 'empty': return { heading: '还没有数据', message: '当前筛选范围没有可展示的记录。' };
    case 'forbidden': return { heading: '当前身份无权访问', message: '服务端没有授予这项业务范围，页面不会通过旁路请求补齐字段。' };
    case 'offline': return { heading: '业务服务暂时不可用', message: '请确认网络连接后重试；当前页面没有把 fixture 成功当作真实联调。' };
    case 'error': return { heading: '读取失败', message: '服务端没有完成这次读取，请保留请求编号并重试。' };
    default: return { heading: '', message: '' };
  }
}

export function queryFromRoute(status: string | undefined, sort: string | undefined, cursor: string | undefined): Record<string, string> {
  const params = serializeUrlState({
    ...(sort ? { sort } : {}),
    ...(cursor ? { cursor } : {}),
    ...(status ? { filter: { status } } : {}),
  });
  return Object.fromEntries(params.entries());
}

export function displayStatus(status: string): string {
  return {
    DRAFT: '草稿',
    PENDING_APPROVAL: '待审核',
    APPROVED: '已通过',
    INACTIVE: '已停用',
    ACTIVE: '启用',
    CONFIRMED: '已确认',
    FULFILLED: '已履约',
    CANCELLED: '已取消',
  }[status] ?? status;
}

export function readName(value: unknown): string {
  return typeof value === 'string' && value.length > 0 ? value : '未授权字段';
}

export function etagFor(version: number): string {
  return `"v${version}"`;
}
