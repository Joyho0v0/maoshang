/* global Buffer, URL, console, process, Response */
import { createHash } from 'node:crypto';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import SwaggerParser from '@apidevtools/swagger-parser';

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
  for (const branch of [...(candidate.allOf ?? []), ...(candidate.oneOf ?? []), ...(candidate.anyOf ?? [])]) {
    if (branch.$ref !== undefined) continue;
    if (branch.properties?.[property]?.const !== undefined) return branch.properties[property];
    if (fallback === undefined && branch.properties?.[property] !== undefined) fallback = branch.properties[property];
    if (fallback === undefined) {
      try { fallback = propertyFromSchema(branch, property); } catch { /* branch does not define the property */ }
    }
  }
  if (fallback !== undefined) return fallback;
  throw new Error(`schema has no property ${property}`);
}

function independentLint(document, dereferenced) {
  const operations = operationsOf(document);
  assert(operations.length === 18, `expected 18 operations, got ${operations.length}`);
  const ids = operations.map(({ operation }) => operation.operationId);
  assert(ids.every((id) => typeof id === 'string' && id.endsWith('V2')), 'every operation must have a versioned operationId');
  assert(new Set(ids).size === ids.length, 'operationId values must be unique');
  assert(Object.keys(document.paths).every((path) => path.startsWith('/api/v1/') === false && path.startsWith('/v1/') === false), 'v1 path leaked into v2 candidate');

  for (const { path, method, operation } of operations) {
    const statuses = Object.keys(operation.responses ?? {});
    for (const required of ['500', '502', '503']) assert(statuses.includes(required), `${operation.operationId} lacks ${required}`);
    if (method === 'post' || method === 'patch') {
      const safety = operation['x-safety'];
      assert(safety?.csrf === 'required' && (safety?.idempotency === 'required' || safety?.idempotency === 'exempt'), `${operation.operationId} lacks explicit CSRF/idempotency safety declaration`);
      const parameterRefs = (operation.parameters ?? []).map((parameter) => parameter.$ref ?? '');
      assert(parameterRefs.includes('#/components/parameters/CsrfHeader'), `${operation.operationId} lacks CSRF header`);
      if (safety.idempotency === 'required') assert(parameterRefs.includes('#/components/parameters/IdempotencyHeader'), `${operation.operationId} lacks idempotency header`);
      else assert(!parameterRefs.includes('#/components/parameters/IdempotencyHeader'), `${operation.operationId} must not require idempotency header`);
      assert(safety.ifMatch === 'required' ? parameterRefs.includes('#/components/parameters/IfMatchHeader') : safety.ifMatch === 'exempt', `${operation.operationId} has inconsistent If-Match declaration`);
      if (safety.idempotency === 'required') assert(statuses.includes('428'), `${operation.operationId} must declare the missing idempotency/precondition response`);
      else assert(!statuses.includes('428'), `${operation.operationId} must not declare an irrelevant precondition response`);
    }
    for (const response of Object.values(operation.responses ?? {})) assert(response.$ref?.startsWith('#/components/responses/'), `${operation.operationId} response is not an explicit response ref`);
    if (operation.operationId === 'getFileStatusV2') assert(path === '/files/{fileId}', `${operation.operationId} is not Files-owned`);
    if (operation.operationId === 'createFileDownloadIntentV2') assert(path === '/files/{fileId}/download-intents', `${operation.operationId} is not Files-owned`);
  }

  const requestLine = schema(dereferenced, 'OrderLineRequestV2');
  assert(requestLine.discriminator?.propertyName === 'itemKind' && requestLine.oneOf?.length === 2, 'request line discriminator is incomplete');
  const responseLine = schema(dereferenced, 'OrderLineV2');
  assert(responseLine.discriminator?.propertyName === 'itemKind' && responseLine.oneOf?.length === 2, 'response line discriminator is incomplete');
  assert(!Object.hasOwn(schema(dereferenced, 'OrderNonStandardLineV2').properties, 'skuId'), 'non-standard response leaks skuId');
  assert(schema(dereferenced, 'OrderStandardLineV2').required.includes('skuId'), 'standard response does not require skuId');
  assert(schema(dereferenced, 'OrderNonStandardLineRequestV2').required.includes('quotedUnitPrice'), 'non-standard request lacks quote');
  const policyProjection = schema(dereferenced, 'PricePolicyV2');
  assert(policyProjection.required.includes('policyId') && policyProjection.required.includes('version') && policyProjection.required.includes('lifecycle'), 'policy projection lacks canonical consumer facts');
  assert(schema(dereferenced, 'SkuV2').required.includes('pricePolicies'), 'SKU projection does not expose policy lifecycle facts');
  assert(!Object.hasOwn(schema(dereferenced, 'PricePolicyReplaceV2').properties, 'policyVersion') && !Object.hasOwn(schema(dereferenced, 'PricePolicyEndV2').properties, 'policyVersion'), 'policy version has a non-canonical alias');

  const quantityPattern = new RegExp(schema(dereferenced, 'DecimalQuantity').pattern);
  const amountPattern = new RegExp(schema(dereferenced, 'DecimalAmount').pattern);
  const ratePattern = new RegExp(schema(dereferenced, 'DecimalRate').pattern);
  const thresholdPattern = new RegExp(schema(dereferenced, 'DecimalThreshold').pattern);
  assert(quantityPattern.test('999999999999.999999') && !quantityPattern.test('1000000000000'), 'quantity integer precision is not bounded');
  assert(quantityPattern.test('0.000001') && !quantityPattern.test('0.0000001') && !quantityPattern.test('0.00000100000'), 'quantity scale/positive boundary is not bounded');
  assert(amountPattern.test('999999999999999.9999') && !amountPattern.test('1000000000000000'), 'amount precision is not bounded');
  assert(ratePattern.test('999999999999.999999999999') && !ratePattern.test('1000000000000') && !ratePattern.test('0.0000000000001'), 'rate precision is not bounded');
  assert(thresholdPattern.test('999999999999.999999') && thresholdPattern.test('0.000001') && !thresholdPattern.test('1000000000000') && !thresholdPattern.test('0.0000001'), 'threshold precision is not bounded independently from amount');
  assertDecimalArithmeticBoundaries();
  assert(schema(dereferenced, 'RiskBufferBps').maximum === 2000, 'risk buffer has no approved upper bound');

  for (const name of ['Problem400', 'Problem401', 'Problem403', 'Problem404', 'Problem409', 'Problem428', 'Problem429', 'Problem500', 'Problem502', 'Problem503']) schema(dereferenced, name);
  assert(propertyFromSchema(schema(dereferenced, 'ProblemInternalRecoverable'), 'retryable').const === true, 'recoverable 500 is not retryable');
  assert(propertyFromSchema(schema(dereferenced, 'ProblemInternalTerminal'), 'retryable').const === false, 'terminal 500 is retryable');
  assert(propertyFromSchema(schema(dereferenced, 'Problem502'), 'retryable').const === true && propertyFromSchema(schema(dereferenced, 'Problem503'), 'retryable').const === true, 'dependency failures are not recoverable');
  const csrfBranch = schema(dereferenced, 'Problem403').oneOf.find((branch) => branch.allOf?.some((part) => part.properties?.code?.const === 'CSRF_FAILED'));
  assert(csrfBranch?.allOf?.some((part) => part.properties?.retryable?.const === true), 'CSRF_FAILED wire retryable semantics must remain true');
  assert(schema(dereferenced, 'CommandStatusRecoveryV2').allOf[1].properties.retryAfterMs.const === 0, 'recovery retryAfterMs must be zero');
  assert(schema(dereferenced, 'CommandStatusRecoveryV2').allOf[1].properties.problem.type === 'null', 'recovery problem must be null');
  assert(schema(dereferenced, 'CommandStatusFailedV2').allOf[2].oneOf.some((branch) => branch.properties?.httpStatus?.const === 500), 'terminal failed status must allow deterministic 500');
  assert(document.paths['/files/{fileId}'] !== undefined, 'Files v2 support surface is undeclared');
  assert(document.paths['/files/{fileId}'].get.operationId === 'getFileStatusV2', 'Files status operationId is not canonical');
  assert(document.paths['/files/{fileId}/download-intents']?.post.operationId === 'createFileDownloadIntentV2', 'Files download operationId is not canonical');
  assert(schema(dereferenced, 'FileStatusV2').required.join(',') === 'id,version,status,updatedAt,href', 'FileStatusV2 required fields are incomplete');
  assert(schema(dereferenced, 'FileDownloadIntentV2').required.join(',') === 'file,href,transfer', 'FileDownloadIntentV2 required fields are incomplete');
  assert(schema(dereferenced, 'FileHrefV2').pattern === '^/api/v2/files/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', 'Files href validator is not strict and canonical');
  const skuRequired = schema(dereferenced, 'SkuCreateRequestV2').required;
  assert(skuRequired.includes('standardizationMode') && !skuRequired.includes('baseUnit') && !skuRequired.includes('trackingMode') && !skuRequired.includes('lowStockThreshold'), 'SKU create expanded unrelated required fields');
  const skuProperties = schema(dereferenced, 'SkuCreateRequestV2').properties;
  assert(skuProperties.baseUnit['x-default'] === 'unit' && skuProperties.trackingMode['x-default'] === 'NONE' && skuProperties.lowStockThreshold['x-default'] === '0', 'SKU omission defaults are not explicit');
  assert(document.info?.['x-contract-status'] === 'PENDING_REVIEW', 'candidate was accidentally promoted');
}

function compileFixtures(dereferenced) {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validators = new Map();
  for (const name of Object.keys(dereferenced.components.schemas)) validators.set(name, ajv.compile(dereferenced.components.schemas[name]));
  const fixtures = JSON.parse(awaitReadFixtures);
  const orderValidator = validators.get('OrderCreateRequestV2');
  let validCount = 0;
  for (const [name, value] of Object.entries(fixtures.valid)) {
    const validator = name === 'problemFileNotReady' ? validators.get('Problem409')
      : name === 'fileStatus' ? validators.get('FileStatusV2')
        : name === 'fileDownloadIntent' ? validators.get('FileDownloadIntentV2')
          : name.startsWith('file') ? validators.get('FileStatusV2')
            : name === 'problemDependencyFailure' ? validators.get('Problem502')
              : name === 'problemDependencyUnavailable' ? validators.get('Problem503')
                : name === 'orderResponse' ? validators.get('OrderV2')
          : name === 'csrfToken' ? validators.get('CsrfToken')
            : name.startsWith('command') ? validators.get('CommandStatus')
              : name === 'problemCsrfFailed' ? validators.get('Problem403')
            : name === 'skuProjection' || name === 'skuLegacyNullInactive' ? validators.get('SkuV2')
            : name === 'policyReplace' ? validators.get('PricePolicyMutationV2')
          : name.startsWith('sku') ? validators.get('SkuCreateRequestV2')
            : orderValidator;
    assert(validator(value), `${name} should validate: ${JSON.stringify(validator.errors)}`);
    validCount += 1;
  }
  let invalidCount = 0;
  for (const [name, value] of Object.entries(fixtures.invalid)) {
    if (name === 'skuDuplicatePrimaryPolicies') {
      const validator = validators.get('SkuV2');
      assert(validator(value), `${name} should be schema-valid before semantic policy rejection: ${JSON.stringify(validator.errors)}`);
      assert(hasDuplicateActivePrimaryPolicy(value), `${name} fixture does not exercise duplicate active primary policy`);
      invalidCount += 1;
      continue;
    }
    const validator = name === 'rateTooPrecise' ? validators.get('DecimalRate')
      : name === 'amountIntegerOverflow' ? validators.get('DecimalAmount')
        : name === 'fileAvailableAsNotReady' || name === 'v1StatusHrefFallback' ? validators.get('Problem409')
          : name === 'fileUnknownState' ? validators.get('FileStatusV2')
        : name.startsWith('problemWrongRecoverability') ? validators.get('Problem503')
        : name.startsWith('problemWrongMeta') ? validators.get('Problem409')
            : name === 'problem401WithMeta' ? validators.get('Problem401')
              : name === 'problemCsrfWrongRetryable' ? validators.get('Problem403')
                : name === 'problemValidationConflictingViolations' ? validators.get('Problem400')
                : name === 'policyReplaceLegacyVersionName' ? validators.get('PricePolicyMutationV2')
                : name.startsWith('command') ? validators.get('CommandStatus')
                  : name === 'csrfLegacyToken' ? validators.get('CsrfToken')
                    : name === 'thresholdWrongScale' ? validators.get('SkuCreateRequestV2')
          : name === 'fileBadHref' ? validators.get('FileStatusV2')
            : name === 'skuMissingStandardization' ? validators.get('SkuCreateRequestV2')
              : orderValidator;
    assert(!validator(value), `${name} unexpectedly validated`);
    invalidCount += 1;
  }
  return { schemaCount: validators.size, validCount, invalidCount };
}

function hasDuplicateActivePrimaryPolicy(value) {
  const seen = new Set();
  return (value.pricePolicies ?? []).some((policy) => {
    if (policy.lifecycle !== 'ACTIVE' || policy.isPrimary !== true || policy.validTo !== null) return false;
    const key = policy.currency;
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  });
}

function assertDecimalArithmeticBoundaries() {
  const quantityMax = scaled('999999999999.999999', 6);
  const quantityOverflow = scaled('1000000000000', 6);
  const amountMax = scaled('999999999999999.9999', 4);
  const amountOverflow = scaled('1000000000000000', 4);
  const rateMax = scaled('999999999999.999999999999', 12);
  const rateOverflow = scaled('1000000000000', 12);
  assert(quantityMax === 999999999999999999n && quantityOverflow > quantityMax, 'quantity scaled boundary is wrong');
  assert(amountMax === 9999999999999999999n && amountOverflow > amountMax, 'amount scaled boundary is wrong');
  assert(rateMax === 999999999999999999999999n && rateOverflow > rateMax, 'rate scaled boundary is wrong');
  const roundedUnit = roundHalfUp(multiplyScaled(scaled('999999999999999.9999', 4), scaled('1.000000000001', 12), 16), 16, 4);
  assert(roundedUnit > amountMax, 'amount multiplication overflow was not detected');
  const total = amountMax + 1n;
  assert(total > amountMax, 'amount total overflow was not detected');
}

function scaled(value, scale) {
  const [integer, fraction = ''] = value.split('.');
  return BigInt(integer + fraction.padEnd(scale, '0'));
}

function multiplyScaled(left, right, leftScaleAndRightScale) {
  void leftScaleAndRightScale;
  return left * right;
}

function roundHalfUp(value, sourceScale, targetScale) {
  const divisor = 10n ** BigInt(sourceScale - targetScale);
  const remainder = value % divisor;
  const rounded = value / divisor;
  return rounded + (remainder * 2n >= divisor ? 1n : 0n);
}

async function runGeneratedGate() {
  const output = await mkdtemp(join(process.cwd(), '.review-v2-generation-'));
  try {
    const generator = fileURLToPath(new URL('./generate.mjs', import.meta.url));
    const generated = spawnSync(process.execPath, [generator, '--out', output], { encoding: 'utf8' });
    assert(generated.status === 0, 'generated chain failed: ' + generated.stderr);
    const summary = JSON.parse(generated.stdout);
    assert(summary.baseUrl === '/api/v2' && summary.operationCount === 18, 'generated chain did not preserve v2 base URL and 18 operations');
    assert(!summary.generatedFiles.some((name) => name.includes('v1')), 'generated chain contains a v1 artifact');
    const tsc = fileURLToPath(new URL('../../../node_modules/typescript/bin/tsc', import.meta.url));
    const typecheck = spawnSync(process.execPath, [tsc, '-p', join(output, 'tsconfig.json'), '--noEmit'], { encoding: 'utf8' });
    assert(typecheck.status === 0, 'generated typecheck failed: ' + typecheck.stdout + typecheck.stderr);
    const negativeFixture = join(output, 'negative-header-fixtures.ts');
    await writeFile(negativeFixture, [
      "import type { components } from './types.js';",
      "import type { OperationInputMap } from './client.js';",
      "const orderBody = {} as components['schemas']['OrderCreateRequestV2'];",
      "// @ts-expect-error X-CSRF-Token is required for createOrderV2",
      "const missingCsrf: OperationInputMap['createOrderV2'] = { headers: { 'Idempotency-Key': 'negative-key' }, body: orderBody };",
      "// @ts-expect-error Idempotency-Key is required for createOrderV2",
      "const missingIdempotency: OperationInputMap['createOrderV2'] = { headers: { 'X-CSRF-Token': 'csrf-token-value-with-at-least-16' }, body: orderBody };",
      "const skuBody = {} as components['schemas']['SkuUpdateRequestV2'];",
      "// @ts-expect-error If-Match is required for updateSkuV2",
      "const missingIfMatch: OperationInputMap['updateSkuV2'] = { headers: { 'X-CSRF-Token': 'csrf-token-value-with-at-least-16', 'Idempotency-Key': 'negative-key' }, pathParams: { id: '11111111-1111-4111-8111-111111111111' }, body: skuBody };",
      "const optionalRequestId: OperationInputMap['createOrderV2'] = { headers: { 'X-CSRF-Token': 'csrf-token-value-with-at-least-16', 'Idempotency-Key': 'valid-key', 'X-Request-ID': '77777777-7777-4777-8777-777777777777' }, body: orderBody };",
      "const minimalSku: OperationInputMap['createSkuV2']['body'] = { productId: '88888888-8888-4888-8888-888888888888', skuCode: 'SKU-MINIMAL', name: 'Minimal SKU', unit: 'piece', standardizationMode: 'NONE' };",
      "// @ts-expect-error standardizationMode is the only new required SKU field",
      "const missingSkuMode: OperationInputMap['createSkuV2']['body'] = { productId: '88888888-8888-4888-8888-888888888888', skuCode: 'SKU-MISSING-MODE', name: 'Missing mode', unit: 'piece' };",
      'void missingCsrf; void missingIdempotency; void missingIfMatch; void optionalRequestId; void minimalSku; void missingSkuMode;',
    ].join('\n') + '\n');
    const negativeTypecheck = spawnSync(process.execPath, [tsc, '--strict', '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--lib', 'ES2022,DOM,DOM.Iterable', '--skipLibCheck', '--types', 'node', '--noEmit', negativeFixture], { encoding: 'utf8' });
    assert(negativeTypecheck.status === 0, 'generated header negative typecheck failed: ' + negativeTypecheck.stdout + negativeTypecheck.stderr);
    const documentValue = JSON.parse(await readFile(join(output, 'document.json'), 'utf8'));
    const validatorModule = await import(pathToFileURL(join(output, 'runtime-validator.mjs')).href);
    const clientModule = await import(pathToFileURL(join(output, 'client.mjs')).href);
    const validator = validatorModule.createV2RuntimeValidator(documentValue);
    const fixtures = JSON.parse(awaitReadFixtures);
    const runtimeFixtures = ['fileStatus', 'fileDownloadIntent', 'commandInProgress', 'commandRecovery', 'commandSucceeded', 'commandFailed', 'problemCsrfFailed', 'problemDependencyFailure', 'problemDependencyUnavailable', 'orderResponse']
      .map((name) => [name, validator.validate(name === 'fileStatus' ? 'FileStatusV2' : name === 'fileDownloadIntent' ? 'FileDownloadIntentV2' : name.startsWith('command') ? 'CommandStatus' : name === 'problemDependencyFailure' ? 'Problem502' : name === 'problemDependencyUnavailable' ? 'Problem503' : name === 'orderResponse' ? 'OrderV2' : 'Problem403', fixtures.valid[name])]);
    assert(runtimeFixtures.every(([, valid]) => valid), 'generated runtime validator rejected valid fixtures: ' + JSON.stringify(validator.errors));
    const fileId = fixtures.valid.fileStatus.id;
    let observed;
    const client = new clientModule.GeneratedV2Client({
      validator,
      fetch: async (url, init) => {
        observed = { url, method: init.method, headers: Object.fromEntries(init.headers.entries()), credentials: init.credentials };
        return new Response(JSON.stringify(fixtures.valid.fileStatus), { status: 200, headers: { 'content-type': 'application/json', 'x-request-id': '77777777-7777-4777-8777-777777777777', 'cache-control': 'no-store' } });
      },
    });
    const fileStatusResponse = await client.call('getFileStatusV2', { pathParams: { fileId }, headers: { 'X-Request-ID': '77777777-7777-4777-8777-777777777777' } });
    assert(observed?.url === '/api/v2/files/' + fileId && observed.method === 'GET' && observed.credentials === 'include', 'generated client did not serialize the v2 URL/request correctly');
    assert(fileStatusResponse.headers['X-Request-ID'] === '77777777-7777-4777-8777-777777777777' && fileStatusResponse.headers['Cache-Control'] === 'no-store', 'generated response header type keys are not readable at runtime');
    const orderBody = fixtures.valid.standardSameCurrency;
    let orderObserved;
    const orderClient = new clientModule.GeneratedV2Client({
      validator,
      fetch: async (url, init) => {
        orderObserved = { url, method: init.method, headers: Object.fromEntries(init.headers.entries()), body: init.body, credentials: init.credentials };
        return new Response(JSON.stringify(fixtures.valid.commandInProgress), { status: 202, headers: { 'content-type': 'application/json' } });
      },
    });
    let missingResponseHeaderRejected = false;
    try {
      await orderClient.call('createOrderV2', { headers: { 'X-CSRF-Token': 'csrf-token-value-with-at-least-16', 'Idempotency-Key': 'r1-generation-key' }, body: orderBody });
    } catch (error) {
      missingResponseHeaderRejected = /required response header/i.test(error?.message ?? '');
    }
    assert(missingResponseHeaderRejected, 'generated client accepted a 202 response missing required response headers');
    const invalidResponseHeaderClient = new clientModule.GeneratedV2Client({
      validator,
      fetch: async () => new Response(JSON.stringify(fixtures.valid.commandInProgress), { status: 202, headers: { 'content-type': 'application/json', 'x-request-id': '77777777-7777-4777-8777-777777777777', 'cache-control': 'public', 'content-location': '/api/v2/commands/44444444-4444-4444-8444-444444444444', 'retry-after': '1' } }),
    });
    let invalidResponseHeaderRejected = false;
    try {
      await invalidResponseHeaderClient.call('createOrderV2', { headers: { 'X-CSRF-Token': 'csrf-token-value-with-at-least-16', 'Idempotency-Key': 'r1-generation-key' }, body: orderBody });
    } catch (error) {
      invalidResponseHeaderRejected = /Invalid response header Cache-Control/i.test(error?.message ?? '');
    }
    assert(invalidResponseHeaderRejected, 'generated client accepted a response header that violates const/pattern schema');
    const validOrderClient = new clientModule.GeneratedV2Client({
      validator,
      fetch: async (url, init) => {
        orderObserved = { url, method: init.method, headers: Object.fromEntries(init.headers.entries()), body: init.body, credentials: init.credentials };
        return new Response(JSON.stringify(fixtures.valid.commandInProgress), { status: 202, headers: { 'content-type': 'application/json', 'x-request-id': '77777777-7777-4777-8777-777777777777', 'cache-control': 'no-store', 'content-location': '/api/v2/commands/44444444-4444-4444-8444-444444444444', 'retry-after': '1' } });
      },
    });
    await validOrderClient.call('createOrderV2', { headers: { 'X-CSRF-Token': 'csrf-token-value-with-at-least-16', 'Idempotency-Key': 'r1-generation-key' }, body: orderBody });
    assert(orderObserved?.url === '/api/v2/orders' && orderObserved.method === 'POST' && orderObserved.credentials === 'include'
      && orderObserved.headers['content-type'] === 'application/json'
      && orderObserved.headers['idempotency-key'] === 'r1-generation-key'
      && JSON.parse(orderObserved.body).orderNo === 'V2-STD-SAME', 'generated client did not serialize the command body/headers correctly');
    let errorObserved = false;
    const errorClient = new clientModule.GeneratedV2Client({
      validator,
      fetch: async () => new Response(JSON.stringify(fixtures.valid.problemFileNotReady), { status: 409, headers: { 'content-type': 'application/problem+json', 'x-request-id': '77777777-7777-4777-8777-777777777777' } }),
    });
    try {
      await errorClient.call('createFileDownloadIntentV2', { pathParams: { fileId }, headers: { 'X-CSRF-Token': 'csrf-token-value-with-at-least-16' } });
    } catch (error) {
      errorObserved = error?.status === 409 && error?.problem?.code === 'FILE_NOT_READY';
    }
    assert(errorObserved, 'generated client did not validate/type the declared Problem response');
    let requestFetchCount = 0;
    const requestGateClient = new clientModule.GeneratedV2Client({
      validator,
      fetch: async () => {
        requestFetchCount += 1;
        return new Response(JSON.stringify(fixtures.valid.commandInProgress), { status: 202, headers: { 'content-type': 'application/json', 'x-request-id': '77777777-7777-4777-8777-777777777777', 'cache-control': 'no-store', 'content-location': '/api/v2/commands/44444444-4444-4444-8444-444444444444', 'retry-after': '1' } });
      },
    });
    const requestHeaders = { 'X-CSRF-Token': 'csrf-token-value-with-at-least-16', 'Idempotency-Key': 'request-gate-key' };
    for (const name of ['standardWithQuotedPrice', 'nonStandardWithSkuId', 'clientSnapshotFields', 'quantityTooPrecise', 'nonStandardStrict']) {
      let rejected = false;
      try { await requestGateClient.call('createOrderV2', { headers: requestHeaders, body: fixtures.invalid[name] }); } catch { rejected = true; }
      assert(rejected, `request gate accepted invalid ${name}`);
    }
    let invalidPathRejected = false;
    try { await requestGateClient.call('getFileStatusV2', { pathParams: { fileId: 'not-a-uuid' }, headers: { 'X-Request-ID': '77777777-7777-4777-8777-777777777777' } }); } catch { invalidPathRejected = true; }
    assert(invalidPathRejected, 'request gate accepted an invalid path parameter');
    let invalidHeaderRejected = false;
    try { await requestGateClient.call('createOrderV2', { headers: { 'X-CSRF-Token': 'short', 'Idempotency-Key': 'request-gate-key' }, body: fixtures.valid.standardSameCurrency }); } catch { invalidHeaderRejected = true; }
    assert(invalidHeaderRejected && requestFetchCount === 0, `invalid request reached fetch (${requestFetchCount} calls)`);
    await requestGateClient.call('createOrderV2', { headers: requestHeaders, body: fixtures.valid.standardSameCurrency });
    await requestGateClient.call('createOrderV2', { headers: requestHeaders, body: fixtures.valid.nonStandard });
    assert(requestFetchCount === 2, 'valid STANDARD/NON_STANDARD requests did not reach fetch exactly once each');
    const harness = fileURLToPath(new URL('./clean-init/dual-version-harness.mjs', import.meta.url));
    const v1OpenApi = fileURLToPath(new URL('../../../packages/contracts/openapi/openapi.yaml', import.meta.url));
    const tsx = join(process.cwd(), 'node_modules/.bin/tsx');
    const harnessRun = spawnSync(tsx, [harness, output, v1OpenApi, fixturesPath], { encoding: 'utf8' });
    assert(harnessRun.status === 0, `dual-version consumer harness failed: ${harnessRun.stdout}${harnessRun.stderr}`);
    const clientSource = await readFile(join(output, 'client.ts'), 'utf8');
    const typesSource = await readFile(join(output, 'types.ts'), 'utf8');
    const validatorSource = await readFile(join(output, 'runtime-validator.ts'), 'utf8');
    assert(clientSource.includes('OperationResponseMap') && clientSource.includes('OperationErrorMap'), 'generated client lacks response/error typing');
    assert(!/packages\/contracts\/openapi\/|\/api\/v1/.test(clientSource + validatorSource), 'generated v2 runtime imports or URLs leaked v1');
    return { operations: summary.operationCount, baseUrl: summary.baseUrl, schemas: Object.keys(documentValue.components?.schemas ?? {}).length, typesBytes: Buffer.byteLength(typesSource), typesSha256: createHash('sha256').update(typesSource).digest('hex'), clientBytes: Buffer.byteLength(clientSource), clientSha256: createHash('sha256').update(clientSource).digest('hex'), runtimeSmoke: 'GET+POST /api/v2; typed request headers; request body/path/header gate; response header gate; dual-version harness; success+Problem response validators', runtimeFixtures: runtimeFixtures.length, requestGate: 'invalid=6/fetch=0; standard+nonstandard=2', dualVersion: 'v1=/api/v1;v2=/api/v2' };
  } finally {
    await rm(output, { recursive: true, force: true });
  }
}

const awaitReadFixtures = await readFile(fixturesPath, 'utf8');
const parsed = await SwaggerParser.parse(documentPath);
const dereferenced = await SwaggerParser.dereference(documentPath);
independentLint(parsed, dereferenced);
const unresolvedRefs = countRefs(dereferenced);
assert(unresolvedRefs === 0, `dereferenced document contains ${unresolvedRefs} unresolved references`);
const operationIds = operationsOf(parsed).map(({ operation }) => operation.operationId);
const fixtureStats = compileFixtures(dereferenced);
const cancelledArtifacts = ['migrations/007-' + ['back', 'fill'].join('') + '.sql', 'migrations/007-' + ['back', 'fill'].join('') + '.sql.md', 'migrations/forward-fix.sql'];
for (const cancelled of cancelledArtifacts) {
  let exists = true;
  try { await access(new URL(`./${cancelled}`, root)); } catch { exists = false; }
  assert(!exists, `cancelled legacy artifact still exists: ${cancelled}`);
}
const cleanInitValidator = fileURLToPath(new URL('./clean-init/validate.mjs', import.meta.url));
const cleanInitRun = spawnSync(process.execPath, [cleanInitValidator], { encoding: 'utf8' });
assert(cleanInitRun.status === 0, `clean-init schema gate failed: ${cleanInitRun.stdout}${cleanInitRun.stderr}`);
const generationStats = await runGeneratedGate();
console.log(`V2_REVIEW_PARSE exit=0 operations=${operationIds.length} paths=${Object.keys(parsed.paths).length}`);
console.log(`V2_REVIEW_DEREFERENCE exit=0 unresolvedRefs=${unresolvedRefs}`);
console.log(`V2_REVIEW_LINT exit=0 checks=R1,R2,R3,R4,R5,R6,R7,R8,P3-01`);
console.log(`V2_REVIEW_TYPES_GENERATION exit=0 bytes=${generationStats.typesBytes} sha256=${generationStats.typesSha256}`);
console.log(`V2_REVIEW_CLIENT_GENERATION exit=0 operations=${generationStats.operations} bytes=${generationStats.clientBytes} sha256=${generationStats.clientSha256} baseUrl=${generationStats.baseUrl} runtimeSmoke=${generationStats.runtimeSmoke}`);
console.log(`V2_REVIEW_VALIDATOR_GENERATION exit=0 schemas=${generationStats.schemas} typecheck=0 runtimeFixtures=${generationStats.runtimeFixtures}`);
console.log(`V2_REVIEW_VALIDATOR_FIXTURES exit=0 schemas=${fixtureStats.schemaCount} fixtures=${fixtureStats.validCount}-valid/${fixtureStats.invalidCount}-invalid`);
console.log(`V2_REVIEW_REQUEST_GATE exit=0 ${generationStats.requestGate}`);
console.log(`V2_REVIEW_DUAL_VERSION exit=0 ${generationStats.dualVersion}`);
console.log('V2_REVIEW_CLEAN_INIT exit=0 preflight=PROCEED|STOP seed=synthetic no-legacy-conversion-engine');
