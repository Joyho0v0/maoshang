import type { OutboxEvent, OutboxSource } from './worker.js';

/**
 * Keeps the existing foundation outbox and identity outbox on one worker
 * protocol while preserving acknowledgement ownership for each table.
 */
export class CombinedOutboxSource implements OutboxSource {
  private readonly owners = new Map<string, OutboxSource>();
  private foundationFirst = true;

  constructor(private readonly foundation: OutboxSource, private readonly identity: OutboxSource) {}

  async claimBatch(limit: number): Promise<OutboxEvent[]> {
    if (limit < 1) return [];
    const primary = this.foundationFirst ? this.foundation : this.identity;
    const secondary = this.foundationFirst ? this.identity : this.foundation;
    const primaryName = this.foundationFirst ? 'foundation' as const : 'identity' as const;
    const secondaryName = this.foundationFirst ? 'identity' as const : 'foundation' as const;
    this.foundationFirst = !this.foundationFirst;
    const primaryEvents = await primary.claimBatch(Math.ceil(limit / 2));
    const events = primaryEvents.map((event) => this.remember(event, primary, primaryName));
    if (events.length === limit) return events;
    const secondaryEvents = await secondary.claimBatch(limit - events.length);
    return events.concat(secondaryEvents.map((event) => this.remember(event, secondary, secondaryName)));
  }

  async markPublished(id: string, claimToken?: Buffer): Promise<void> {
    await this.owner(id).markPublished(id, claimToken);
    this.owners.delete(id);
  }

  async markFailed(id: string, error: unknown, claimToken?: Buffer): Promise<void> {
    await this.owner(id).markFailed?.(id, error, claimToken);
    this.owners.delete(id);
  }

  private remember(event: OutboxEvent, source: OutboxSource, sourceName: 'foundation' | 'identity'): OutboxEvent {
    this.owners.set(event.id, source);
    return { ...event, source: sourceName };
  }

  private owner(id: string): OutboxSource {
    const source = this.owners.get(id);
    if (source === undefined) throw new Error('Outbox event ownership is unknown.');
    return source;
  }
}
