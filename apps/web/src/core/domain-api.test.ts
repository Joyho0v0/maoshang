import { ApiProblemError } from '../../../../packages/contracts/openapi/client.js';

import {
  createProductionDomainApi,
  pageStateForError,
  toDomainApiError,
} from './domain-api';
import { createFixtureDomainApi } from './domain-fixtures';
import { SessionRuntime } from './session-runtime';
import type { ContractAdapter, SessionIdentity, SessionUser } from './types';

const customerId = '00000000-0000-4000-8000-000000000102';
const activeCustomerId = '00000000-0000-4000-8000-000000000101';
const orderId = '00000000-0000-4000-8000-000000000401';

describe('Customers, Catalog and Orders contract seam', () => {
  it('keeps customer rejection as DRAFT with a rejected approval outcome', async () => {
    const api = createFixtureDomainApi();
    const before = await api.getCustomer(activeCustomerId);

    const result = await api.commandCustomer(activeCustomerId, { action: 'REJECT', reason: '请补充收货主体。' }, '"v4"');

    if (result.kind === 'pending') throw new Error('fixture command should be terminal');
    expect(result.data.status).toBe('DRAFT');
    expect(result.data.status).not.toBe('REJECTED');
    expect(result.data.approvalSummary?.latestOutcome).toBe('REJECTED');
    expect(result.data.approvalSummary?.reason).toBe('请补充收货主体。');
    expect(result.data.version).toBe((before.data.version ?? 0) + 1);
  });

  it('exposes only the server-provided order transition and preserves DecimalString values', async () => {
    const api = createFixtureDomainApi();
    const order = await api.getOrder(orderId);

    expect(order.data.allowedTransitions).toEqual(['CONFIRM', 'CANCEL']);
    expect(typeof order.data.totalAmount).toBe('string');
    expect(typeof order.data.lines[0]?.quantity).toBe('string');
    expect(typeof order.data.lines[0]?.unitPrice).toBe('string');

    const confirmed = await api.transitionOrder(orderId, { action: 'CONFIRM' }, '"v5"');
    if (confirmed.kind === 'pending') throw new Error('fixture transition should be terminal');
    expect(confirmed.data.status).toBe('CONFIRMED');
    expect(confirmed.data.allowedTransitions).toEqual(['FULFILL', 'CANCEL']);
  });

  it('keeps forbidden, offline and conflict states explicit at the fixture seam', async () => {
    await expect(createFixtureDomainApi({ scenario: 'forbidden' }).listCustomers()).rejects.toMatchObject({ status: 403 });
    await expect(createFixtureDomainApi({ scenario: 'offline' }).listOrders()).rejects.toMatchObject({ status: 503 });
    await expect(createFixtureDomainApi({ scenario: 'conflict' }).updateCustomer(customerId, { name: '新名称' }, '"v2"')).rejects.toMatchObject({ status: 409 });
  });

  it('returns a pending handle for 202 and resolves it through the authoritative resource', async () => {
    const requests: unknown[] = [];
    const adapter = createAuthenticatedAdapter(async (request) => {
      requests.push(request);
      if (requests.length === 1) return { status: 202, data: { state: 'IN_PROGRESS' }, headers: {} };
      if (requests.length === 2) {
        return {
          status: 200,
          data: {
            commandId: '00000000-0000-4000-8000-000000000901',
            operationId: 'createOrder',
            state: 'SUCCEEDED',
            startedAt: '2026-10-30T08:00:00.000Z',
            completedAt: '2026-10-30T08:01:00.000Z',
            expiresAt: '2026-10-30T09:00:00.000Z',
            retryAfterMs: 0,
            httpStatus: 201,
            resource: { type: 'ORDER', id: orderId, href: `/api/v1/orders/${orderId}` },
            resultHref: null,
            problem: null,
          },
          headers: {},
        };
      }
      return { status: 201, data: { id: orderId, version: 1 }, headers: { ETag: 'W/"order-opaque"' } };
    });
    const runtime = new SessionRuntime(adapter, { sleep: async () => undefined });
    await runtime.login({ email: 'sales@example.test', password: 'password' });
    const api = createProductionDomainApi(runtime);

    const pending = await api.createOrder({
      customerId: activeCustomerId,
      orderNo: 'SO-TDD-001',
      currency: 'CNY',
      lines: [{ skuId: '00000000-0000-4000-8000-000000000301', quantity: '1.000', unitPrice: '2.00' }],
    });

    expect(pending.kind).toBe('pending');
    if (pending.kind !== 'pending') throw new Error('expected pending result');
    const resolved = await pending.recover();
    expect(resolved.kind).toBe('resource');
    if (resolved.kind === 'pending') throw new Error('expected authoritative resource');
    expect(resolved.data).toMatchObject({ id: orderId });
    expect(requests).toHaveLength(3);
    expect(requests[0]).toMatchObject({ method: 'POST', operationId: 'createOrder' });
    expect(requests[1]).toMatchObject({ method: 'GET', operationId: 'getCommandStatus' });
    expect(requests[2]).toMatchObject({ method: 'GET', href: expect.stringContaining(`/api/v1/orders/${orderId}`) });
  });

  it('keeps a 503 result unknown and recovers with the same idempotency key', async () => {
    const requests: Array<Record<string, unknown>> = [];
    const adapter = createAuthenticatedAdapter(async (request) => {
      requests.push(request as unknown as Record<string, unknown>);
      if (requests.length === 1) throw { type: 'about:blank', title: 'Unavailable', status: 503, code: 'DEPENDENCY_UNAVAILABLE' };
      if (requests.length === 2) return {
        status: 200,
        data: {
          commandId: '00000000-0000-4000-8000-000000000902',
          operationId: 'createOrder',
          state: 'SUCCEEDED',
          startedAt: '2026-10-30T08:00:00.000Z',
          completedAt: '2026-10-30T08:01:00.000Z',
          expiresAt: '2026-10-30T09:00:00.000Z',
          retryAfterMs: 0,
          httpStatus: 201,
          resource: { type: 'ORDER', id: orderId, href: `/api/v1/orders/${orderId}` },
          resultHref: null,
          problem: null,
        },
        headers: {},
      };
      return { status: 201, data: { id: orderId, version: 1 }, headers: { ETag: 'W/"order-recovered"' } };
    });
    const runtime = new SessionRuntime(adapter, { sleep: async () => undefined });
    await runtime.login({ email: 'sales@example.test', password: 'password' });
    const api = createProductionDomainApi(runtime);

    const pending = await api.createOrder({
      customerId: activeCustomerId,
      orderNo: 'SO-TDD-503',
      currency: 'CNY',
      lines: [{ skuId: '00000000-0000-4000-8000-000000000301', quantity: '1.000', unitPrice: '2.00' }],
    });

    expect(pending.kind).toBe('pending');
    if (pending.kind !== 'pending') throw new Error('expected pending result');
    expect(pending.state).toBe('RESULT_UNKNOWN');
    const recovered = await pending.recover();
    expect(recovered.kind).toBe('resource');
    expect(requests[1]?.idempotencyKey).toBe(pending.idempotencyKey);
    expect(requests[1]?.operationId).toBe('getCommandStatus');
    expect(requests[0]?.idempotencyKey).toBe(pending.idempotencyKey);
    expect(requests[0]?.body).toBe(pending.canonicalBody);
    expect(requests[1]?.body).toBeUndefined();
  });

  it('preserves opaque ETags and maps typed API problems without losing metadata', async () => {
    const request = vi.fn(async (input) => {
      expect(input.etag).toBe('W/"customer-rev-opaque"');
      return { status: 200, data: { id: customerId, version: 8 }, headers: { ETag: 'W/"next"' } };
    });
    const runtime = new SessionRuntime(createAuthenticatedAdapter(request));
    await runtime.login({ email: 'sales@example.test', password: 'password' });
    const api = createProductionDomainApi(runtime);
    const updated = await api.updateCustomer(activeCustomerId, { name: '新名称' }, 'W/"customer-rev-opaque"');

    expect(updated.kind).toBe('resource');
    expect(updated.etag).toBe('W/"next"');

    const problem = new ApiProblemError(409, {
      type: 'urn:autoflow:problem:version-conflict',
      title: 'Version conflict',
      status: 409,
      code: 'VERSION_CONFLICT',
      requestId: 'req-409',
      retryable: false,
      detail: 'stale resource',
      meta: { currentVersion: 9, currentEtag: 'W/"new"', resourceHref: `/api/v1/customers/${activeCustomerId}` },
    }, { 'X-Request-ID': 'req-409', 'Retry-After': '2' });
    const mapped = await Promise.resolve().then(() => {
      try { throw problem; } catch (error) { return error; }
    });
    const mappedProblem = toDomainApiError(mapped).problem;
    expect(mappedProblem).toMatchObject({
      code: 'VERSION_CONFLICT',
      requestId: 'req-409',
      detail: 'stale resource',
      meta: { currentVersion: 9, currentEtag: 'W/"new"' },
      headers: { 'X-Request-ID': 'req-409', 'Retry-After': '2' },
    });
    expect(pageStateForError(mapped)).toBe('error');
    expect(pageStateForError({ problem: { status: 401, title: '未登录' } })).toBe('error');
  });

  it('makes empty scopes empty and rejects stale or disallowed fixture commands', async () => {
    const empty = createFixtureDomainApi({ scenario: 'empty-group' });
    await expect(empty.listCustomers()).resolves.toMatchObject({ data: [] });
    await expect(empty.listProducts()).resolves.toMatchObject({ data: [] });
    await expect(empty.listOrders()).resolves.toMatchObject({ data: [] });

    const api = createFixtureDomainApi();
    await expect(api.updateCustomer(customerId, { name: 'stale' }, 'W/"not-current"')).rejects.toMatchObject({ status: 409 });
    await expect(api.commandCustomer('00000000-0000-4000-8000-000000000102', { action: 'REJECT', reason: '再次驳回' }, '"v2"')).rejects.toMatchObject({ status: 409 });
    await expect(api.commandCustomer(activeCustomerId, { action: 'REJECT', reason: '缺少最新版本' }, '')).rejects.toMatchObject({ status: 428 });
    await expect(createFixtureDomainApi({ actorUserId: '00000000-0000-4000-8000-000000000002' }).commandCustomer(activeCustomerId, { action: 'APPROVE' }, '"v4"')).rejects.toMatchObject({ status: 403 });
  });
});

function createAuthenticatedAdapter(
  request: ContractAdapter['request'],
): ContractAdapter {
  const user: SessionUser = { id: '00000000-0000-4000-8000-000000000002', organizationId: 'org-1', displayName: 'Sales' };
  const identity: SessionIdentity = {
    userId: user.id,
    organizationId: user.organizationId,
    capabilities: ['customer.read', 'customer.update', 'customer.submitApproval', 'order.create'],
    scopeSummary: { groupIds: ['group-1'] },
    authzVersion: 1,
    serverSessionEpoch: 1,
  };
  return {
    bootstrap: async () => ({ authenticated: true, user, identity, csrfToken: 'csrf-1' }),
    login: async () => ({ user, identity, csrfToken: 'csrf-1' }),
    logout: async () => undefined,
    rotateCsrf: async () => ({ csrfToken: 'csrf-1' }),
    request,
  };
}
