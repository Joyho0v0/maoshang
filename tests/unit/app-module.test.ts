import 'reflect-metadata';
import { InMemoryIdempotencyStore } from '../../apps/api/src/modules/integration/idempotency/in-memory-idempotency-store.js';
import { AppModule } from '../../apps/api/src/app.module.js';

describe('API module provider wiring', () => {
  it('uses an explicit factory for the configurable in-memory test store', () => {
    const providers = Reflect.getMetadata('providers', AppModule) as unknown[];
    expect(providers.some((provider) => typeof provider === 'object' && provider !== null && 'provide' in provider && provider.provide === InMemoryIdempotencyStore && 'useFactory' in provider && typeof provider.useFactory === 'function')).toBe(true);
  });
});
