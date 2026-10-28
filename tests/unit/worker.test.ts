import { OutboxWorker, type OutboxEvent } from '../../apps/worker/src/worker.js';

describe('transactional outbox worker entry point', () => {
  it('publishes and acknowledges each claimed event exactly once per run', async () => {
    const events: OutboxEvent[] = [{ id: 'event-1', topic: 'CustomerCreated', payload: { customerId: 'customer-1' } }];
    const published: string[] = [];
    const acknowledged: string[] = [];
    const worker = new OutboxWorker(
      { claimBatch: async () => events, markPublished: async (id) => { acknowledged.push(id); } },
      { publish: async (event) => { published.push(event.id); } },
    );

    await expect(worker.runOnce()).resolves.toBe(1);
    expect(published).toEqual(['event-1']);
    expect(acknowledged).toEqual(['event-1']);
  });
});
