import { loadRuntimeConfig } from '../../apps/api/src/config/runtime-config.js';

describe('runtime configuration', () => {
  it('fails closed when a production secret is missing or too short', () => {
    expect(() => loadRuntimeConfig({ NODE_ENV: 'production', DATABASE_URL: 'postgres://localhost/db', SESSION_SECRET: 'short' })).toThrow(/SESSION_SECRET/);
    expect(() => loadRuntimeConfig({ NODE_ENV: 'production', DATABASE_URL: 'postgres://localhost/db' })).toThrow(/SESSION_SECRET/);
  });

  it('accepts an explicit isolated non-production configuration without logging secrets', () => {
    const config = loadRuntimeConfig({ NODE_ENV: 'test', DATABASE_URL: 'postgres://localhost/db', SESSION_SECRET: 's'.repeat(32) });

    expect(config).toMatchObject({ nodeEnv: 'test', databaseUrl: 'postgres://localhost/db' });
    expect(config).not.toHaveProperty('password');
  });
});
