import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const MIGRATION_FILES = [
  ['001', '001_foundation.sql'],
  ['002', '002_identity_authorization.sql'],
  ['003', '003_files.sql'],
  ['004', '004_crm_catalog_orders.sql'],
] as const;

const FIXED_BOOTSTRAP_FILES = new Set([
  'crm-catalog-orders-http-postgres.test.ts',
  'idempotency-postgres.test.ts',
  'outbox-postgres.test.ts',
]);

export function bootstrapForIntegrationFile(fileName: string): string[] {
  return FIXED_BOOTSTRAP_FILES.has(fileName) ? MIGRATION_FILES.map(([number]) => number) : [];
}

export function databaseNameForIntegrationFile(fileName: string, index: number, pid: number, suffix: string): string {
  const slug = fileName.replace(/\.test\.ts$/, '').replace(/[^a-z0-9]+/gi, '_').toLowerCase().slice(0, 18);
  return `be_imp_04_i${index}_p${pid}_${suffix}_${slug}`.slice(0, 63);
}

export function databaseUrlForName(baseUrl: string, databaseName: string): string {
  const parsed = new URL(baseUrl);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
}

function maintenanceUrl(baseUrl: string): string {
  const parsed = new URL(baseUrl);
  if (parsed.hostname !== '' && !['localhost', '127.0.0.1', '[::1]', '::1'].includes(parsed.hostname)) {
    throw new Error('Isolated integration tests require a local PostgreSQL host; refusing a remote or production DATABASE_URL.');
  }
  parsed.pathname = '/postgres';
  return parsed.toString();
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

async function createDatabase(adminUrl: string, databaseName: string): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await client.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
  } finally {
    await client.end();
  }
}

async function dropDatabase(adminUrl: string, databaseName: string): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await client.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)} WITH (FORCE)`);
  } finally {
    await client.end();
  }
}

async function applyBootstrap(databaseUrl: string, numbers: readonly string[]): Promise<void> {
  if (numbers.length === 0) return;
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query('BEGIN');
    for (const number of numbers) {
      const migration = MIGRATION_FILES.find(([candidate]) => candidate === number);
      if (migration === undefined) throw new Error(`Unknown integration bootstrap migration: ${number}`);
      await client.query(await readFile(new URL(`../../packages/database/migrations/${migration[1]}`, import.meta.url), 'utf8'));
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

function runVitestFile(fileName: string, databaseUrl: string, databaseName: string): Promise<number> {
  const vitest = fileURLToPath(new URL('../../node_modules/vitest/vitest.mjs', import.meta.url));
  const child = spawn(process.execPath, [vitest, 'run', '--no-file-parallelism', `tests/integration/${fileName}`], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl, INTEGRATION_ISOLATED_DATABASE: databaseName },
    stdio: 'inherit',
  });
  return new Promise((resolve) => {
    child.on('error', () => resolve(1));
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

async function runParallel(plans: readonly { fileName: string; databaseUrl: string; databaseName: string }[]): Promise<number[]> {
  const results: number[] = [];
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < plans.length) {
      const index = next;
      next += 1;
      const plan = plans[index];
      if (plan !== undefined) results[index] = await runVitestFile(plan.fileName, plan.databaseUrl, plan.databaseName);
    }
  };
  await Promise.all(Array.from({ length: Math.min(2, plans.length) }, () => worker()));
  return results;
}

async function integrationFiles(): Promise<string[]> {
  const directory = fileURLToPath(new URL('.', import.meta.url));
  return (await readdir(directory)).filter((fileName) => fileName.endsWith('.test.ts')).sort();
}

export async function runIsolatedIntegration(): Promise<number> {
  const baseUrl = process.env.DATABASE_URL;
  if (baseUrl === undefined || baseUrl.length === 0) throw new Error('DATABASE_URL is required for isolated integration tests.');
  const adminUrl = maintenanceUrl(baseUrl);
  const files = await integrationFiles();
  const plans = files.map((fileName, index) => {
    const databaseName = databaseNameForIntegrationFile(fileName, index, process.pid, randomUUID().slice(0, 8));
    return { fileName, databaseName, databaseUrl: databaseUrlForName(baseUrl, databaseName), bootstrap: bootstrapForIntegrationFile(fileName) };
  });
  const created: typeof plans = [];
  const results: number[] = [];
  try {
    for (const plan of plans) {
      await createDatabase(adminUrl, plan.databaseName);
      created.push(plan);
      await applyBootstrap(plan.databaseUrl, plan.bootstrap);
      process.stdout.write(`ISOLATED_DB_CREATED file=${plan.fileName} database=${plan.databaseName} bootstrap=${plan.bootstrap.join('->') || 'empty'}\n`);
    }
    const parallel = process.env.INTEGRATION_PARALLEL === '1' || process.env.INTEGRATION_PARALLEL === 'true';
    if (parallel) {
      results.push(...await runParallel(plans));
    } else {
      for (const plan of plans) results.push(await runVitestFile(plan.fileName, plan.databaseUrl, plan.databaseName));
    }
  } finally {
    for (const plan of [...created].reverse()) {
      try {
        await dropDatabase(adminUrl, plan.databaseName);
        process.stdout.write(`ISOLATED_DB_DROPPED database=${plan.databaseName}\n`);
      } catch (error) {
        results.push(1);
        process.stderr.write(`ISOLATED_DB_DROP_FAILED database=${plan.databaseName} error=${error instanceof Error ? error.message : String(error)}\n`);
      }
    }
    const check = new pg.Client({ connectionString: adminUrl });
    await check.connect();
    try {
      const names = created.map((plan) => plan.databaseName);
      const remaining = names.length === 0 ? [] : (await check.query<{ datname: string }>('SELECT datname FROM pg_database WHERE datname = ANY($1::text[])', [names])).rows.map((row) => row.datname);
      process.stdout.write(`ISOLATED_DB_REMAINING count=${remaining.length}${remaining.length === 0 ? '' : ` names=${remaining.join(',')}`}\n`);
      if (remaining.length > 0) results.push(1);
    } finally {
      await check.end();
    }
  }
  return results.some((result) => result !== 0) ? 1 : 0;
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    process.exitCode = await runIsolatedIntegration();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
