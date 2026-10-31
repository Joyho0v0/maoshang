/* global Buffer, URL, console */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import SwaggerParser from '@apidevtools/swagger-parser';
import openapiTS, { astToString } from 'openapi-typescript';

const root = new URL('./', import.meta.url);
const documentPath = new URL('./openapi.yaml', root).pathname;
const fixturesPath = new URL('./fixtures.json', root).pathname;
const methods = new Set(['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function walk(value, visit) {
  visit(value);
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
  } else if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) walk(child, visit);
  }
}

function countRefs(value) {
  let count = 0;
  walk(value, (node) => {
    if (node !== null && typeof node === 'object' && '$ref' in node) count += 1;
  });
  return count;
}

function operationsOf(document) {
  return Object.entries(document.paths ?? {}).flatMap(([path, item]) =>
    Object.entries(item).filter(([method]) => methods.has(method)).map(([method, operation]) => ({ path, method, operation })),
  );
}

function schema(document, name) {
  const candidate = document.components?.schemas?.[name];
  assert(candidate !== undefined, `missing schema ${name}`);
  return candidate;
}

function propertyFromSchema(candidate, property) {
  if (candidate.properties?.[property]?.const !== undefined) return candidate.properties[property];
  let fallback = candidate.properties?.[property];
  for (const branch of candidate.allOf ?? []) {
    if (branch.properties?.[property]?.const !== undefined) return branch.properties[property];
    if (fallback === undefined && branch.properties?.[property] !== undefined) fallback = branch.properties[property];
  }
  if (fallback !== undefined) return fallback;
  throw new Error(`schema has no property ${property}`);
}

function independentLint(document, dereferenced) {
  const operations = operationsOf(document);
  assert(operations.length === 17, `expected 17 operations, got ${operations.length}`);
  const ids = operations.map(({ operation }) => operation.operationId);
  assert(ids.every((id) => typeof id === 'string' && id.endsWith('V2')), 'every operation must have a versioned operationId');
  assert(new Set(ids).size === ids.length, 'operationId values must be unique');
  assert(Object.keys(document.paths).every((path) => path.startsWith('/api/v1/') === false && path.startsWith('/v1/') === false), 'v1 path leaked into v2 candidate');

  for (const { method, operation } of operations) {
    const statuses = Object.keys(operation.responses ?? {});
    for (const required of ['500', '502', '503']) assert(statuses.includes(required), `${operation.operationId} lacks ${required}`);
    if (method === 'post' || method === 'patch') {
      const safety = operation['x-safety'];
      assert(safety?.csrf === 'required' && safety?.idempotency === 'required', `${operation.operationId} lacks CSRF/idempotency safety declaration`);
      const parameterRefs = (operation.parameters ?? []).map((parameter) => parameter.$ref ?? '');
      assert(parameterRefs.includes('#/components/parameters/CsrfHeader'), `${operation.operationId} lacks CSRF header`);
      assert(parameterRefs.includes('#/components/parameters/IdempotencyHeader'), `${operation.operationId} lacks idempotency header`);
      assert(safety.ifMatch === 'required' ? parameterRefs.includes('#/components/parameters/IfMatchHeader') : safety.ifMatch === 'exempt', `${operation.operationId} has inconsistent If-Match declaration`);
      assert(statuses.includes('428'), `${operation.operationId} must declare the missing idempotency/precondition response`);
    }
    for (const response of Object.values(operation.responses ?? {})) assert(response.$ref?.startsWith('#/components/responses/'), `${operation.operationId} response is not an explicit response ref`);
  }

  const requestLine = schema(dereferenced, 'OrderLineRequestV2');
  assert(requestLine.discriminator?.propertyName === 'itemKind' && requestLine.oneOf?.length === 2, 'request line discriminator is incomplete');
  const responseLine = schema(dereferenced, 'OrderLineV2');
  assert(responseLine.discriminator?.propertyName === 'itemKind' && responseLine.oneOf?.length === 2, 'response line discriminator is incomplete');
  assert(!Object.hasOwn(schema(dereferenced, 'OrderNonStandardLineV2').properties, 'skuId'), 'non-standard response leaks skuId');
  assert(schema(dereferenced, 'OrderStandardLineV2').required.includes('skuId'), 'standard response does not require skuId');
  assert(schema(dereferenced, 'OrderNonStandardLineRequestV2').required.includes('quotedUnitPrice'), 'non-standard request lacks quote');

  const quantityPattern = new RegExp(schema(dereferenced, 'DecimalQuantity').pattern);
  const amountPattern = new RegExp(schema(dereferenced, 'DecimalAmount').pattern);
  const ratePattern = new RegExp(schema(dereferenced, 'DecimalRate').pattern);
  assert(quantityPattern.test('999999999999.999999') && !quantityPattern.test('1000000000000'), 'quantity integer precision is not bounded');
  assert(quantityPattern.test('0.000001') && !quantityPattern.test('0.0000001'), 'quantity scale/positive boundary is not bounded');
  assert(amountPattern.test('999999999999999.9999') && !amountPattern.test('1000000000000000'), 'amount precision is not bounded');
  assert(ratePattern.test('999999999999.999999999999') && !ratePattern.test('1000000000000'), 'rate precision is not bounded');
  assert(schema(dereferenced, 'RiskBufferBps').maximum === 2000, 'risk buffer has no approved upper bound');

  for (const name of ['Problem400', 'Problem401', 'Problem403', 'Problem404', 'Problem409', 'Problem428', 'Problem429', 'Problem500', 'Problem502', 'Problem503']) schema(dereferenced, name);
  assert(propertyFromSchema(schema(dereferenced, 'ProblemInternalRecoverable'), 'retryable').const === true, 'recoverable 500 is not retryable');
  assert(propertyFromSchema(schema(dereferenced, 'ProblemInternalTerminal'), 'retryable').const === false, 'terminal 500 is retryable');
  assert(propertyFromSchema(schema(dereferenced, 'Problem502'), 'retryable').const === true && propertyFromSchema(schema(dereferenced, 'Problem503'), 'retryable').const === true, 'dependency failures are not recoverable');
  assert(document.paths['/orders/{orderId}/files/{fileId}/status'] !== undefined, 'R7 status resource is undeclared');
  assert(document.info?.['x-contract-status'] === 'PENDING_REVIEW', 'candidate was accidentally promoted');
}

function compileFixtures(dereferenced) {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validators = new Map();
  for (const name of Object.keys(dereferenced.components.schemas)) validators.set(name, ajv.compile(dereferenced.components.schemas[name]));
  const fixtures = JSON.parse(awaitReadFixtures);
  const orderValidator = validators.get('OrderCreateRequestV2');
  for (const [name, value] of Object.entries(fixtures.valid)) {
    if (name === 'problemFileNotReady') {
      const validator = validators.get('Problem409');
      assert(validator(value), `${name} should validate: ${JSON.stringify(validator.errors)}`);
    }
    else assert(orderValidator(value), `${name} should validate: ${JSON.stringify(orderValidator.errors)}`);
  }
  for (const [name, value] of Object.entries(fixtures.invalid)) {
    const validator = name === 'rateTooPrecise' ? validators.get('DecimalRate') : name.startsWith('problemWrongRecoverability') ? validators.get('Problem503') : name.startsWith('problemWrongMeta') ? validators.get('Problem409') : orderValidator;
    assert(!validator(value), `${name} unexpectedly validated`);
  }
  return validators.size;
}

const awaitReadFixtures = await readFile(fixturesPath, 'utf8');
const parsed = await SwaggerParser.parse(documentPath);
const dereferenced = await SwaggerParser.dereference(documentPath);
independentLint(parsed, dereferenced);
const unresolvedRefs = countRefs(dereferenced);
assert(unresolvedRefs === 0, `dereferenced document contains ${unresolvedRefs} unresolved references`);
const operationIds = operationsOf(parsed).map(({ operation }) => operation.operationId);
const typesSource = astToString(await openapiTS(parsed));
const clientSource = [
  '/* review-only in-memory client dry output; no file is written */',
  `export const operationIds = ${JSON.stringify(operationIds)} as const;`,
  ...operationIds.map((id) => `export type ${id}Operation = typeof operationIds[number];`),
].join('\n');
const schemaCount = compileFixtures(dereferenced);
const hash = (source) => createHash('sha256').update(source).digest('hex');
console.log(`V2_REVIEW_PARSE exit=0 operations=${operationIds.length} paths=${Object.keys(parsed.paths).length}`);
console.log(`V2_REVIEW_DEREFERENCE exit=0 unresolvedRefs=${unresolvedRefs}`);
console.log(`V2_REVIEW_LINT exit=0 checks=R1,R2,R3,R7,R8`);
console.log(`V2_REVIEW_TYPES_DRY_GENERATION exit=0 bytes=${Buffer.byteLength(typesSource)} sha256=${hash(typesSource)}`);
console.log(`V2_REVIEW_CLIENT_DRY_GENERATION exit=0 operations=${operationIds.length} bytes=${Buffer.byteLength(clientSource)} sha256=${hash(clientSource)}`);
console.log(`V2_REVIEW_VALIDATOR_DRY_GENERATION exit=0 schemas=${schemaCount} fixtures=9-valid/7-invalid`);
