export interface OutboxEvent {
  id: string;
  topic: string;
  payload: Record<string, unknown>;
  organizationId?: string;
  attempts?: number;
  claimToken?: Buffer;
  source?: 'foundation' | 'identity';
}

export interface OutboxSource {
  claimBatch(limit: number): Promise<OutboxEvent[]>;
  markPublished(id: string, claimToken?: Buffer): Promise<void>;
  markFailed?(id: string, error: unknown, claimToken?: Buffer): Promise<void>;
}

export interface EventPublisher {
  publish(event: OutboxEvent): Promise<void>;
}

export class OutboxWorker {
  constructor(private readonly source: OutboxSource, private readonly publisher: EventPublisher) {}

  async runOnce(limit = 50): Promise<number> {
    const events = await this.source.claimBatch(limit);
    for (const event of events) {
      try {
        await this.publisher.publish(event);
        await this.source.markPublished(event.id, event.claimToken);
      } catch (error) {
        await this.source.markFailed?.(event.id, error, event.claimToken);
        throw error;
      }
    }
    return events.length;
  }
}
