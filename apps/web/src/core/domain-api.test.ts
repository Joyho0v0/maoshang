import { createFixtureDomainApi } from './domain-fixtures';

const customerId = '00000000-0000-4000-8000-000000000102';
const orderId = '00000000-0000-4000-8000-000000000401';

describe('Customers, Catalog and Orders contract seam', () => {
  it('keeps customer rejection as DRAFT with a rejected approval outcome', async () => {
    const api = createFixtureDomainApi();
    const before = await api.getCustomer(customerId);

    const result = await api.commandCustomer(customerId, { action: 'REJECT', reason: '请补充收货主体。' }, '"v2"');

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
    expect(confirmed.data.status).toBe('CONFIRMED');
    expect(confirmed.data.allowedTransitions).toEqual(['FULFILL', 'CANCEL']);
  });

  it('keeps forbidden, offline and conflict states explicit at the fixture seam', async () => {
    await expect(createFixtureDomainApi({ scenario: 'forbidden' }).listCustomers()).rejects.toMatchObject({ status: 403 });
    await expect(createFixtureDomainApi({ scenario: 'offline' }).listOrders()).rejects.toMatchObject({ status: 503 });
    await expect(createFixtureDomainApi({ scenario: 'conflict' }).updateCustomer(customerId, { name: '新名称' }, '"v2"')).rejects.toMatchObject({ status: 409 });
  });
});
