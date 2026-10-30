import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import pg from 'pg';
import { loadRuntimeConfig, type RuntimeConfig } from '../../api/src/config/runtime-config.js';
import { PostgresOutboxSource } from './postgres-outbox-source.js';
import { CombinedOutboxSource } from './combined-outbox-source.js';
import { OutboxWorker, type EventPublisher } from './worker.js';
import { IdentityCommandProcessor } from './identity-command-processor.js';
import { PostgresIdentityStore } from '../../api/src/modules/identity/infrastructure/postgres-identity.store.js';
import { PostgresIdempotencyRepository } from '../../api/src/modules/integration/idempotency/postgres-idempotency-repository.js';
import { PostgresFilesStore } from '../../api/src/modules/files/infrastructure/postgres-files.store.js';
import { ControlledFakeObjectStorageAdapter, ControlledFakeScanAdapter } from '../../api/src/modules/files/infrastructure/file-adapters.js';
import { FileCommandProcessor } from './file-command-processor.js';

export function buildWorker(config: RuntimeConfig, pool: pg.Pool = new pg.Pool({ connectionString: config.databaseUrl, max: 4 })): { worker: OutboxWorker; pool: pg.Pool } {
  if (config.nodeEnv === 'production') throw new Error('Controlled file adapters are disabled in production.');
  const source = new CombinedOutboxSource(new PostgresOutboxSource(pool), new PostgresOutboxSource(pool, 'integration.identity_outbox_event'));
  const idempotency = new PostgresIdempotencyRepository(pool);
  const identityCommands = new IdentityCommandProcessor(new PostgresIdentityStore(pool), idempotency);
  const fileCommands = new FileCommandProcessor(new PostgresFilesStore(pool), idempotency, new ControlledFakeObjectStorageAdapter(), new ControlledFakeScanAdapter());
  const publisher: EventPublisher = {
    async publish(event) {
      await identityCommands.process(event);
      await fileCommands.process(event);
      process.stdout.write(JSON.stringify({ eventId: event.id, topic: event.topic }) + '\n');
    },
  };
  return { worker: new OutboxWorker(source, publisher), pool };
}
export async function runWorkerFromEnvironment(env: Record<string, string | undefined> = process.env): Promise<void> {
  const config = loadRuntimeConfig(env);
  const { worker, pool } = buildWorker(config);
  const once = env.WORKER_ONCE === 'true';
  let stopping = false;
  const stop = () => { stopping = true; };
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
  try {
    do {
      const processed = await worker.runOnce();
      if (once || stopping) break;
      if (processed === 0) await sleep(1000);
    } while (!stopping);
  } finally {
    process.off('SIGTERM', stop);
    process.off('SIGINT', stop);
    await pool.end();
  }
}

export async function runWorkerOnce(source: ConstructorParameters<typeof OutboxWorker>[0], publisher: ConstructorParameters<typeof OutboxWorker>[1]): Promise<number> {
  return new OutboxWorker(source, publisher).runOnce();
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    await runWorkerFromEnvironment();
  } catch (error) {
    process.stderr.write(error instanceof Error ? `${error.message}\n` : 'Unable to start worker.\n');
    process.exitCode = 1;
  }
}
