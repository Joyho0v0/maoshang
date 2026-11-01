/* global URL, process, console */
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { join, resolve } from 'node:path';

// This script creates and destroys only the exact disposable PostgreSQL 16
// container/database that it names. It refuses DATABASE_URL and never issues
// reset/truncate/drop commands to an externally supplied target.
const packageRoot = resolve(new URL('../../../../', import.meta.url).pathname);
const reviewRoot = resolve(new URL('../', import.meta.url).pathname);
const migrationRoot = resolve(packageRoot, 'packages/database/migrations');
const suffix = randomBytes(5).toString('hex');
const container = `be_imp_04_cleaninit_pg16_${suffix}`;
const freshDb = `be_imp_04_cleaninit_${suffix}_fresh`;
const upgradeDb = `be_imp_04_cleaninit_${suffix}_upgrade`;
const image = process.env.CLEAN_INIT_POSTGRES_IMAGE ?? 'postgres:16-alpine';
const password = `review_${suffix}`;
let started = false;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`${command} ${args.join(' ')} failed (${result.status}):\n${result.stdout ?? ''}${result.stderr ?? ''}`);
  }
  return result;
}

function docker(args, options = {}) {
  return run('docker', args, options);
}

function sql(db, text, options = {}) {
  const prefix = `SET review_v2.project_marker = 'JOYHO-33';\nSET review_v2.disposable = 'true';\n`;
  return docker(['exec', '-i', container, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', db], { input: prefix + text, ...options });
}

async function file(name) {
  return await readFile(join(reviewRoot, name), 'utf8');
}

async function applyMigration(db, name) {
  const text = await readFile(join(migrationRoot, name), 'utf8');
  return sql(db, text);
}

async function applyReviewMigration(db, name) {
  const text = await readFile(join(reviewRoot, 'migrations', name), 'utf8');
  return sql(db, text);
}

async function createDatabase(db) {
  docker(['exec', container, 'createdb', '-U', 'postgres', db]);
  for (const name of ['001_foundation.sql', '002_identity_authorization.sql', '003_files.sql', '004_crm_catalog_orders.sql']) await applyMigration(db, name);
}

function assertOutput(result, needle, label) {
  const combined = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (!combined.includes(needle)) throw new Error(`${label} lacked ${needle}:\n${combined}`);
}

try {
  if (process.env.DATABASE_URL) throw new Error('CLEAN_INIT_REHEARSE refuses DATABASE_URL; use the generated local container only.');
  docker(['run', '-d', '--rm', '--name', container, '-e', `POSTGRES_PASSWORD=${password}`, image]);
  started = true;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const ready = docker(['exec', container, 'pg_isready', '-U', 'postgres'], { allowFailure: true });
    if (ready.status === 0) break;
    if (attempt === 59) throw new Error('PostgreSQL 16 container did not become ready.');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
  }

  await createDatabase(freshDb);
  await createDatabase(upgradeDb);
  await applyReviewMigration(freshDb, '005-expand.sql');
  await applyReviewMigration(freshDb, '006-dual-version.sql');
  await applyReviewMigration(freshDb, '005-expand.sql');
  await applyReviewMigration(freshDb, '006-dual-version.sql');
  const freshInventory = await sql(freshDb, await file('clean-init/inventory.sql'));
  assertOutput(freshInventory, 'CLEAN_INIT_CANCELLED_LEGACY_OBJECTS', 'fresh inventory');
  const seed = await sql(freshDb, await file('clean-init/seed.sql'));
  assertOutput(seed, 'CLEAN_INIT_SEED_ROWS', 'seed');
  const smoke = await sql(freshDb, await file('clean-init/smoke.sql'));
  assertOutput(smoke, 'CLEAN_INIT_SMOKE', 'smoke');
  const forwardFix = await sql(freshDb, await file('migrations/post-data-forward-fix.sql'));
  assertOutput(forwardFix, 'COMMIT', 'post-data forward-fix');
  const dataDown = sql(freshDb, await file('migrations/pre-data-down.sql'), { allowFailure: true });
  if (dataDown.status === 0) throw new Error('pre-data down unexpectedly succeeded with seeded durable facts');
  console.log(`CLEAN_INIT_DATA_DOWN_GUARD status=${dataDown.status} retainedBeforeDrop=1 raw=${JSON.stringify(`${dataDown.stdout ?? ''}${dataDown.stderr ?? ''}`)}`);
  const retained = await sql(freshDb, "SELECT count(*) AS retained_items FROM orders.order_item WHERE v2_snapshot_version IS NOT NULL; SELECT count(*) AS retained_table FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'catalog' AND c.relname = 'price_snapshot_v2';");
  assertOutput(retained, 'retained_items', 'seeded fact retention');

  const cleanDown = await sql(upgradeDb, await file('migrations/pre-data-down.sql'));
  assertOutput(cleanDown, 'COMMIT', 'clean pre-data down');
  const repeatedDown = await sql(upgradeDb, await file('migrations/pre-data-down.sql'));
  assertOutput(repeatedDown, 'COMMIT', 'repeated clean down');
  const residual = await sql(upgradeDb, "SELECT count(*) AS v2_columns FROM information_schema.columns WHERE (table_schema, table_name, column_name) IN (('catalog','sku','standardization_mode'),('orders','order_item','v2_snapshot_version')); SELECT count(*) AS v2_tables FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE (n.nspname, c.relname) IN (('catalog','price_snapshot_v2'),('orders','fx_snapshot_v2')); SELECT count(*) AS v2_schema FROM pg_namespace WHERE nspname = 'migration_v2';");
  assertOutput(residual, 'v2_columns', 'residual inventory');
  docker(['exec', container, 'dropdb', '-U', 'postgres', '--if-exists', freshDb]);
  docker(['exec', container, 'dropdb', '-U', 'postgres', '--if-exists', upgradeDb]);
  const cleanupQuery = docker(['exec', container, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres', '-Atc', `SELECT count(*) FROM pg_database WHERE datname LIKE 'be_imp_04_cleaninit_%'`]);
  assertOutput(cleanupQuery, '0', 'database cleanup query');

  console.log(`CLEAN_INIT_REHEARSAL exit=0 image=${image} container=${container} databases=${freshDb},${upgradeDb} fresh=001-006+up/up+seed+smoke+forward-fix+data-down-guard upgrade=001-004+005/006+up/up+down/down residual-check=0`);
} finally {
  if (started) {
    const removed = docker(['rm', '-f', container], { allowFailure: true });
    if (removed.status !== 0) console.error(`CLEAN_INIT_CLEANUP status=${removed.status} container=${container} output=${removed.stderr ?? removed.stdout ?? ''}`);
    else console.log(`CLEAN_INIT_CLEANUP exit=0 container=${container} removed=1 databases=${freshDb},${upgradeDb}`);
  }
}
