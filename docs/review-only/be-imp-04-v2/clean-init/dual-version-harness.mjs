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
const document = JSON.parse(await readFile(join(generatedDirectory, 'document.json'), 'utf8'));
const validatorModule = await import(pathToFileURL(join(generatedDirectory, 'runtime-validator.mjs')).href);
const clientModule = await import(pathToFileURL(join(generatedDirectory, 'client.mjs')).href);
const v2Validator = validatorModule.createV2RuntimeValidator(document);

const requestId = '77777777-7777-4777-8777-777777777777';
const commandId = '44444444-4444-4444-8444-444444444444';
const sameKey = 'dual-version-same-original-key';
const v1OrderBody = { customerId: fixtures.valid.standardSameCurrency.customerId, orderNo: 'V1-DUAL', currency: 'USD', lines: [{ skuId: '11111111-1111-4111-8111-111111111111', quantity: '1.0000', unitPrice: '19.9900' }] };
const v2OrderBody = fixtures.valid.standardSameCurrency;
const events = [];
const stats = { mutations: 0, polls: 0, inProgress: 0, recoveryRequired: 0, terminalProblems: 0, recoverable502: 0, recoverable503: 0, replayRejected: 0 };

function responseHeaders(version, status, extra = {}) {
  if (status >= 400) return version === 'v1'
    ? { 'content-type': 'application/problem+json', 'x-request-id': requestId, ...extra }
    : { 'content-type': 'application/problem+json', 'x-request-id': requestId, 'cache-control': 'no-store', ...extra };
  return version === 'v1'
    ? { 'content-type': 'application/json', 'x-request-id': requestId, 'cache-control': 'no-store', 'content-location': '/api/v1/commands/status', 'retry-after': '1', ...extra }
    : { 'content-type': 'application/json', 'x-request-id': requestId, 'cache-control': 'no-store', 'content-location': '/api/v2/commands/status', 'retry-after': '1', ...extra };
}

function command(operationId, state = 'IN_PROGRESS') {
  return { commandId, operationId, state, startedAt: '2026-10-31T00:00:00Z', expiresAt: '2026-10-31T00:01:00Z', retryAfterMs: state === 'RECOVERY_REQUIRED' ? 0 : 1000, completedAt: null, httpStatus: null, resource: null, resultHref: null, problem: null };
}

function transport(version, mode = 'success') {
  return async (url, init) => {
    const rawUrl = String(url);
    const request = { version, url: rawUrl, method: init.method, key: init.headers.get('idempotency-key') ?? null, operation: init.headers.get('x-command-operation') ?? (version === 'v1' ? 'createOrder' : 'createOrderV2') };
    events.push(request);
    if (mode === 'terminal' && init.method === 'POST' && rawUrl.endsWith('/orders')) {
      const problem = version === 'v1'
        ? { type: 'urn:autoflow:problem:file-not-ready', title: 'File is not ready', status: 409, code: 'FILE_NOT_READY', requestId, retryable: true, meta: { fileId: '33333333-3333-4333-8333-333333333333', state: 'SCANNING', statusHref: '/api/v1/files/33333333-3333-4333-8333-333333333333' } }
        : fixtures.valid.problemFileNotReady;
      return new Response(JSON.stringify(problem), { status: 409, headers: responseHeaders(version, 409) });
    }
    if (mode.startsWith('recoverable') && init.method === 'POST' && rawUrl.endsWith('/orders')) {
      const status = mode.includes('502') ? 502 : 503;
      const code = status === 502 ? 'DEPENDENCY_FAILURE' : 'DEPENDENCY_UNAVAILABLE';
      const problem = version === 'v1'
        ? { type: `urn:autoflow:problem:${code.toLowerCase().replaceAll('_', '-')}`, title: code, status, code, requestId, retryable: true }
        : fixtures.valid[status === 502 ? 'problemDependencyFailure' : 'problemDependencyUnavailable'];
      const replay = mode.endsWith('Replay') ? { 'idempotent-replay': 'true' } : {};
      return new Response(JSON.stringify(problem), { status, headers: responseHeaders(version, status, replay) });
    }
    if (rawUrl.endsWith('/commands/status')) {
      const state = mode === 'recovery' ? 'RECOVERY_REQUIRED' : 'IN_PROGRESS';
      return new Response(JSON.stringify(command(request.operation, state)), { status: 200, headers: responseHeaders(version, 200) });
    }
    if (init.method === 'POST' && rawUrl.endsWith('/orders')) return new Response(JSON.stringify(command(version === 'v1' ? 'createOrder' : 'createOrderV2')), { status: 202, headers: responseHeaders(version, 202) });
    throw new Error(`unexpected ${version} fake transport request: ${init.method} ${rawUrl}`);
  };
}

const v1Client = new GeneratedV1Client({ validator: v1Validator, fetch: transport('v1') });
const v2Client = new clientModule.GeneratedV2Client({ validator: v2Validator, fetch: transport('v2') });
const pendingCommands = new Map();
const cacheKeys = new Set();

const v1Create = await v1Client.call('createOrder', { headers: { 'X-CSRF-Token': 'csrf-token-value-with-at-least-16', 'Idempotency-Key': sameKey }, body: v1OrderBody });
const v2Create = await v2Client.call('createOrderV2', { headers: { 'X-CSRF-Token': 'csrf-token-value-with-at-least-16', 'Idempotency-Key': sameKey }, body: v2OrderBody });
assert(v1Create.status === 202 && v2Create.status === 202, 'both versioned mutation clients did not produce command status');
stats.mutations += 2;
stats.inProgress += 2;
pendingCommands.set(`v1:createOrder:${sameKey}`, v1Create.data.commandId);
pendingCommands.set(`v2:createOrderV2:${sameKey}`, v2Create.data.commandId);
cacheKeys.add(`v1:ORDER:${fixtures.valid.orderResponse.id}:orders`);
cacheKeys.add(`v2:ORDER:${fixtures.valid.orderResponse.id}:orders`);
assert(pendingCommands.size === 2 && cacheKeys.size === 2, 'versioned pending/cache keys collided');

const v1Status = await v1Client.call('getCommandStatus', { headers: { 'Idempotency-Key': sameKey, 'X-Command-Operation': 'createOrder' } });
const v2Status = await v2Client.call('getCommandStatusV2', { headers: { 'Idempotency-Key': sameKey, 'X-Command-Operation': 'createOrderV2', 'X-Request-ID': requestId } });
assert(v1Status.data.operationId === 'createOrder' && v2Status.data.operationId === 'createOrderV2', 'versioned command polling crossed operation identity');
stats.polls += 2;
assert(events.filter((event) => event.key === sameKey).every((event) => event.url.startsWith(`/api/${event.version}/`)), 'same-key requests crossed version base paths');
assert(events.some((event) => event.version === 'v1' && event.url === '/api/v1/orders') && events.some((event) => event.version === 'v2' && event.url === '/api/v2/orders'), 'fake transport did not observe both versioned mutations');

for (const [version, client, operation, input] of [
  ['v1', new GeneratedV1Client({ validator: v1Validator, fetch: transport('v1', 'terminal') }), 'createOrder', { headers: { 'X-CSRF-Token': 'csrf-token-value-with-at-least-16', 'Idempotency-Key': 'terminal-v1' }, body: v1OrderBody }],
  ['v2', new clientModule.GeneratedV2Client({ validator: v2Validator, fetch: transport('v2', 'terminal') }), 'createOrderV2', { headers: { 'X-CSRF-Token': 'csrf-token-value-with-at-least-16', 'Idempotency-Key': 'terminal-v2' }, body: v2OrderBody }],
]) {
  let observed = false;
  try { await client.call(operation, input); } catch (error) { observed = error?.status === 409 && error?.problem?.code === 'FILE_NOT_READY'; }
  assert(observed, `${version} terminal Problem did not stay in its versioned error branch`);
  const terminalEvent = events.at(-1);
  assert(terminalEvent?.version === version && terminalEvent.key === input.headers['Idempotency-Key'] && terminalEvent.operation === operation && terminalEvent.url === `/api/${version}/orders`, `${version} terminal Problem request crossed version or operation identity`);
  stats.terminalProblems += 1;
}

for (const [version, client, operation, input] of [
  ['v1', new GeneratedV1Client({ validator: v1Validator, fetch: transport('v1', 'recovery') }), 'createOrder', { headers: { 'X-CSRF-Token': 'csrf-token-value-with-at-least-16', 'Idempotency-Key': 'recovery-v1' }, body: v1OrderBody }],
  ['v2', new clientModule.GeneratedV2Client({ validator: v2Validator, fetch: transport('v2', 'recovery') }), 'createOrderV2', { headers: { 'X-CSRF-Token': 'csrf-token-value-with-at-least-16', 'Idempotency-Key': 'recovery-v2' }, body: v2OrderBody }],
]) {
  const accepted = await client.call(operation, input);
  const status = version === 'v1'
    ? await client.call('getCommandStatus', { headers: { 'Idempotency-Key': input.headers['Idempotency-Key'], 'X-Command-Operation': 'createOrder' } })
    : await client.call('getCommandStatusV2', { headers: { 'Idempotency-Key': input.headers['Idempotency-Key'], 'X-Command-Operation': 'createOrderV2', 'X-Request-ID': requestId } });
  assert(accepted.status === 202 && status.data.state === 'RECOVERY_REQUIRED' && status.data.operationId === (version === 'v1' ? 'createOrder' : 'createOrderV2'), `${version} RECOVERY_REQUIRED branch crossed version or state identity`);
  const recoveryEvents = events.filter((event) => event.key === input.headers['Idempotency-Key']);
  assert(recoveryEvents.length === 2 && recoveryEvents[0].version === version && recoveryEvents[0].url === `/api/${version}/orders` && recoveryEvents[0].operation === operation && recoveryEvents[1].version === version && recoveryEvents[1].url === `/api/${version}/commands/status` && recoveryEvents[1].operation === (version === 'v1' ? 'createOrder' : 'createOrderV2'), `${version} RECOVERY_REQUIRED requests crossed version or operation identity`);
  stats.mutations += 1;
  stats.polls += 1;
  stats.recoveryRequired += 1;
}

for (const status of [502, 503]) {
  for (const [version, client, operation, input] of [
    ['v1', new GeneratedV1Client({ validator: v1Validator, fetch: transport('v1', `recoverable${status}`) }), 'createOrder', { headers: { 'X-CSRF-Token': 'csrf-token-value-with-at-least-16', 'Idempotency-Key': `recoverable-${status}-v1` }, body: v1OrderBody }],
    ['v2', new clientModule.GeneratedV2Client({ validator: v2Validator, fetch: transport('v2', `recoverable${status}`) }), 'createOrderV2', { headers: { 'X-CSRF-Token': 'csrf-token-value-with-at-least-16', 'Idempotency-Key': `recoverable-${status}-v2` }, body: v2OrderBody }],
  ]) {
    let observed = false;
    try { await client.call(operation, input); } catch (error) { observed = error?.status === status && error?.problem?.retryable === true && error?.headers?.['Idempotent-Replay'] === undefined; }
    assert(observed, `${version} ${status} normal recovery did not preserve retryable/no-replay semantics`);
    const recoveryEvent = events.at(-1);
    assert(recoveryEvent?.version === version && recoveryEvent.key === input.headers['Idempotency-Key'] && recoveryEvent.operation === operation && recoveryEvent.url === `/api/${version}/orders`, `${version} ${status} request crossed version or operation identity`);
    stats[status === 502 ? 'recoverable502' : 'recoverable503'] += 1;
  }
}

for (const status of [502, 503]) {
  const client = new clientModule.GeneratedV2Client({ validator: v2Validator, fetch: transport('v2', `recoverable${status}Replay`) });
  let rejected = false;
  try { await client.call('createOrderV2', { headers: { 'X-CSRF-Token': 'csrf-token-value-with-at-least-16', 'Idempotency-Key': `replay-${status}-v2` }, body: v2OrderBody }); } catch (error) { rejected = /Forbidden response header|recoverable problem cannot be replayed/i.test(error?.message ?? ''); }
  assert(rejected, `v2 recoverable ${status} incorrectly accepted Idempotent-Replay`);
  assert(events.at(-1)?.version === 'v2' && events.at(-1).key === `replay-${status}-v2` && events.at(-1).operation === 'createOrderV2' && events.at(-1).url === '/api/v2/orders', `v2 replay rejection ${status} crossed version or operation identity`);
  stats.replayRejected += 1;
}

assert(fixtures.valid.problemDependencyFailure.code === 'DEPENDENCY_FAILURE' && fixtures.valid.problemDependencyUnavailable.code === 'DEPENDENCY_UNAVAILABLE', 'dependency recovery fixtures are missing');
assert(fixtures.valid.problemDependencyFailure.retryable === true && fixtures.valid.problemDependencyUnavailable.retryable === true, 'dependency problems lost retryable recovery semantics');
assert(fixtures.valid.problemFileNotReady.meta.statusHref.startsWith('/api/v2/'), 'FILE_NOT_READY status href fell back to v1');
assert(fixtures.valid.problemCsrfFailed.meta.refreshHref === '/api/v2/auth/csrf', 'v2 CSRF href is not canonical');
const canonicalCapability = 'customer.submit-approval';
assert(/^[a-z][a-z0-9.:-]{1,127}$/.test(canonicalCapability), 'canonical capability is invalid');
assert(!/customer\.submitApproval/.test(JSON.stringify(fixtures)), 'camelCase capability alias is present in v2 fixtures');
console.log(`DUAL_VERSION_HARNESS exit=0 requests=${events.length} mutations=${stats.mutations} polls=${stats.polls} inProgress=${stats.inProgress} recoveryRequired=${stats.recoveryRequired} terminalProblems=${stats.terminalProblems} recoverable502=${stats.recoverable502} recoverable503=${stats.recoverable503} replayRejected=${stats.replayRejected} cacheKeys=${cacheKeys.size} pendingKeys=${pendingCommands.size} v1=/api/v1 v2=/api/v2`);
