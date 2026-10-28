import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { PostgresOutboxSource } from '../../apps/worker/src/postgres-outbox-source.js';
import { OutboxWorker } from '../../apps/worker/src/worker.js';

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(databaseUrl === undefined)('PostgreSQL outbox worker protocol', () => {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 4 });
  const organizationId = randomUUID();
  const eventIds: string[] = [];

  beforeAll(async () => {
    await pool.query('INSERT INTO core.organization (id, name) VALUES ($1, $2)', [organizationId, 'Outbox Test Org']);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM integration.outbox_event WHERE organization_id = $1', [organizationId]);
    await pool.query('DELETE FROM core.organization WHERE id = $1', [organizationId]);
    await pool.end();
  });

  it('claims, publishes and acknowledges a real PostgreSQL outbox event', async () => {
    const eventId = randomUUID();
    eventIds.push(eventId);
    await pool.query("INSERT INTO integration.outbox_event (id, organization_id, aggregate_type, aggregate_id, event_type, payload) VALUES ($1, $2, 'Customer', $3, 'CustomerCreated', $4)", [eventId, organizationId, randomUUID(), { customerId: randomUUID() }]);
    const published: string[] = [];
    const source = new PostgresOutboxSource(pool);
    const worker = new OutboxWorker(source, { publish: async (event) => { published.push(event.id); } });

    await expect(worker.runOnce()).resolves.toBe(1);
    expect(published).toEqual([eventId]);
    await expect(pool.query("SELECT status FROM integration.outbox_event WHERE id = $1", [eventId])).resolves.toMatchObject({ rows: [{ status: 'PUBLISHED' }] });
  });

  it('returns failed publishes to a retryable pending state without acknowledging them', async () => {
    const eventId = randomUUID();
    eventIds.push(eventId);
    await pool.query("INSERT INTO integration.outbox_event (id, organization_id, aggregate_type, aggregate_id, event_type, payload) VALUES ($1, $2, 'Customer', $3, 'CustomerCreated', $4)", [eventId, organizationId, randomUUID(), { customerId: randomUUID() }]);
    const source = new PostgresOutboxSource(pool);
    const worker = new OutboxWorker(source, { publish: async () => { throw new Error('broker unavailable'); } });

    await expect(worker.runOnce()).rejects.toThrow('broker unavailable');
    await expect(pool.query("SELECT status, attempts, last_error_code FROM integration.outbox_event WHERE id = $1", [eventId])).resolves.toMatchObject({ rows: [{ status: 'PENDING', attempts: 1, last_error_code: 'Error' }] });
  });
});
