/* global URL, process, console */
import { createHash, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

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
  return docker(['exec', '-i', container, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', db], { input: text, ...options });
}

function scalar(db, query) {
  const result = docker(['exec', container, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', db, '-At', '-F', '|', '-c', query]);
  return (result.stdout ?? '').trim();
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function livePreflightReport(db, identity, manifestDigest, seedSqlDigest) {
  const migrationNames = ['001_foundation.sql', '002_identity_authorization.sql', '003_files.sql', '004_crm_catalog_orders.sql'];
  const migrationDigests = [];
  for (const name of migrationNames) migrationDigests.push({ name, sha256: sha256(await readFile(join(migrationRoot, name))) });
  const historyDigest = sha256(migrationDigests.map(({ name, sha256: digest }) => `${name}:${digest}`).join('\n'));
  const expandText = `${await readFile(join(reviewRoot, 'migrations/005-expand.sql'))}\n${await readFile(join(reviewRoot, 'migrations/006-dual-version.sql'))}`;
  const expandDigest = sha256(expandText);
  const exactRevision = run('git', ['rev-parse', 'HEAD']).stdout.trim();
  const organizationIds = JSON.parse(scalar(db, "SELECT COALESCE(json_agg(id::text ORDER BY id), '[]'::json) FROM org.organization"));
  const tables = [];
  for (const [schemaName, tableName] of [['org', 'organization'], ['catalog', 'sku'], ['orders', 'order_item']]) {
    tables.push({ schema: schemaName, table: tableName, rowCount: Number(scalar(db, `SELECT count(*) FROM ${schemaName}.${tableName}`)), organizationIds });
  }
  const report = {
    reportVersion: 2,
    projectId: 'JOYHO-33',
    exactRevision,
    workspace: process.cwd(),
    decision: 'PROCEED',
    stopReasons: [],
    environment: { class: 'disposable-local', projectMarker: 'JOYHO-33', disposable: true, owner: 'clean-init-rehearsal' },
    database: { host: identity.host, port: Number(identity.port), name: identity.name, oid: Number(identity.oid), owner: identity.owner, readOnly: identity.readOnly, recovery: identity.recovery, clusterIdentifier: String(identity.clusterIdentifier), serverVersion: identity.serverVersion },
    migrations: { historyDigest, expectedHistoryDigest: historyDigest, migrationDigests, expandDigest },
    seed: { manifestDigest, sqlDigest: seedSqlDigest, manifestVersion: 1, synthetic: true },
    ownedTables: tables,
    organizations: organizationIds,
    activeSessions: { total: identity.totalSessions, external: identity.externalSessions, sources: ['live pg_stat_activity'] },
    approval: { approvedBy: 'clean-init-rehearsal', approvedAt: new Date().toISOString(), executedBy: 'review-only-runner' },
    plan: { verification: 'Live OID/cluster, owner, sessions, rows, migration and seed digests are checked before seed.', stopAndRecovery: 'Stop on mismatch; retain evidence and drop only the two named local databases.' },
    verification: { migrationDigestMatch: true, seedDigestMatch: true, ownerAndScopeClear: true },
    recovery: { mode: 'DROP_NAMED_DATABASE', owner: 'clean-init-rehearsal' },
    strategy: 'NEW_DATABASE',
  };
  const schema = JSON.parse(await readFile(join(reviewRoot, 'clean-init/preflight-report.schema.json')));
  const validator = new Ajv({ allErrors: true, strict: false });
  addFormats(validator);
  const validate = validator.compile(schema);
  const valid = validate(report);
  assert(valid, `live preflight report failed schema validation: ${JSON.stringify(validate.errors)}`);
  return report;
}

function liveIdentity(db, mappedPort) {
  const result = docker(['exec', container, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', db, '-At', '-c', `SELECT json_build_object(
    'host', '127.0.0.1', 'port', ${mappedPort ?? 'inet_server_port()'}, 'name', current_database(),
    'oid', (SELECT oid FROM pg_database WHERE datname = current_database()),
    'owner', current_user, 'readOnly', current_setting('default_transaction_read_only')::boolean,
    'recovery', pg_is_in_recovery(), 'clusterIdentifier', (pg_control_system()).system_identifier::text,
    'serverVersion', current_setting('server_version'),
    'totalSessions', (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()),
    'externalSessions', (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid())
  )`]);
  if (result.status !== 0) throw new Error(`live preflight failed: ${result.stderr}`);
  return JSON.parse((result.stdout ?? '').trim());
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
  let created;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    created = docker(['exec', container, 'createdb', '-U', 'postgres', db], { allowFailure: true });
    if (created.status === 0) break;
    if (attempt === 19) throw new Error(`createdb ${db} did not become available:\n${created.stdout ?? ''}${created.stderr ?? ''}`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
  }
  for (const name of ['001_foundation.sql', '002_identity_authorization.sql', '003_files.sql', '004_crm_catalog_orders.sql']) await applyMigration(db, name);
}

function assertOutput(result, needle, label) {
  const combined = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (!combined.includes(needle)) throw new Error(`${label} lacked ${needle}:\n${combined}`);
}

try {
  if (process.env.DATABASE_URL) throw new Error('CLEAN_INIT_REHEARSE refuses DATABASE_URL; use the generated local container only.');
  docker(['run', '-d', '--rm', '--name', container, '-p', '127.0.0.1::5432', '-e', `POSTGRES_PASSWORD=${password}`, image]);
  started = true;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const ready = docker(['exec', container, 'pg_isready', '-U', 'postgres'], { allowFailure: true });
    if (ready.status === 0) break;
    if (attempt === 59) throw new Error('PostgreSQL 16 container did not become ready.');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
  }

  const mappedPortText = docker(['port', container, '5432/tcp']).stdout.trim();
  const mappedPort = Number(mappedPortText.match(/:(\d+)$/)?.[1]);
  if (!Number.isInteger(mappedPort) || mappedPort <= 0) throw new Error(`unable to resolve isolated PostgreSQL port: ${mappedPortText}`);

  await createDatabase(freshDb);
  await createDatabase(upgradeDb);
  const preflightIdentity = liveIdentity(freshDb, mappedPort);
  const upgradeIdentity = liveIdentity(upgradeDb, mappedPort);
  assert(preflightIdentity.name === freshDb && preflightIdentity.readOnly === false && preflightIdentity.recovery === false && preflightIdentity.externalSessions === 0, 'live preflight did not prove an isolated writable database');
  assert(upgradeIdentity.name === upgradeDb && upgradeIdentity.readOnly === false && upgradeIdentity.recovery === false && upgradeIdentity.externalSessions === 0, 'upgrade preflight did not prove an isolated writable database');
  const manifest = JSON.parse(await file('clean-init/seed-manifest.example.json'));
  const seedSql = await file('clean-init/seed.sql');
  const manifestDigest = sha256(JSON.stringify(manifest));
  const seedSqlDigest = sha256(seedSql);
  const report = await livePreflightReport(freshDb, preflightIdentity, manifestDigest, seedSqlDigest);
  assert(report.database.oid === Number(preflightIdentity.oid) && report.database.clusterIdentifier === String(preflightIdentity.clusterIdentifier), 'live preflight report identity was not bound to the connection');
  console.log(`CLEAN_INIT_PREFLIGHT_LIVE exit=0 decision=${report.decision} database=${report.database.name} oid=${report.database.oid} cluster=${report.database.clusterIdentifier} externalSessions=${report.activeSessions.external} reportValidated=1`);
  const bindingFor = (identity, unitPrice = '19.9900') => `BEGIN;\nCREATE TEMP TABLE review_v2_seed_binding (database_name text, database_oid oid, cluster_identifier text, manifest_digest text, seed_sql_digest text, project_id text, disposable boolean, policy_id uuid, unit_price numeric, risk_buffer_bps integer, source_policy_id uuid) ON COMMIT DROP;\nINSERT INTO review_v2_seed_binding VALUES (${quote(identity.name)}, ${Number(identity.oid)}, ${quote(String(identity.clusterIdentifier))}, ${quote(manifestDigest)}, ${quote(seedSqlDigest)}, 'JOYHO-33', true, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', ${unitPrice}, 25, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');\n`;
  const wrongBinding = bindingFor(upgradeIdentity, '19.9800');
  const mutationGuard = await sql(upgradeDb, wrongBinding + seedSql, { allowFailure: true });
  if (mutationGuard.status === 0 || scalar(upgradeDb, "SELECT count(*) FROM catalog.product;") !== '0') throw new Error('seed mutation-before-write guard did not fail closed');
  console.log(`CLEAN_INIT_SEED_MUTATION_GUARD status=${mutationGuard.status} rowsAfterFailure=0`);
  const legacy = await sql(upgradeDb, await file('clean-init/legacy-null.sql'));
  assertOutput(legacy, 'COMMIT', 'legacy-null v1 write');
  await applyReviewMigration(upgradeDb, '005-expand.sql');
  await applyReviewMigration(upgradeDb, '006-dual-version.sql');
  await applyReviewMigration(upgradeDb, '005-expand.sql');
  await applyReviewMigration(upgradeDb, '006-dual-version.sql');
  const legacyEvidence = scalar(upgradeDb, "SELECT (SELECT count(*) FROM catalog.sku WHERE standardization_mode IS NULL) || '|' || (SELECT count(*) FROM orders.order_item WHERE v2_snapshot_version IS NULL);");
  if (legacyEvidence !== '1|1') throw new Error(`legacy-null facts were not preserved: ${legacyEvidence}`);
  console.log(`CLEAN_INIT_LEGACY_NULL exit=0 skuStandardizationNull=1 orderItemSnapshotNull=1 stateConflict=409/UNCLASSIFIED`);
  await applyReviewMigration(freshDb, '005-expand.sql');
  await applyReviewMigration(freshDb, '006-dual-version.sql');
  await applyReviewMigration(freshDb, '005-expand.sql');
  await applyReviewMigration(freshDb, '006-dual-version.sql');
  const freshInventory = await sql(freshDb, await file('clean-init/inventory.sql'));
  assertOutput(freshInventory, 'CLEAN_INIT_CANCELLED_LEGACY_OBJECTS', 'fresh inventory');
  const seed = await sql(freshDb, bindingFor(preflightIdentity) + seedSql);
  assertOutput(seed, 'CLEAN_INIT_SEED_ROWS', 'seed');
  const smoke = await sql(freshDb, await file('clean-init/smoke.sql'));
  assertOutput(smoke, 'CLEAN_INIT_SMOKE', 'smoke');
  const policyScript = fileURLToPath(new URL('./policy-lifecycle.mjs', import.meta.url));
  const policyRun = run(process.execPath, [policyScript], { env: { ...process.env, REVIEW_PG_PORT: String(mappedPort), REVIEW_PG_PASSWORD: password, REVIEW_PG_DATABASE: freshDb } });
  assert(policyRun.status === 0, `policy lifecycle rehearsal failed: ${policyRun.stdout}${policyRun.stderr}`);
  process.stdout.write(policyRun.stdout);
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
  const residual = scalar(upgradeDb, "SELECT (SELECT count(*) FROM information_schema.columns WHERE (table_schema, table_name, column_name) IN (('catalog','sku','standardization_mode'),('orders','order_item','v2_snapshot_version'))) || '|' || (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE (n.nspname, c.relname) IN (('catalog','price_snapshot_v2'),('orders','fx_snapshot_v2'))) || '|' || (SELECT count(*) FROM pg_namespace WHERE nspname = 'migration_v2') || '|' || (SELECT count(*) FROM pg_constraint WHERE conname LIKE '%v2%') || '|' || (SELECT count(*) FROM pg_indexes WHERE indexname LIKE '%v2%') || '|' || (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'catalog' AND p.proname LIKE '%v2%') || '|' || (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid WHERE NOT t.tgisinternal AND t.tgname LIKE '%v2%');");
  if (residual !== '0|0|0|0|0|0|0') throw new Error(`exact residual inventory mismatch: ${residual}`);
  const negativeAssertion = await sql(upgradeDb, await file('clean-init/assertion-negative.sql'), { allowFailure: true });
  if (negativeAssertion.status === 0) throw new Error('negative residual assertion unexpectedly passed');
  docker(['exec', container, 'dropdb', '-U', 'postgres', '--if-exists', freshDb]);
  docker(['exec', container, 'dropdb', '-U', 'postgres', '--if-exists', upgradeDb]);
  const cleanupQuery = docker(['exec', container, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres', '-Atc', `SELECT count(*) FROM pg_database WHERE datname LIKE 'be_imp_04_cleaninit_%'`]);
  assertOutput(cleanupQuery, '0', 'database cleanup query');

  console.log(`CLEAN_INIT_REHEARSAL exit=0 image=${image} container=${container} databases=${freshDb},${upgradeDb} fresh=001-006+up/up+validate+seed+smoke+forward-fix+data-down-guard upgrade=001-004+005/006+up/up+validate+down/down residual-check=0`);
} finally {
  if (started) {
    const removed = docker(['rm', '-f', container], { allowFailure: true });
    if (removed.status !== 0) console.error(`CLEAN_INIT_CLEANUP status=${removed.status} container=${container} output=${removed.stderr ?? removed.stdout ?? ''}`);
    else console.log(`CLEAN_INIT_CLEANUP exit=0 container=${container} removed=1 databases=${freshDb},${upgradeDb}`);
  }
}

function quote(value) { return `'${String(value).replaceAll("'", "''")}'`; }
