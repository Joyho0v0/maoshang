/* global URL, console */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const directory = new URL('./', import.meta.url);
const pathOf = (name) => fileURLToPath(new URL(name, directory));
const preflightSchema = JSON.parse(await readFile(pathOf('preflight-report.schema.json'), 'utf8'));
const seedSchema = JSON.parse(await readFile(pathOf('seed-manifest.schema.json'), 'utf8'));
const preflight = JSON.parse(await readFile(pathOf('preflight-report.example.json'), 'utf8'));
const stopReport = JSON.parse(await readFile(pathOf('preflight-stop.example.json'), 'utf8'));
const seed = JSON.parse(await readFile(pathOf('seed-manifest.example.json'), 'utf8'));
const fixtures = JSON.parse(await readFile(pathOf('fixtures.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validatePreflight = ajv.compile(preflightSchema);
const validateSeed = ajv.compile(seedSchema);
assert(validatePreflight(preflight), `preflight example invalid: ${JSON.stringify(validatePreflight.errors)}`);
assert(validatePreflight(stopReport), `stop example invalid: ${JSON.stringify(validatePreflight.errors)}`);
assert(validateSeed(seed), `seed example invalid: ${JSON.stringify(validateSeed.errors)}`);
assert(preflight.decision === 'PROCEED' && preflight.activeSessions.external === 0, 'proceed report is not fail-closed');
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
console.log(`CLEAN_INIT_PREFLIGHT exit=0 proceed=1 stop=1 externalSessions=0`);
console.log(`CLEAN_INIT_SEED_SCHEMA exit=0 synthetic=1 orderableSkus=${seed.skus.length} seededOrders=${seed.orders.length}`);
console.log(`CLEAN_INIT_FIXTURES exit=0 valid=3 invalid=3 seedDigest=${seedDigest}`);
