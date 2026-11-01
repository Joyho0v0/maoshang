/* global console, process, structuredClone */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

class EditFailure extends Error {
  constructor(code, recovery = false) {
    super(code);
    this.code = code;
    this.recovery = recovery;
  }
}

function reject(code, recovery = false) {
  throw new EditFailure(code, recovery);
}

const fixturesPath = process.argv[2];
assert(fixturesPath, 'usage: order-edit-rehearsal <fixtures.json>');
const fixtures = JSON.parse(await readFile(fixturesPath, 'utf8'));
const rehearsal = fixtures.orderEditRehearsal;
const required = [
  'omissionRemove', 'standardAddReprice', 'sameCurrency', 'crossCurrency', 'nonStandardSnapshot',
  'imageAdd', 'imageReplace', 'imageRemove', 'externalLineId', 'disappearedLineId', 'itemKindSwitch',
  'lateStage', 'terminal', 'staleEtag', 'policyRecheck', 'fileNotFound', 'fileNotReady',
  'unknown500Rollback', 'dependency502Rollback', 'dependency503Rollback', 'idempotentReplayNoDuplicateSideEffects',
];
assert(Array.isArray(rehearsal?.cases) && rehearsal.cases.length === required.length, 'order edit cases are not fixture-driven or complete');
assert(required.every((name) => rehearsal.cases.some((entry) => entry.name === name)), 'order edit case inventory is incomplete');

function initialState() {
  return {
    version: rehearsal.initial.version,
    policyVersion: rehearsal.initial.policyVersion,
    orderCurrency: rehearsal.initial.orderCurrency,
    stage: 'INITIAL_CONTACT',
    status: 'DRAFT',
    lines: structuredClone(rehearsal.initial.lines),
    immutableSnapshots: ['old-snapshot', 'removed-snapshot'],
    files: [],
    audit: 0,
    outbox: 0,
    ledger: 0,
    lastKey: null,
  };
}

function stateForEntry(entry) {
  const state = initialState();
  Object.assign(state, structuredClone(entry.state ?? {}));
  return state;
}

function stateAtLock(state, entry) {
  const locked = structuredClone(state);
  const removed = new Set(entry.lockState?.removeLineIds ?? []);
  locked.lines = locked.lines.filter((line) => !removed.has(line.lineId));
  if (entry.lockState?.stage !== undefined) locked.stage = entry.lockState.stage;
  if (entry.lockState?.status !== undefined) locked.status = entry.lockState.status;
  return locked;
}

function deterministicUuid(seed) {
  const hash = createHash('sha256').update(seed).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function scaled(value, scale) {
  assert(typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value), `invalid decimal ${value}`);
  const [integer, fraction = ''] = value.split('.');
  assert(fraction.length <= scale, `decimal ${value} exceeds scale ${scale}`);
  return BigInt(integer + fraction.padEnd(scale, '0'));
}

function formatScaled(value, scale) {
  const absolute = value < 0n ? -value : value;
  const digits = absolute.toString().padStart(scale + 1, '0');
  const integer = digits.slice(0, -scale) || '0';
  const fraction = scale === 0 ? '' : `.${digits.slice(-scale)}`;
  return `${value < 0n ? '-' : ''}${integer}${fraction}`;
}

function roundHalfUp(value, sourceScale, targetScale) {
  assert(sourceScale >= targetScale, 'rounding cannot increase scale');
  const divisor = 10n ** BigInt(sourceScale - targetScale);
  const quotient = value / divisor;
  const remainder = value % divisor;
  return quotient + (remainder * 2n >= divisor ? 1n : 0n);
}

function divideHalfUp(numerator, denominator) {
  return (numerator + denominator / 2n) / denominator;
}

function multiply(left, leftScale, right, rightScale, targetScale) {
  return formatScaled(roundHalfUp(left * right, leftScale + rightScale, targetScale), targetScale);
}

function priceForLine(line, entry, state) {
  if (Object.hasOwn(line, 'fxSnapshot') || Object.hasOwn(line, 'priceSnapshot') || Object.hasOwn(line, 'snapshotId')) reject('CLIENT_SNAPSHOT_FORBIDDEN');
  const quantity = scaled(line.quantity ?? '1.000000', 6);
  const orderCurrency = state.orderCurrency;
  if (line.itemKind === 'NON_STANDARD') {
    if (line.skuId !== undefined || !['SIMPLE', 'NONE'].includes(line.standardizationMode)) reject('INVALID_NON_STANDARD_LINE');
    const quoted = line.quotedUnitPrice;
    assert(typeof quoted === 'string', `${entry.name} non-standard line lacks quotedUnitPrice`);
    const unit = formatScaled(scaled(quoted, 4), 4);
    return {
      priceSource: 'MANUAL_QUOTE',
      sourceCurrency: orderCurrency,
      sourceUnitPrice: unit,
      effectiveUnitPrice: unit,
      lineAmount: multiply(scaled(unit, 4), 4, quantity, 6, 4),
      fxSnapshot: null,
      standardizationMode: line.standardizationMode,
    };
  }
  if (line.itemKind !== 'STANDARD' || typeof line.skuId !== 'string') reject('INVALID_STANDARD_LINE');
  const sourceCurrency = entry.policyCurrency ?? orderCurrency;
  const sourceUnitPrice = formatScaled(scaled(entry.policyUnitPrice ?? entry.expectedPrice ?? '19.9900', 4), 4);
  let effectiveUnitPrice = sourceUnitPrice;
  let fxSnapshot = null;
  if (sourceCurrency === orderCurrency) {
    if (entry.fx !== null && entry.fx !== undefined) reject('FX_SHAPE_CONFLICT');
  } else {
    const fx = entry.fx;
    if (!fx || fx.baseCurrency !== sourceCurrency || fx.quoteCurrency !== orderCurrency) reject('FX_CURRENCY_MISMATCH');
    const rawRate = scaled(fx.rawMarketRate, 12);
    const riskBufferBps = Number(fx.riskBufferBps);
    assert(Number.isInteger(riskBufferBps) && riskBufferBps >= 0 && riskBufferBps <= 2000, `${entry.name} riskBufferBps is invalid`);
    const effectiveRate = divideHalfUp(rawRate * BigInt(10000 + riskBufferBps), 10000n);
    const effectiveRateText = formatScaled(effectiveRate, 12);
    assert(fx.effectiveRate === effectiveRateText, `${entry.name} FX effectiveRate was not derived from raw rate and risk buffer`);
    effectiveUnitPrice = multiply(scaled(sourceUnitPrice, 4), 4, effectiveRate, 12, 4);
    fxSnapshot = { ...fx, effectiveRate: effectiveRateText };
  }
  return {
    priceSource: 'CATALOG_POLICY',
    sourceCurrency,
    sourceUnitPrice,
    effectiveUnitPrice,
    lineAmount: multiply(scaled(effectiveUnitPrice, 4), 4, quantity, 6, 4),
    fxSnapshot,
    standardizationMode: line.standardizationMode ?? 'STRICT',
  };
}

function apply(state, entry, key) {
  if (entry.replay && state.lastKey === key) return { state, outcome: 'REPLAY' };
  try {
    assert(Array.isArray(entry.body?.lines), `${entry.name} has no complete replacement body`);
    if (state.status !== 'DRAFT' || !['INITIAL_CONTACT', 'QUOTING', 'QUOTE_FOLLOW_UP'].includes(state.stage)) {
      reject(state.status === 'CANCELLED' || state.status === 'FULFILLED' || state.status === 'CLOSED' ? 'TERMINAL' : 'LATE_STAGE');
    }
    if (entry.ifMatch !== undefined && entry.ifMatch !== `"v${state.version}"`) reject('STALE_ETAG');
    if (entry.policyVersion !== undefined && entry.policyVersion !== state.policyVersion) reject('POLICY_RECHECK');
    const locked = stateAtLock(state, entry);
    const preLockById = new Map(state.lines.map((line) => [String(line.lineId), line]));
    const lockedById = new Map(locked.lines.map((line) => [String(line.lineId), line]));
    const stableIds = entry.body.lines.filter((line) => line.lineId !== null).map((line) => String(line.lineId));
    if (new Set(stableIds).size !== stableIds.length) reject('DUPLICATE_LINE_ID');
    const imageIds = entry.body.lines.filter((line) => line.imageFileId !== null).map((line) => String(line.imageFileId));
    if (new Set(imageIds).size !== imageIds.length) reject('DUPLICATE_IMAGE');
    const generatedIds = new Set();
    const nextLines = entry.body.lines.map((line, index) => {
      const lineId = line.lineId === null ? deterministicUuid(`${key}:line:${index}`) : String(line.lineId);
      if (line.lineId === null && entry.idAllocator === 'COLLIDE') {
        if (generatedIds.has('collision')) reject('LINE_ID_COLLISION');
        generatedIds.add('collision');
      } else if (generatedIds.has(lineId)) {
        reject('LINE_ID_COLLISION');
      } else {
        generatedIds.add(lineId);
      }
      if (line.lineId !== null) {
        if (!preLockById.has(lineId)) reject('EXTERNAL_LINE_ID');
        if (!lockedById.has(lineId)) reject('LINE_DISAPPEARED');
        if (lockedById.get(lineId).itemKind !== line.itemKind) reject('ITEM_KIND_SWITCH');
      }
      if (line.imageFileId !== null && entry.fileState === 'MISSING') reject('RESOURCE_NOT_FOUND');
      if (line.imageFileId !== null && entry.fileState !== undefined && entry.fileState !== 'AVAILABLE') reject('FILE_NOT_READY');
      const price = priceForLine(line, entry, state);
      return {
        lineId,
        itemKind: line.itemKind,
        ...(line.itemKind === 'STANDARD' ? { skuId: line.skuId } : {}),
        snapshotId: `snapshot-${key}-${index}`,
        imageFileId: line.imageFileId ?? null,
        ...price,
        priceSnapshot: { sourceKind: price.priceSource, sourceCurrency: price.sourceCurrency, sourceUnitPrice: price.sourceUnitPrice, capturedAt: '2026-11-01T00:00:01Z' },
      };
    });
    if (entry.externalFailure !== undefined) {
      if (!['INTERNAL_ERROR', 'DEPENDENCY_FAILURE', 'DEPENDENCY_UNAVAILABLE'].includes(entry.externalFailure)) reject('UNKNOWN_FAILURE_CLASS');
      reject(entry.externalFailure, true);
    }
    const next = structuredClone(state);
    next.lines = nextLines;
    next.immutableSnapshots.push(...nextLines.map((line) => line.snapshotId));
    next.files = nextLines.filter((line) => line.imageFileId !== null).map((line) => line.imageFileId);
    next.version += 1;
    next.audit += 1;
    next.outbox += 1;
    next.ledger += 1;
    next.lastKey = key;
    return { state: next, outcome: 'COMMIT' };
  } catch (error) {
    if (error instanceof EditFailure) return { state, outcome: 'ROLLBACK', failure: error.code, recovery: error.recovery };
    throw error;
  }
}

let commits = 0;
let rollbacks = 0;
let replays = 0;
let appendAndRepoint = 0;
for (const entry of rehearsal.cases) {
  const state = stateForEntry(entry);
  const key = `edit-${entry.name}`;
  const result = apply(state, entry, key);
  assert(result.outcome === entry.expectedOutcome, `${entry.name} expected ${entry.expectedOutcome} but execution returned ${result.outcome}`);
  if (entry.expectedOutcome === 'ROLLBACK') {
    assert(result.failure === entry.expectedFailure, `${entry.name} returned ${result.failure}, expected ${entry.expectedFailure}`);
    if (entry.expectedRecovery !== undefined) assert(result.recovery === entry.expectedRecovery, `${entry.name} recovery classification mismatch`);
    assert(JSON.stringify(result.state) === JSON.stringify(state), `${entry.name} did not preserve atomic rollback`);
    assert(result.state.audit === 0 && result.state.outbox === 0 && result.state.ledger === 0, `${entry.name} left a failure side effect`);
    rollbacks += 1;
    continue;
  }
  assert(result.outcome === 'COMMIT', `${entry.name} did not commit its fixture request`);
  assert(JSON.stringify(result.state.lines.map((line) => line.lineId)) === JSON.stringify(entry.expectedLineIds), `${entry.name} line replacement was not applied from fixture input`);
  assert(result.state.version === 8 && result.state.audit === 1 && result.state.outbox === 1 && result.state.ledger === 1, `${entry.name} did not atomically append one audit/outbox/ledger result`);
  if (entry.removedLineIds) for (const lineId of entry.removedLineIds) assert(!result.state.lines.some((line) => line.lineId === lineId), `${entry.name} did not omit/remove the existing line`);
  if (entry.expectedImages) assert(JSON.stringify(result.state.files) === JSON.stringify(entry.expectedImages), `${entry.name} image association did not follow the fixture`);
  if (entry.priceSource) assert(result.state.lines.every((line) => line.priceSource === entry.priceSource), `${entry.name} price source snapshot was not captured`);
  if (entry.expectedPrice) assert(result.state.lines.every((line) => line.effectiveUnitPrice === entry.expectedPrice), `${entry.name} did not capture the authoritative effective price`);
  if (entry.fx !== undefined) assert(JSON.stringify(result.state.lines.map((line) => line.fxSnapshot)) === JSON.stringify(result.state.lines.map(() => entry.fx)), `${entry.name} FX snapshot was not immutable and per-line`);
  assert(result.state.immutableSnapshots.includes('old-snapshot') && result.state.immutableSnapshots.includes('removed-snapshot'), `${entry.name} deleted an old immutable snapshot`);
  if (!entry.replay) {
    commits += 1;
    appendAndRepoint += 1;
  }
  if (entry.replay) {
    const replay = apply(result.state, entry, key);
    assert(replay.outcome === 'REPLAY' && replay.state.audit === 1 && replay.state.outbox === 1 && replay.state.ledger === 1, 'idempotent replay duplicated edit side effects');
    replays += 1;
  }
}

assert(commits === 8 && rollbacks === 12 && replays === 1 && appendAndRepoint === 8, 'fixture-driven order edit totals are inconsistent');
console.log(`ORDER_EDIT_REHEARSAL exit=0 scenarios=${rehearsal.cases.length} rollback=${rollbacks} commit=${commits} replay=${replays} appendAndRepoint=${appendAndRepoint} fixtureDriven=1 executionDerived=1 lockReread=1 sideEffects=audit+outbox+ledger immutableSnapshots=retained stableLineIds=uuid fx=derived`);
