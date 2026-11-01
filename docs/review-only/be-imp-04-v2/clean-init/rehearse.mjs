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
const overlapDb = `be_imp_04_cleaninit_${suffix}_overlap`;
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

function canonicalSeedSql(value) {
  return value.replaceAll('596b75db57c4f26184f7f6d5f3d5b0f65ef7d9917ef86e1d5b70b65540e9248c', '__SEED_SQL_CANONICAL_DIGEST__');
}

async function livePreflightReport(db, identity, manifestDigest, seedSqlDigest) {
  const migrationNames = ['001_foundation.sql', '002_identity_authorization.sql', '003_files.sql', '004_crm_catalog_orders.sql'];
  const migrationDigests = [];
  for (const name of migrationNames) migrationDigests.push({ name, sha256: sha256(await readFile(join(migrationRoot, name))) });
  const historyDigest = sha256(migrationDigests.map(({ name, sha256: digest }) => `${name}:${digest}`).join('\n'));
  const expandText = `${await readFile(join(reviewRoot, 'migrations/005-expand.sql'))}\n${await readFile(join(reviewRoot, 'migrations/006-dual-version.sql'))}`;
  const expandDigest = sha256(expandText);
  const approved = JSON.parse(await readFile(join(reviewRoot, 'clean-init/preflight-approved-digests.json')));
  const migrationDigestMatch = historyDigest === approved.migrationHistoryDigest
    && expandDigest === approved.expandDigest
    && JSON.stringify(migrationDigests) === JSON.stringify(approved.migrationDigests);
  const exactRevision = run('git', ['rev-parse', 'HEAD']).stdout.trim();
  const organizationIds = JSON.parse(scalar(db, "SELECT COALESCE(json_agg(id::text ORDER BY id), '[]'::json) FROM org.organization"));
  const tables = [];
  for (const [schemaName, tableName] of [['org', 'organization'], ['catalog', 'sku'], ['orders', 'order_item']]) {
    tables.push({ schema: schemaName, table: tableName, rowCount: Number(scalar(db, `SELECT count(*) FROM ${schemaName}.${tableName}`)), organizationIds });
  }
  const rowsEmpty = tables.every((table) => table.rowCount === 0 && table.organizationIds.length === 0) && organizationIds.length === 0;
  const ownerAndScopeClear = identity.readOnly === false && identity.recovery === false && identity.externalSessions === 0 && rowsEmpty;
  const seedDigestMatch = manifestDigest === approved.seedManifestDigest && seedSqlDigest === '596b75db57c4f26184f7f6d5f3d5b0f65ef7d9917ef86e1d5b70b65540e9248c';
  const verification = { migrationDigestMatch, seedDigestMatch, ownerAndScopeClear };
  const stopReasons = [];
  if (!migrationDigestMatch) stopReasons.push('migration history or expand digest mismatch');
  if (!seedDigestMatch) stopReasons.push('seed manifest or SQL digest mismatch');
  if (!ownerAndScopeClear) stopReasons.push('database is not empty, writable, non-recovery, or externally occupied');
  const report = {
    reportVersion: 2,
    projectId: 'JOYHO-33',
    exactRevision,
    workspace: process.cwd(),
    decision: stopReasons.length === 0 ? 'PROCEED' : 'STOP',
    stopReasons,
    environment: { class: 'disposable-local', projectMarker: 'JOYHO-33', disposable: true, owner: 'clean-init-rehearsal' },
    database: { host: identity.host, port: Number(identity.port), name: identity.name, oid: Number(identity.oid), owner: identity.owner, readOnly: identity.readOnly, recovery: identity.recovery, clusterIdentifier: String(identity.clusterIdentifier), serverVersion: identity.serverVersion },
    migrations: { historyDigest, expectedHistoryDigest: approved.migrationHistoryDigest, migrationDigests, expandDigest },
    seed: { manifestDigest, sqlDigest: seedSqlDigest, manifestVersion: 1, synthetic: true },
    ownedTables: tables,
    organizations: organizationIds,
    activeSessions: { total: identity.totalSessions, external: identity.externalSessions, sources: ['live pg_stat_activity'] },
    approval: { approvedBy: 'clean-init-rehearsal', approvedAt: new Date().toISOString(), executedBy: 'review-only-runner' },
    plan: { verification: 'Live OID/cluster, owner, sessions, rows, migration and seed digests are checked before seed.', stopAndRecovery: 'Stop on mismatch; retain evidence and drop only the two named local databases.' },
    verification,
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

function assertExactInventory(db) {
  const columns = scalar(db, `SELECT COALESCE(string_agg(table_schema || '.' || table_name || '.' || column_name, ',' ORDER BY table_schema, table_name, column_name), '')
    FROM information_schema.columns
   WHERE (table_schema, table_name, column_name) IN (
     ('catalog', 'sku', 'standardization_mode'),
     ('catalog', 'price_policy', 'is_primary'), ('catalog', 'price_policy', 'risk_buffer_bps'),
     ('orders', 'order_item', 'line_id'), ('orders', 'order_item', 'v2_snapshot_version'),
     ('orders', 'order_item', 'standardization_mode'), ('orders', 'order_item', 'order_currency_v2'),
     ('orders', 'order_item', 'source_price_currency'), ('orders', 'order_item', 'source_unit_price'),
     ('orders', 'order_item', 'effective_unit_price_v2'), ('orders', 'order_item', 'line_amount_v2'),
     ('orders', 'order_item', 'price_snapshot_v2_id'), ('orders', 'order_item', 'fx_snapshot_v2_id'),
     ('orders', 'order_item', 'price_source_kind'), ('orders', 'order_item', 'price_captured_at'),
     ('orders', 'order_item', 'image_file_id'))`);
  const expectedColumns = 'catalog.price_policy.is_primary,catalog.price_policy.risk_buffer_bps,catalog.sku.standardization_mode,orders.order_item.effective_unit_price_v2,orders.order_item.fx_snapshot_v2_id,orders.order_item.image_file_id,orders.order_item.line_amount_v2,orders.order_item.line_id,orders.order_item.order_currency_v2,orders.order_item.price_captured_at,orders.order_item.price_snapshot_v2_id,orders.order_item.price_source_kind,orders.order_item.source_price_currency,orders.order_item.source_unit_price,orders.order_item.standardization_mode,orders.order_item.v2_snapshot_version';
  assert(columns === expectedColumns, `exact v2 column inventory mismatch: ${columns}`);
  const tables = scalar(db, "SELECT COALESCE(string_agg(n.nspname || '.' || c.relname, ',' ORDER BY n.nspname, c.relname), '') FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE (n.nspname, c.relname) IN (('catalog','price_snapshot_v2'),('orders','fx_snapshot_v2'));");
  assert(tables === 'catalog.price_snapshot_v2,orders.fx_snapshot_v2', `exact v2 table inventory mismatch: ${tables}`);
  const constraints = scalar(db, "SELECT COALESCE(string_agg(conname, ',' ORDER BY conname), '') FROM pg_constraint WHERE conname IN ('sku_v2_standardization_mode_ck','price_policy_v2_risk_buffer_ck','price_policy_v2_window_excl','price_snapshot_v2_shape_ck','order_item_v2_price_snapshot_fk','order_item_v2_fx_snapshot_fk','order_item_v2_image_file_fk','order_item_v2_kind_shape_ck','order_item_v2_price_shape_ck','order_item_v2_fx_shape_ck','order_item_v2_decimal_ck');");
  const expectedConstraints = 'order_item_v2_decimal_ck,order_item_v2_fx_shape_ck,order_item_v2_fx_snapshot_fk,order_item_v2_image_file_fk,order_item_v2_kind_shape_ck,order_item_v2_price_shape_ck,order_item_v2_price_snapshot_fk,price_policy_v2_risk_buffer_ck,price_policy_v2_window_excl,price_snapshot_v2_shape_ck,sku_v2_standardization_mode_ck';
  assert(constraints === expectedConstraints, `exact v2 constraint inventory mismatch: ${constraints}`);
  const indexes = scalar(db, "SELECT COALESCE(string_agg(indexname, ',' ORDER BY indexname), '') FROM pg_indexes WHERE indexname IN ('price_snapshot_v2_sku_idx','price_snapshot_v2_policy_idx','fx_snapshot_v2_pair_idx','order_item_v2_line_idx','order_item_v2_line_uq','order_item_v2_price_snapshot_idx','order_item_v2_fx_snapshot_idx','order_item_v2_image_idx','price_policy_v2_primary_open_uq')");
  const expectedIndexes = 'fx_snapshot_v2_pair_idx,order_item_v2_fx_snapshot_idx,order_item_v2_image_idx,order_item_v2_line_idx,order_item_v2_line_uq,order_item_v2_price_snapshot_idx,price_policy_v2_primary_open_uq,price_snapshot_v2_policy_idx,price_snapshot_v2_sku_idx';
  assert(indexes === expectedIndexes, `exact v2 index inventory mismatch: ${indexes}`);
  const functions = scalar(db, "SELECT COALESCE(string_agg(n.nspname || '.' || p.proname, ',' ORDER BY p.proname), '') FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'catalog' AND p.proname LIKE '%v2%';");
  assert(functions === 'catalog.enforce_v2_price_policy_version,catalog.enforce_v2_price_policy_window,catalog.prevent_v2_snapshot_mutation', `exact v2 function inventory mismatch: ${functions}`);
  const triggers = scalar(db, "SELECT COALESCE(string_agg(t.tgname, ',' ORDER BY t.tgname), '') FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid WHERE NOT t.tgisinternal AND t.tgname LIKE '%_v2_%';");
  assert(triggers === 'fx_snapshot_v2_immutable,price_policy_v2_version_guard,price_policy_v2_window_guard,price_snapshot_v2_immutable', `exact v2 trigger inventory mismatch: ${triggers}`);
  console.log(`CLEAN_INIT_EXACT_INVENTORY exit=0 columns=16 tables=2 constraints=11 indexes=9 functions=3 triggers=4`);
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
  await createDatabase(overlapDb);
  const preflightIdentity = liveIdentity(freshDb, mappedPort);
  const upgradeIdentity = liveIdentity(upgradeDb, mappedPort);
  assert(preflightIdentity.name === freshDb && preflightIdentity.readOnly === false && preflightIdentity.recovery === false && preflightIdentity.externalSessions === 0, 'live preflight did not prove an isolated writable database');
  assert(upgradeIdentity.name === upgradeDb && upgradeIdentity.readOnly === false && upgradeIdentity.recovery === false && upgradeIdentity.externalSessions === 0, 'upgrade preflight did not prove an isolated writable database');
  const manifest = JSON.parse(await file('clean-init/seed-manifest.example.json'));
  const seedSql = await file('clean-init/seed.sql');
  const manifestDigest = sha256(JSON.stringify(manifest));
  const seedSqlDigest = sha256(canonicalSeedSql(seedSql));
  const report = await livePreflightReport(freshDb, preflightIdentity, manifestDigest, seedSqlDigest);
  assert(report.decision === 'PROCEED' && Object.values(report.verification).every(Boolean), `live preflight stopped: ${report.stopReasons.join('; ')}`);
  assert(report.database.oid === Number(preflightIdentity.oid) && report.database.clusterIdentifier === String(preflightIdentity.clusterIdentifier), 'live preflight report identity was not bound to the connection');
  console.log(`CLEAN_INIT_PREFLIGHT_LIVE exit=0 decision=${report.decision} database=${report.database.name} oid=${report.database.oid} cluster=${report.database.clusterIdentifier} externalSessions=${report.activeSessions.external} reportValidated=1`);
  const bindingFor = (identity, overrides = {}) => `BEGIN;\nCREATE TEMP TABLE review_v2_seed_binding (database_name text, database_oid oid, cluster_identifier text, manifest_digest text, seed_sql_digest text, project_id text, disposable boolean, policy_id uuid, unit_price numeric, risk_buffer_bps integer, source_policy_id uuid) ON COMMIT DROP;\nINSERT INTO review_v2_seed_binding VALUES (${quote(identity.name)}, ${Number(identity.oid)}, ${quote(String(identity.clusterIdentifier))}, ${quote(overrides.manifestDigest ?? manifestDigest)}, ${quote(overrides.seedSqlDigest ?? seedSqlDigest)}, 'JOYHO-33', true, ${quote(overrides.policyId ?? 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')}, ${overrides.unitPrice ?? '19.9900'}, ${overrides.riskBufferBps ?? 25}, ${quote(overrides.sourcePolicyId ?? 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')});\n`;
  const wrongBinding = bindingFor(upgradeIdentity, { unitPrice: '19.9800' });
  const mutationGuard = await sql(upgradeDb, wrongBinding + seedSql, { allowFailure: true });
  if (mutationGuard.status === 0 || scalar(upgradeDb, "SELECT count(*) FROM catalog.product;") !== '0') throw new Error('seed mutation-before-write guard did not fail closed');
  console.log(`CLEAN_INIT_SEED_MUTATION_GUARD status=${mutationGuard.status} rowsAfterFailure=0`);
  const seedMutationCases = [
    ['manifestDigest', { manifestDigest: '0'.repeat(64) }],
    ['seedSqlDigest', { seedSqlDigest: 'f'.repeat(64) }],
    ['policyId', { policyId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }],
    ['unitPrice', { unitPrice: '19.9800' }],
    ['riskBufferBps', { riskBufferBps: 26 }],
    ['sourcePolicyId', { sourcePolicyId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }],
  ];
  for (const [name, overrides] of seedMutationCases) {
    const result = await sql(upgradeDb, bindingFor(upgradeIdentity, overrides) + seedSql, { allowFailure: true });
    if (result.status === 0 || scalar(upgradeDb, "SELECT count(*) FROM catalog.product;") !== '0') throw new Error(`seed mutation guard accepted ${name}`);
  }
  console.log(`CLEAN_INIT_SEED_MUTATION_CASES exit=0 cases=${seedMutationCases.length} rowsAfterFailure=0`);
  await applyReviewMigration(overlapDb, '005-expand.sql');
  const overlapSeed = await sql(overlapDb, await file('clean-init/cross-currency-overlap.sql'));
  assertOutput(overlapSeed, 'COMMIT', 'cross-currency overlap fixture');
  const overlapInstall = await sql(overlapDb, await file('migrations/006-dual-version.sql'), { allowFailure: true });
  const overlapForward = await sql(overlapDb, await file('migrations/post-data-forward-fix.sql'), { allowFailure: true });
  const overlapPairs = scalar(overlapDb, "SELECT count(*)::text FROM catalog.price_policy a JOIN catalog.price_policy b ON b.organization_id = a.organization_id AND b.sku_id = a.sku_id AND b.id > a.id AND b.is_primary IS TRUE AND tstzrange(b.valid_from, COALESCE(b.valid_to, 'infinity'::timestamptz), '[)') && tstzrange(a.valid_from, COALESCE(a.valid_to, 'infinity'::timestamptz), '[)') WHERE a.is_primary IS TRUE AND a.currency <> b.currency;");
  if (overlapInstall.status === 0 || overlapForward.status === 0 || overlapPairs !== '1') throw new Error('existing cross-currency primary ambiguity did not fail closed');
  console.log(`REVIEW_EXISTING_CROSS_CURRENCY_PRIMARY apply006=${overlapInstall.status} forward_fix=${overlapForward.status} overlapping_pairs=${overlapPairs}`);
  const legacy = await sql(upgradeDb, await file('clean-init/legacy-null.sql'));
  assertOutput(legacy, 'COMMIT', 'legacy-null v1 write');
  await applyReviewMigration(upgradeDb, '005-expand.sql');
  await applyReviewMigration(upgradeDb, '006-dual-version.sql');
  await applyReviewMigration(upgradeDb, '005-expand.sql');
  await applyReviewMigration(upgradeDb, '006-dual-version.sql');
  const legacyEvidence = scalar(upgradeDb, "SELECT (SELECT count(*) FROM catalog.sku WHERE id = '16161616-1616-4161-8161-161616161616' AND standardization_mode IS NULL) || '|' || (SELECT count(*) FROM orders.order_item WHERE id = '20202020-2020-4202-8202-202020202020' AND v2_snapshot_version IS NULL);");
  if (legacyEvidence !== '1|1') throw new Error(`legacy-null facts were not preserved: ${legacyEvidence}`);
  console.log(`CLEAN_INIT_LEGACY_NULL exit=0 skuStandardizationNull=1 orderItemSnapshotNull=1 stateConflict=409/UNCLASSIFIED`);
  await applyReviewMigration(freshDb, '005-expand.sql');
  await applyReviewMigration(freshDb, '006-dual-version.sql');
  await applyReviewMigration(freshDb, '005-expand.sql');
  await applyReviewMigration(freshDb, '006-dual-version.sql');
  assertExactInventory(freshDb);
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
  const retained = scalar(freshDb, "SELECT (SELECT count(*) FROM orders.order_item WHERE id = '44444444-4444-4444-8444-444444444444' AND v2_snapshot_version = 1 AND price_snapshot_v2_id = '77777777-7777-4777-8777-777777777777' AND line_amount_v2 = 39.9800) || '|' || (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'catalog' AND c.relname = 'price_snapshot_v2');");
  assert(retained === '1|1', `seeded fact retention changed: ${retained}`);

  const cleanDown = await sql(upgradeDb, await file('migrations/pre-data-down.sql'));
  assertOutput(cleanDown, 'COMMIT', 'clean pre-data down');
  const repeatedDown = await sql(upgradeDb, await file('migrations/pre-data-down.sql'));
  assertOutput(repeatedDown, 'COMMIT', 'repeated clean down');
  const residualColumns = [
    ['catalog', 'sku', 'standardization_mode'], ['catalog', 'price_policy', 'is_primary'], ['catalog', 'price_policy', 'risk_buffer_bps'],
    ['orders', 'order_item', 'line_id'], ['orders', 'order_item', 'v2_snapshot_version'], ['orders', 'order_item', 'standardization_mode'],
    ['orders', 'order_item', 'order_currency_v2'], ['orders', 'order_item', 'source_price_currency'], ['orders', 'order_item', 'source_unit_price'],
    ['orders', 'order_item', 'effective_unit_price_v2'], ['orders', 'order_item', 'line_amount_v2'], ['orders', 'order_item', 'price_snapshot_v2_id'],
    ['orders', 'order_item', 'fx_snapshot_v2_id'], ['orders', 'order_item', 'price_source_kind'], ['orders', 'order_item', 'price_captured_at'], ['orders', 'order_item', 'image_file_id'],
  ];
  const residualConstraints = ['sku_v2_standardization_mode_ck', 'price_policy_v2_risk_buffer_ck', 'price_policy_v2_window_excl', 'price_snapshot_v2_shape_ck', 'order_item_v2_price_snapshot_fk', 'order_item_v2_fx_snapshot_fk', 'order_item_v2_image_file_fk', 'order_item_v2_kind_shape_ck', 'order_item_v2_price_shape_ck', 'order_item_v2_fx_shape_ck', 'order_item_v2_decimal_ck'];
  const residualIndexes = ['price_snapshot_v2_sku_idx', 'price_snapshot_v2_policy_idx', 'fx_snapshot_v2_pair_idx', 'order_item_v2_line_idx', 'order_item_v2_line_uq', 'order_item_v2_price_snapshot_idx', 'order_item_v2_fx_snapshot_idx', 'order_item_v2_image_idx', 'price_policy_v2_primary_open_uq'];
  const residualFunctions = ['enforce_v2_price_policy_version', 'enforce_v2_price_policy_window', 'prevent_v2_snapshot_mutation'];
  const residualTriggers = ['price_policy_v2_lifecycle_guard', 'price_policy_v2_window_guard', 'price_policy_v2_version_guard', 'price_snapshot_v2_immutable', 'fx_snapshot_v2_immutable'];
  const residual = scalar(upgradeDb, `SELECT (SELECT count(*) FROM information_schema.columns WHERE (table_schema, table_name, column_name) IN (${residualColumns.map((tuple) => '(' + tuple.map(quote).join(',') + ')').join(',')})) || '|' || (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE (n.nspname, c.relname) IN (('catalog','price_snapshot_v2'),('orders','fx_snapshot_v2'))) || '|' || (SELECT count(*) FROM pg_namespace WHERE nspname = 'migration_v2') || '|' || (SELECT count(*) FROM pg_constraint WHERE conname IN (${residualConstraints.map(quote).join(',')})) || '|' || (SELECT count(*) FROM pg_indexes WHERE indexname IN (${residualIndexes.map(quote).join(',')})) || '|' || (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'catalog' AND p.proname IN (${residualFunctions.map(quote).join(',')})) || '|' || (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid WHERE NOT t.tgisinternal AND t.tgname IN (${residualTriggers.map(quote).join(',')}));`);
  if (residual !== '0|0|0|0|0|0|0') throw new Error(`exact residual inventory mismatch: ${residual}`);
  const negativeAssertion = await sql(upgradeDb, await file('clean-init/assertion-negative.sql'), { allowFailure: true });
  if (negativeAssertion.status === 0) throw new Error('negative residual assertion unexpectedly passed');
  docker(['exec', container, 'dropdb', '-U', 'postgres', '--if-exists', freshDb]);
  docker(['exec', container, 'dropdb', '-U', 'postgres', '--if-exists', upgradeDb]);
  docker(['exec', container, 'dropdb', '-U', 'postgres', '--if-exists', overlapDb]);
  const cleanupQuery = docker(['exec', container, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres', '-Atc', `SELECT count(*) FROM pg_database WHERE datname LIKE 'be_imp_04_cleaninit_%'`]);
  assert(cleanupQuery.stdout.trim() === '0', `database cleanup query was not exactly zero: ${JSON.stringify(cleanupQuery.stdout)}`);

  console.log(`CLEAN_INIT_REHEARSAL exit=0 image=${image} container=${container} databases=${freshDb},${upgradeDb},${overlapDb} fresh=001-006+up/up+validate+seed+smoke+forward-fix+data-down-guard upgrade=001-004+005/006+up/up+validate+down/down overlap=006+forward-fix-fail-closed residual-check=0`);
} finally {
  if (started) {
    const removed = docker(['rm', '-f', container], { allowFailure: true });
    if (removed.status !== 0) console.error(`CLEAN_INIT_CLEANUP status=${removed.status} container=${container} output=${removed.stderr ?? removed.stdout ?? ''}`);
    else console.log(`CLEAN_INIT_CLEANUP exit=0 container=${container} removed=1 databases=${freshDb},${upgradeDb},${overlapDb}`);
  }
}

function quote(value) { return `'${String(value).replaceAll("'", "''")}'`; }
