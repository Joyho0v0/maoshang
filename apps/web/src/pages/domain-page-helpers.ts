import { inject } from 'vue';

import {
  DOMAIN_API_KEY,
  pageStateForError,
  toDomainApiError,
  type DomainApi,
  type DomainPageState,
  type DomainMutationResult,
  type ResourceResult,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function problemCurrentVersion(error: unknown): number | undefined {
  const meta = toDomainApiError(error).problem.meta;
  return isRecord(meta) && typeof meta.currentVersion === 'number' ? meta.currentVersion : undefined;
}

export function problemCurrentEtag(error: unknown): string | undefined {
  const meta = toDomainApiError(error).problem.meta;
  return isRecord(meta) && typeof meta.currentEtag === 'string' ? meta.currentEtag : undefined;
}

export function pendingRecoveryFeedback(error: unknown): { stable: boolean; message: string } {
  const problem = toDomainApiError(error).problem;
  const remainsUnknown = problem.retryable === true || problem.status === 408 || problem.status === 502 || problem.status === 503;
  return remainsUnknown
    ? { stable: false, message: '结果待确认，恢复暂未完成；请继续确认或刷新详情，不要重新创建业务意图。' }
    : { stable: true, message: `操作已稳定失败：${problem.title}` };
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

export function referenceStateMessage(resource: string, state: DomainPageState): { heading: string; message: string } {
  switch (state) {
    case 'loading': return { heading: `正在加载授权${resource}`, message: `正在读取可选择的${resource}，完成前不能提交创建。` };
    case 'empty': return { heading: `没有可选择的${resource}`, message: `当前授权范围没有可用${resource}，请确认范围后重试。` };
    case 'forbidden': return { heading: `无权读取${resource}`, message: `服务端没有授予读取${resource}的权限，创建入口已禁用。` };
    case 'offline': return { heading: `${resource}服务暂时不可用`, message: `无法读取授权${resource}，请重试；创建入口在恢复前保持禁用。` };
    case 'error': return { heading: `${resource}读取失败`, message: `服务端没有完成授权${resource}读取，请重试后再创建。` };
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

export const MAX_CURSOR_HISTORY = 8;

export function rememberCursor(history: Array<string | undefined>, cursor: string | undefined): void {
  history.push(cursor);
  if (history.length > MAX_CURSOR_HISTORY) history.splice(0, history.length - MAX_CURSOR_HISTORY);
}

export function isPendingMutation<T>(result: DomainMutationResult<T>): result is Extract<DomainMutationResult<T>, { kind: 'pending' }> {
  return result.kind === 'pending';
}

export async function resolveMutation<T>(result: DomainMutationResult<T>): Promise<ResourceResult<T>> {
  let current = result;
  while (isPendingMutation(current)) current = await current.recover();
  return current;
}

export function canUsePageCapability(api: DomainApi, capability: string): boolean {
  return api.capabilities === undefined || api.capabilities.includes(capability);
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
