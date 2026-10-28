import { OutboxWorker } from './worker.js';

export async function runWorkerOnce(source: ConstructorParameters<typeof OutboxWorker>[0], publisher: ConstructorParameters<typeof OutboxWorker>[1]): Promise<number> {
  return new OutboxWorker(source, publisher).runOnce();
}
