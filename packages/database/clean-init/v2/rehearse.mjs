/* global URL, process, console */
import { createHash, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
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
const raceDb = `be_imp_04_cleaninit_${suffix}_race`;
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

function sqlAsync(db, text) {
  return new Promise((resolveResult) => {
    const child = spawn('docker', ['exec', '-i', container, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', db], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (status) => resolveResult({ status, stdout, stderr }));
    child.stdin.end(text);
  });
}

function scalar(db, query) {
  const result = docker(['exec', container, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', db, '-At', '-F', '|', '-c', query]);
  return (result.stdout ?? '').trim();
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalSeedSql(value) {
  return value.replaceAll('307782f92f7c5b05cd72cff57e2814e6ae94e452aa577d1e20304b36a1bd6841', '__SEED_SQL_CANONICAL_DIGEST__');
}

async function livePreflightReport(db, identity, manifestDigest, seedSqlDigest, ownedObjectManifest) {
  const migrationNames = ['001_foundation.sql', '002_identity_authorization.sql', '003_files.sql', '004_crm_catalog_orders.sql'];
  const migrationDigests = [];
  for (const name of migrationNames) migrationDigests.push({ name, sha256: sha256(await readFile(join(migrationRoot, name))) });
  const historyDigest = sha256(migrationDigests.map(({ name, sha256: digest }) => `${name}:${digest}`).join('\n'));
  const expandText = `${await readFile(join(reviewRoot, 'v2/migrations/005-expand.sql'))}\n${await readFile(join(reviewRoot, 'v2/migrations/006-dual-version.sql'))}`;
  const expandDigest = sha256(expandText);
  const approved = JSON.parse(await readFile(join(reviewRoot, 'v2/preflight-approved-digests.json')));
  const migrationDigestMatch = historyDigest === approved.migrationHistoryDigest
    && expandDigest === approved.expandDigest
    && JSON.stringify(migrationDigests) === JSON.stringify(approved.migrationDigests);
  const exactRevision = run('git', ['rev-parse', 'HEAD']).stdout.trim();
  const tables = [];
  for (const object of ownedObjectManifest.objects) {
    const qualified = `${object.schema}.${object.table}`;
    const exists = scalar(db, `SELECT to_regclass(${quote(qualified)}) IS NOT NULL`);
    const present = exists === 't';
    const rowCount = present ? Number(scalar(db, `SELECT count(*) FROM ${qualified}`)) : 0;
    const organizationIds = !present || object.organizationColumn === null
      ? []
      : JSON.parse(scalar(db, `SELECT COALESCE(json_agg(DISTINCT ${object.organizationColumn}::text ORDER BY ${object.organizationColumn}::text) FILTER (WHERE ${object.organizationColumn} IS NOT NULL), '[]'::json) FROM ${qualified}`));
    tables.push({ schema: object.schema, table: object.table, present, requiredAtPreflight: object.requiredAtPreflight, rowCount, organizationIds });
  }
  const organizationIds = [...new Set(tables.flatMap((table) => table.organizationIds))].sort();
  const inventoryComplete = tables.every((table) => table.present || table.requiredAtPreflight === false);
  const rowsEmpty = tables.every((table) => table.rowCount === 0 && table.organizationIds.length === 0) && organizationIds.length === 0;
  const ownerAndScopeClear = identity.readOnly === false && identity.recovery === false && identity.externalSessions === 0 && inventoryComplete && rowsEmpty;
  const seedDigestMatch = manifestDigest === approved.seedManifestDigest && seedSqlDigest === '307782f92f7c5b05cd72cff57e2814e6ae94e452aa577d1e20304b36a1bd6841';
  const verification = { migrationDigestMatch, seedDigestMatch, ownerAndScopeClear };
  const stopReasons = [];
  if (!migrationDigestMatch) stopReasons.push('migration history or expand digest mismatch');
  if (!seedDigestMatch) stopReasons.push('seed manifest or SQL digest mismatch');
  if (!inventoryComplete) stopReasons.push('required owned table is missing from live schema');
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
  const schema = JSON.parse(await readFile(join(reviewRoot, 'v2/preflight-report.schema.json')));
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
  const relative = name.startsWith('clean-init/') ? name.slice('clean-init/'.length) : name;
  return await readFile(join(reviewRoot, 'v2', relative), 'utf8');
}

async function applyMigration(db, name) {
  const text = await readFile(join(migrationRoot, name), 'utf8');
  return sql(db, text);
}

async function applyReviewMigration(db, name) {
  const text = await readFile(join(reviewRoot, 'v2/migrations', name), 'utf8');
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
  await createDatabase(raceDb);
  const preflightIdentity = liveIdentity(freshDb, mappedPort);
  const upgradeIdentity = liveIdentity(upgradeDb, mappedPort);
  assert(preflightIdentity.name === freshDb && preflightIdentity.readOnly === false && preflightIdentity.recovery === false && preflightIdentity.externalSessions === 0, 'live preflight did not prove an isolated writable database');
  assert(upgradeIdentity.name === upgradeDb && upgradeIdentity.readOnly === false && upgradeIdentity.recovery === false && upgradeIdentity.externalSessions === 0, 'upgrade preflight did not prove an isolated writable database');
  const manifest = JSON.parse(await file('clean-init/seed-manifest.example.json'));
  const ownedObjectManifest = JSON.parse(await file('clean-init/owned-object-manifest.json'));
  assert(ownedObjectManifest.version === 1 && ownedObjectManifest.projectId === 'JOYHO-33' && ownedObjectManifest.objects.length > 30, 'canonical owned-object manifest is incomplete');
  const seedSql = await file('clean-init/seed.sql');
  const manifestDigest = sha256(JSON.stringify(manifest));
  const seedSqlDigest = sha256(canonicalSeedSql(seedSql));
  const report = await livePreflightReport(freshDb, preflightIdentity, manifestDigest, seedSqlDigest, ownedObjectManifest);
  assert(report.decision === 'PROCEED' && Object.values(report.verification).every(Boolean), `live preflight stopped: ${report.stopReasons.join('; ')}`);
  assert(report.database.oid === Number(preflightIdentity.oid) && report.database.clusterIdentifier === String(preflightIdentity.clusterIdentifier), 'live preflight report identity was not bound to the connection');
  console.log(`CLEAN_INIT_PREFLIGHT_LIVE exit=0 decision=${report.decision} database=${report.database.name} oid=${report.database.oid} cluster=${report.database.clusterIdentifier} externalSessions=${report.activeSessions.external} reportValidated=1`);
  const ownedPreflightNegatives = [
    ['core.organization', `INSERT INTO core.organization (id, name) VALUES ('41414141-4141-4141-8141-414141414141', 'isolated core row');`, `DELETE FROM core.organization WHERE id = '41414141-4141-4141-8141-414141414141';`],
    ['catalog.product', `INSERT INTO org.organization (id, code, name, status, version) VALUES ('42424242-4242-4242-8242-424242424242', 'PREFLIGHT-PRODUCT-ORG', 'preflight product org', 'ACTIVE', 1); INSERT INTO catalog.product (id, organization_id, product_code, name, unit, status, metadata, version) VALUES ('43434343-4343-4343-8343-434343434343', '42424242-4242-4242-8242-424242424242', 'PREFLIGHT-PRODUCT', 'preflight product', 'piece', 'ACTIVE', '{}', 1);`, `DELETE FROM catalog.product WHERE id = '43434343-4343-4343-8343-434343434343'; DELETE FROM org.organization WHERE id = '42424242-4242-4242-8242-424242424242'; DELETE FROM core.organization WHERE id = '42424242-4242-4242-8242-424242424242';`],
    ['files.file_object', `INSERT INTO org.organization (id, code, name, status, version) VALUES ('44444444-4444-4444-8444-444444444444', 'PREFLIGHT-FILE-ORG', 'preflight file org', 'ACTIVE', 1); INSERT INTO iam.user_account (id, organization_id, provider, provider_subject, username_normalized, display_name, status, version, authz_version, session_epoch) VALUES ('45454545-4545-4545-8545-454545454545', '44444444-4444-4444-8444-444444444444', 'OIDC_SSO', 'preflight-file-user', 'preflight-file@example.invalid', 'preflight file user', 'ACTIVE', 1, 1, 1); INSERT INTO files.file_object (id, organization_id, created_by, object_key, original_name, declared_content_type, declared_size_bytes, status) VALUES ('46464646-4646-4646-8464-464646464646', '44444444-4444-4444-8444-444444444444', '45454545-4545-4545-8545-454545454545', 'preflight-file-object-key-0000000000000001', 'preflight.txt', 'text/plain', 1, 'PENDING_UPLOAD');`, `DELETE FROM files.file_object WHERE id = '46464646-4646-4646-8464-464646464646'; DELETE FROM iam.user_account WHERE id = '45454545-4545-4545-8545-454545454545'; DELETE FROM core.user_account WHERE id = '45454545-4545-4545-8545-454545454545'; DELETE FROM org.organization WHERE id = '44444444-4444-4444-8444-444444444444'; DELETE FROM core.organization WHERE id = '44444444-4444-4444-8444-444444444444';`],
    ['crm.customer', `INSERT INTO org.organization (id, code, name, status, version) VALUES ('47474747-4747-4747-8474-474747474747', 'PREFLIGHT-CRM-ORG', 'preflight CRM org', 'ACTIVE', 1); INSERT INTO org.business_group (id, organization_id, code, name, status, version) VALUES ('48484848-4848-4848-8484-484848484848', '47474747-4747-4747-8474-474747474747', 'PREFLIGHT-GROUP', 'preflight group', 'ACTIVE', 1); INSERT INTO iam.user_account (id, organization_id, provider, provider_subject, username_normalized, display_name, status, version, authz_version, session_epoch) VALUES ('49494949-4949-4949-8494-494949494949', '47474747-4747-4747-8474-474747474747', 'OIDC_SSO', 'preflight-crm-user', 'preflight-crm@example.invalid', 'preflight CRM user', 'ACTIVE', 1, 1, 1); INSERT INTO crm.customer (id, organization_id, name, owner_user_id, business_group_id, status, contacts, version) VALUES ('4a4a4a4a-4a4a-4a4a-8a4a-4a4a4a4a4a4a', '47474747-4747-4747-8474-474747474747', 'preflight customer', '49494949-4949-4949-8494-494949494949', '48484848-4848-4848-8484-484848484848', 'DRAFT', '[]', 1);`, `DELETE FROM crm.customer WHERE id = '4a4a4a4a-4a4a-4a4a-8a4a-4a4a4a4a4a4a'; DELETE FROM iam.user_account WHERE id = '49494949-4949-4949-8494-494949494949'; DELETE FROM core.user_account WHERE id = '49494949-4949-4949-8494-494949494949'; DELETE FROM org.business_group WHERE id = '48484848-4848-4848-8484-484848484848'; DELETE FROM org.organization WHERE id = '47474747-4747-4747-8474-474747474747'; DELETE FROM core.organization WHERE id = '47474747-4747-4747-8474-474747474747';`],
  ];
  for (const [label, insert, cleanup] of ownedPreflightNegatives) {
    const inserted = await sql(upgradeDb, `BEGIN;\n${insert}\nCOMMIT;`);
    assertOutput(inserted, 'COMMIT', `${label} preflight negative setup`);
    const negativeReport = await livePreflightReport(upgradeDb, upgradeIdentity, manifestDigest, seedSqlDigest, ownedObjectManifest);
    assert(negativeReport.decision === 'STOP' && negativeReport.ownedTables.some((table) => table.rowCount > 0), `${label} did not stop at live preflight`);
    const removed = await sql(upgradeDb, `BEGIN;\n${cleanup}\nCOMMIT;`);
    assertOutput(removed, 'COMMIT', `${label} preflight negative cleanup`);
  }
  console.log(`CLEAN_INIT_PREFLIGHT_OWNED_NEGATIVES exit=0 cases=${ownedPreflightNegatives.length} tables=core.organization|catalog.product|files.file_object|crm.customer decision=STOP`);
  const ownedObjectManifestDigest = sha256(JSON.stringify(ownedObjectManifest));
  const bindingFor = (identity, overrides = {}) => `BEGIN;\nCREATE TEMP TABLE review_v2_seed_binding (database_name text, database_oid oid, cluster_identifier text, manifest_digest text, seed_sql_digest text, owned_object_manifest_digest text, project_id text, disposable boolean, policy_id uuid, unit_price numeric, risk_buffer_bps integer, source_policy_id uuid) ON COMMIT DROP;\nCREATE TEMP TABLE review_v2_owned_object_manifest (schema_name text, table_name text, organization_column text) ON COMMIT DROP;\nINSERT INTO review_v2_owned_object_manifest VALUES ${ownedObjectManifest.objects.map((object) => `(${quote(object.schema)}, ${quote(object.table)}, ${object.organizationColumn === null ? 'NULL' : quote(object.organizationColumn)})`).join(', ')};\nINSERT INTO review_v2_seed_binding VALUES (${quote(identity.name)}, ${Number(identity.oid)}, ${quote(String(identity.clusterIdentifier))}, ${quote(overrides.manifestDigest ?? manifestDigest)}, ${quote(overrides.seedSqlDigest ?? seedSqlDigest)}, ${quote(overrides.ownedObjectManifestDigest ?? ownedObjectManifestDigest)}, 'JOYHO-33', true, ${quote(overrides.policyId ?? 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')}, ${overrides.unitPrice ?? '19.9900'}, ${overrides.riskBufferBps ?? 25}, ${quote(overrides.sourcePolicyId ?? 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')});\n`;
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
  await applyReviewMigration(raceDb, '005-expand.sql');
  const raceSetup = await sql(raceDb, `BEGIN;
INSERT INTO org.organization (id, code, name, status, version) VALUES ('31313131-3131-4131-8131-313131313131', 'SYN-RACE-ORG', 'Synthetic Race Organization', 'ACTIVE', 1);
INSERT INTO catalog.product (id, organization_id, product_code, name, unit, status, metadata, version) VALUES ('32323232-3232-4232-8232-323232323232', '31313131-3131-4131-8131-313131313131', 'SYN-RACE-PROD', 'Synthetic Race Product', 'piece', 'ACTIVE', '{}', 1);
INSERT INTO catalog.sku (id, organization_id, product_id, sku_code, name, unit, base_unit, tracking_mode, low_stock_threshold, price, status, metadata, version) VALUES ('33333333-3333-4333-8333-333333333333', '31313131-3131-4131-8131-313131313131', '32323232-3232-4232-8232-323232323232', 'SYN-RACE-SKU', 'Synthetic Race SKU', 'piece', 'piece', 'NONE', 0, 10.0000, 'ACTIVE', '{}', 1);
INSERT INTO catalog.price_policy (id, organization_id, sku_id, currency, unit_price, valid_from, valid_to, version, is_primary, risk_buffer_bps) VALUES ('34343434-3434-4434-8434-343434343434', '31313131-3131-4131-8131-313131313131', '33333333-3333-4333-8333-333333333333', 'USD', 10.0000, '2026-11-01T00:00:00Z', '2026-11-20T00:00:00Z', 1, true, 25);
COMMIT;`);
  assertOutput(raceSetup, 'COMMIT', 'race setup');
  const writerSql = `BEGIN;
INSERT INTO catalog.price_policy (id, organization_id, sku_id, currency, unit_price, valid_from, valid_to, version, is_primary, risk_buffer_bps) VALUES ('35353535-3535-4535-8535-353535353535', '31313131-3131-4131-8131-313131313131', '33333333-3333-4333-8333-333333333333', 'EUR', 11.0000, '2026-11-10T00:00:00Z', '2026-11-30T00:00:00Z', 1, true, 25);
SELECT pg_sleep(3);
ROLLBACK;`;
  const writerPromise = sqlAsync(raceDb, writerSql);
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
  const raceMigrationPromise = sqlAsync(raceDb, await file('migrations/006-dual-version.sql'));
  const [writerRace, migrationRace] = await Promise.all([writerPromise, raceMigrationPromise]);
  const racePairs = scalar(raceDb, "SELECT count(*)::text FROM catalog.price_policy a JOIN catalog.price_policy b ON b.organization_id = a.organization_id AND b.sku_id = a.sku_id AND b.id > a.id AND b.is_primary IS TRUE AND tstzrange(b.valid_from, COALESCE(b.valid_to, 'infinity'::timestamptz), '[)') && tstzrange(a.valid_from, COALESCE(a.valid_to, 'infinity'::timestamptz), '[)') WHERE a.is_primary IS TRUE AND a.currency <> b.currency;");
  if (writerRace.status !== 0 || migrationRace.status === 0 || racePairs !== '0') throw new Error(`policy lifecycle install race was not closed: writer=${writerRace.status} migration=${migrationRace.status} pairs=${racePairs}`);
  console.log(`REVIEW_POLICY_INSTALL_RACE writer=${writerRace.status} migration=${migrationRace.status} overlapping_pairs=${racePairs}`);
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
  docker(['exec', container, 'dropdb', '-U', 'postgres', '--if-exists', raceDb]);
  const cleanupQuery = docker(['exec', container, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres', '-Atc', `SELECT count(*) FROM pg_database WHERE datname LIKE 'be_imp_04_cleaninit_%'`]);
  assert(cleanupQuery.stdout.trim() === '0', `database cleanup query was not exactly zero: ${JSON.stringify(cleanupQuery.stdout)}`);

  console.log(`CLEAN_INIT_REHEARSAL exit=0 image=${image} container=${container} databases=${freshDb},${upgradeDb},${overlapDb},${raceDb} fresh=001-006+up/up+validate+seed+smoke+forward-fix+data-down-guard upgrade=001-004+005/006+up/up+validate+down/down overlap=006+forward-fix-fail-closed race=lock-timeout+rollback residual-check=0`);
} finally {
  if (started) {
    const removed = docker(['rm', '-f', container], { allowFailure: true });
    if (removed.status !== 0) console.error(`CLEAN_INIT_CLEANUP status=${removed.status} container=${container} output=${removed.stderr ?? removed.stdout ?? ''}`);
    else console.log(`CLEAN_INIT_CLEANUP exit=0 container=${container} removed=1 databases=${freshDb},${upgradeDb},${overlapDb},${raceDb}`);
  }
}

function quote(value) { return `'${String(value).replaceAll("'", "''")}'`; }
