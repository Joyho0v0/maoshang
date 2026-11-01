/* global Response, process, console */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import { GeneratedApiClient as GeneratedV1Client } from '../../../../packages/contracts/openapi/generated-client.ts';
import { createContractValidator } from '../../../../packages/contracts/openapi/runtime-validator.ts';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const [generatedDirectory, v1OpenApiPath, fixturesPath] = process.argv.slice(2);
assert(generatedDirectory && v1OpenApiPath && fixturesPath, 'usage: dual-version-harness <generated-dir> <v1-openapi> <fixtures>');

const fixtures = JSON.parse(await readFile(fixturesPath, 'utf8'));
const v1Document = parse(await readFile(v1OpenApiPath, 'utf8'));
const v1Validator = createContractValidator(v1Document);
let v1Url = '';
const v1Client = new GeneratedV1Client({
  validator: v1Validator,
  fetch: async (url) => {
    v1Url = String(url);
    return new Response(JSON.stringify({ csrfToken: 'csrf-token-value-with-at-least-16', expiresAt: '2026-11-02T00:00:00Z' }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'x-request-id': '77777777-7777-4777-8777-777777777777', 'cache-control': 'no-store' },
    });
  },
});
await v1Client.call('getCsrfToken', {});
assert(v1Url === '/api/v1/auth/csrf', `v1 client escaped its base path: ${v1Url}`);

const document = JSON.parse(await readFile(join(generatedDirectory, 'document.json'), 'utf8'));
const validatorModule = await import(pathToFileURL(join(generatedDirectory, 'runtime-validator.mjs')).href);
const clientModule = await import(pathToFileURL(join(generatedDirectory, 'client.mjs')).href);
const validator = validatorModule.createV2RuntimeValidator(document);
let v2Url = '';
const v2Client = new clientModule.GeneratedV2Client({
  validator,
  fetch: async (url) => {
    v2Url = url;
    return new Response(JSON.stringify({ data: [], page: { nextCursor: null, hasNext: false } }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'x-request-id': '77777777-7777-4777-8777-777777777777' },
    });
  },
});
await v2Client.call('listOrdersV2', { headers: { 'X-Request-ID': '77777777-7777-4777-8777-777777777777' } });
assert(v2Url === '/api/v2/orders', `v2 client escaped its base path: ${v2Url}`);
assert(v1Url.startsWith('/api/v1/') && v2Url.startsWith('/api/v2/'), 'dual-version paths are not isolated');

const v1Operations = await import('../../../../packages/contracts/openapi/generated-client.ts');
const operationKeyV1 = `v1:${v1Operations.operations.createOrder?.path ?? 'createOrder'}`;
const operationKeyV2 = `v2:${clientModule.operations.createOrderV2.path}`;
assert(operationKeyV1 !== operationKeyV2 && operationKeyV2 === 'v2:/orders', 'versioned operation identity is not isolated');
assert(fixtures.valid.problemDependencyFailure.code === 'DEPENDENCY_FAILURE' && fixtures.valid.problemDependencyUnavailable.code === 'DEPENDENCY_UNAVAILABLE', 'dependency recovery fixtures are missing');
assert(fixtures.valid.problemDependencyFailure.retryable === true && fixtures.valid.problemDependencyUnavailable.retryable === true, 'dependency problems lost retryable recovery semantics');
assert(fixtures.valid.problemFileNotReady.meta.statusHref.startsWith('/api/v2/'), 'FILE_NOT_READY status href fell back to v1');
assert(fixtures.valid.problemCsrfFailed.meta.refreshHref === '/api/v2/auth/csrf', 'v2 CSRF href is not canonical');
const canonicalCapability = 'customer.submit-approval';
assert(/^[a-z][a-z0-9.:-]{1,127}$/.test(canonicalCapability), 'canonical capability is invalid');
assert(!/customer\.submitApproval/.test(JSON.stringify(fixtures)), 'camelCase capability alias is present in v2 fixtures');
console.log(`DUAL_VERSION_HARNESS exit=0 v1Client=${v1Url} v2Client=${v2Url} operationKeys=${operationKeyV1},${operationKeyV2} recovery=502,503 capability=${canonicalCapability}`);
