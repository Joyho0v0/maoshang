export interface OutboxEvent {
  id: string;
  topic: string;
  payload: Record<string, unknown>;
}

export interface OutboxSource {
  claimBatch(limit: number): Promise<OutboxEvent[]>;
  markPublished(id: string): Promise<void>;
}

export interface EventPublisher {
  publish(event: OutboxEvent): Promise<void>;
}

export class OutboxWorker {
  constructor(private readonly source: OutboxSource, private readonly publisher: EventPublisher) {}

  async runOnce(limit = 50): Promise<number> {
    const events = await this.source.claimBatch(limit);
    for (const event of events) {
      await this.publisher.publish(event);
      await this.source.markPublished(event.id);
    }
    return events.length;
  }
}
