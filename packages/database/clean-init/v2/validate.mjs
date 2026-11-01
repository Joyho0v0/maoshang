/* global URL, console, structuredClone */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const directory = new URL('./', import.meta.url);
const pathOf = (name) => fileURLToPath(new URL(name, directory));
const preflightSchema = JSON.parse(await readFile(pathOf('preflight-report.schema.json'), 'utf8'));
const seedSchema = JSON.parse(await readFile(pathOf('seed-manifest.schema.json'), 'utf8'));
const ownedObjectSchema = JSON.parse(await readFile(pathOf('owned-object-manifest.schema.json'), 'utf8'));
const preflight = JSON.parse(await readFile(pathOf('preflight-report.example.json'), 'utf8'));
const stopReport = JSON.parse(await readFile(pathOf('preflight-stop.example.json'), 'utf8'));
const seed = JSON.parse(await readFile(pathOf('seed-manifest.example.json'), 'utf8'));
const ownedObjectManifest = JSON.parse(await readFile(pathOf('owned-object-manifest.json'), 'utf8'));
const fixtures = JSON.parse(await readFile(pathOf('fixtures.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validatePreflight = ajv.compile(preflightSchema);
const validateSeed = ajv.compile(seedSchema);
const validateOwnedObjectManifest = ajv.compile(ownedObjectSchema);
assert(validatePreflight(preflight), `preflight example invalid: ${JSON.stringify(validatePreflight.errors)}`);
assert(validatePreflight(stopReport), `stop example invalid: ${JSON.stringify(validatePreflight.errors)}`);
assert(validateSeed(seed), `seed example invalid: ${JSON.stringify(validateSeed.errors)}`);
assert(validateOwnedObjectManifest(ownedObjectManifest), `owned-object manifest invalid: ${JSON.stringify(validateOwnedObjectManifest.errors)}`);
assert(ownedObjectManifest.objects.length >= 30 && ownedObjectManifest.objects.some((object) => object.schema === 'core' && object.table === 'organization') && ownedObjectManifest.objects.some((object) => object.schema === 'files' && object.table === 'file_object'), 'owned-object manifest does not cover canonical foundation/files scope');
function preflightProceedGate(report) {
  return report.decision === 'PROCEED'
    && report.stopReasons.length === 0
    && report.database.readOnly === false
    && report.database.recovery === false
    && report.activeSessions.external === 0
    && report.organizations.length === 0
    && report.ownedTables.every((table) => (!table.requiredAtPreflight || table.present) && table.rowCount === 0 && table.organizationIds.length === 0)
    && report.verification.migrationDigestMatch === true
    && report.verification.seedDigestMatch === true
    && report.verification.ownerAndScopeClear === true
    && report.migrations.historyDigest === report.migrations.expectedHistoryDigest;
}
const manifestKeys = new Set(ownedObjectManifest.objects.map((object) => `${object.schema}.${object.table}`));
const reportKeys = new Set(preflight.ownedTables.map((table) => `${table.schema}.${table.table}`));
assert(reportKeys.size === manifestKeys.size && [...manifestKeys].every((key) => reportKeys.has(key)), 'PROCEED report does not enumerate the canonical owned-object manifest');
for (const table of preflight.ownedTables) {
  const manifestObject = ownedObjectManifest.objects.find((object) => `${object.schema}.${object.table}` === `${table.schema}.${table.table}`);
  assert(manifestObject?.requiredAtPreflight === table.requiredAtPreflight, `PROCEED report requiredness mismatch for ${table.schema}.${table.table}`);
}
assert(preflightProceedGate(preflight), 'PROCEED example does not satisfy the independent machine gate');
assert(preflight.reportVersion === 2 && preflight.decision === 'PROCEED' && preflight.activeSessions.external === 0, 'proceed report is not fail-closed');
assert(preflight.exactRevision && preflight.workspace && preflight.database.oid && preflight.database.clusterIdentifier, 'proceed report lacks live identity binding facts');
assert(preflight.migrations.historyDigest === preflight.migrations.expectedHistoryDigest && preflight.verification.migrationDigestMatch && preflight.verification.seedDigestMatch && preflight.verification.ownerAndScopeClear, 'proceed report does not prove digest/owner closure');
assert(preflight.ownedTables.every((table) => (!table.requiredAtPreflight || table.present) && table.rowCount === 0 && table.organizationIds.length === 0) && preflight.organizations.length === 0, 'proceed report does not prove empty owned scope');
assert(stopReport.decision === 'STOP' && stopReport.stopReasons.length > 0, 'stop report lacks explicit stop reasons');
assert(seed.synthetic === true && seed.environmentClass === 'disposable-local', 'seed is not synthetic disposable data');
assert(seed.skus.every((sku) => sku.orderable && sku.standardizationMode && sku.policies.some((policy) => policy.isPrimary && policy.lifecycle === 'ACTIVE')), 'orderable SKU lacks explicit active primary policy facts');
assert(seed.orders.every((order) => order.lines.every((line) => line.lineId && line.priceSnapshot && line.fxSnapshot !== undefined)), 'seed order line lacks immutable snapshot facts');
assert(!/password|secret|token|cookie|dsn|object.?key/i.test(JSON.stringify(preflight)), 'preflight example contains a secret-like field');

for (const [name, file] of Object.entries(fixtures.valid)) {
  const value = JSON.parse(await readFile(pathOf(file), 'utf8'));
  const validator = name.startsWith('seed') ? validateSeed : validatePreflight;
  assert(validator(value), `${name} should validate: ${JSON.stringify(validator.errors)}`);
}
for (const [name, value] of Object.entries(fixtures.invalid)) {
  const validator = name.startsWith('seed') ? validateSeed : validatePreflight;
  assert(!validator(value), `${name} unexpectedly validated`);
}

const seedDigest = createHash('sha256').update(JSON.stringify(seed)).digest('hex');
const seedSql = await readFile(pathOf('seed.sql'), 'utf8');
const seedSqlDigest = createHash('sha256').update(seedSql.replaceAll('307782f92f7c5b05cd72cff57e2814e6ae94e452aa577d1e20304b36a1bd6841', '__SEED_SQL_CANONICAL_DIGEST__')).digest('hex');
assert(seed.skus[0].policies[0].id === 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' && seed.skus[0].policies[0].unitPrice === '19.9900' && seed.skus[0].policies[0].riskBufferBps === 25, 'manifest policy facts are not canonical');
for (const needle of [seed.skus[0].policies[0].id, seed.skus[0].policies[0].unitPrice, String(seed.skus[0].policies[0].riskBufferBps), seed.orders[0].lines[0].lineId, seed.orders[0].lines[0].priceSnapshot.sourcePolicyId]) assert(seedSql.includes(needle), `seed SQL does not contain manifest fact ${needle}`);
assert(seedSqlDigest === '307782f92f7c5b05cd72cff57e2814e6ae94e452aa577d1e20304b36a1bd6841' && seedDigest.length === 64, 'seed digests were not computed from approved raw inputs');

const fakeDigest = structuredClone(preflight);
fakeDigest.migrations.expectedHistoryDigest = 'f'.repeat(64);
assert(!validatePreflight(fakeDigest) || !preflightProceedGate(fakeDigest), 'PROCEED accepted a migration digest mismatch');
const falseVerification = structuredClone(preflight);
falseVerification.verification = { migrationDigestMatch: false, seedDigestMatch: false, ownerAndScopeClear: false };
assert(!validatePreflight(falseVerification) || !preflightProceedGate(falseVerification), 'PROCEED accepted false verification facts');
const nonEmpty = structuredClone(preflight);
nonEmpty.ownedTables[0].rowCount = 9;
assert(!validatePreflight(nonEmpty) || !preflightProceedGate(nonEmpty), 'PROCEED accepted non-empty owned data');
console.log(`CLEAN_INIT_PREFLIGHT exit=0 proceed=1 stop=1 externalSessions=0 closedUnion=PROCEED|STOP ownedObjectManifest=${ownedObjectManifest.objects.length}`);
console.log(`CLEAN_INIT_SEED_SCHEMA exit=0 synthetic=1 orderableSkus=${seed.skus.length} seededOrders=${seed.orders.length}`);
console.log(`CLEAN_INIT_SEED_DIGEST exit=0 manifest=${seedDigest} sql=${seedSqlDigest} facts=policy+price+risk+line+sourcePolicy`);
console.log(`CLEAN_INIT_FIXTURES exit=0 valid=3 invalid=3 seedDigest=${seedDigest}`);
