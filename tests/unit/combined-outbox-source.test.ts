import { describe, expect, it } from 'vitest';
import { CombinedOutboxSource } from '../../apps/worker/src/combined-outbox-source.js';
import type { OutboxEvent, OutboxSource } from '../../apps/worker/src/worker.js';

class FakeSource implements OutboxSource {
  constructor(private readonly events: OutboxEvent[]) {}
  published: string[] = [];
  failed: string[] = [];
  async claimBatch(limit: number): Promise<OutboxEvent[]> { return this.events.splice(0, limit); }
  async markPublished(id: string): Promise<void> { this.published.push(id); }
  async markFailed(id: string): Promise<void> { this.failed.push(id); }
}

describe('combined identity/foundation outbox source', () => {
  it('fills a batch from identity events after foundation events', async () => {
    const foundation = new FakeSource([{ id: 'foundation-1', topic: 'CustomerCreated', payload: {} }]);
    const identity = new FakeSource([{ id: 'identity-1', topic: 'identity.SUCCEEDED', payload: {} }]);
    const source = new CombinedOutboxSource(foundation, identity);
    await expect(source.claimBatch(2)).resolves.toEqual([
      { id: 'foundation-1', topic: 'CustomerCreated', payload: {}, source: 'foundation' },
      { id: 'identity-1', topic: 'identity.SUCCEEDED', payload: {}, source: 'identity' },
    ]);
  });

  it('routes acknowledgement and failure to the source that owns the event', async () => {
    const foundation = new FakeSource([]);
    const identity = new FakeSource([]);
    const source = new CombinedOutboxSource(foundation, identity);
    const foundationEvent = { id: 'foundation-1', topic: 'CustomerCreated', payload: {} };
    const identityEvent = { id: 'identity-1', topic: 'identity.SUCCEEDED', payload: {} };
    foundation.claimBatch = async () => [foundationEvent];
    identity.claimBatch = async () => [identityEvent];
    await source.claimBatch(2);
    await source.markPublished('identity-1');
    await source.markFailed?.('foundation-1', new Error('broker'));
    expect(identity.published).toEqual(['identity-1']);
    expect(foundation.failed).toEqual(['foundation-1']);
  });
});
