import { describe, expect, it } from 'vitest';
import {
  bootstrapForIntegrationFile,
  databaseNameForIntegrationFile,
  databaseUrlForName,
} from '../../tests/integration/run-isolated.js';

describe('isolated integration runner planning', () => {
  it('assigns the fixed 001 to 004 bootstrap only to suites that require it', () => {
    expect(bootstrapForIntegrationFile('crm-catalog-orders-http-postgres.test.ts')).toEqual(['001', '002', '003', '004']);
    expect(bootstrapForIntegrationFile('idempotency-postgres.test.ts')).toEqual(['001', '002', '003', '004']);
    expect(bootstrapForIntegrationFile('identity-http-postgres.test.ts')).toEqual([]);
    expect(bootstrapForIntegrationFile('files-postgres.test.ts')).toEqual([]);
  });

  it('keeps per-file database names traceable and safe for PostgreSQL identifiers', () => {
    const name = databaseNameForIntegrationFile('identity-http-postgres.test.ts', 3, 42, 'abcdef12');
    expect(name).toMatch(/^be_imp_04_i3_p42_abcdef12_[a-z0-9_]+$/);
    expect(name.length).toBeLessThanOrEqual(63);
  });

  it('replaces only the database component while preserving connection options', () => {
    expect(databaseUrlForName('postgresql://tester:p%40ss@localhost:5433/shared?sslmode=disable', 'isolated_db'))
      .toBe('postgresql://tester:p%40ss@localhost:5433/isolated_db?sslmode=disable');
  });
});
