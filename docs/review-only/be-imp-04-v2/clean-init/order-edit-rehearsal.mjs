/* global console, process, structuredClone */
import { readFile } from 'node:fs/promises';

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

function replacementLine(line, key, entry) {
  const lineId = line.lineId ?? 'new-line';
  const snapshotId = `snapshot-${key}-${lineId}`;
  return {
    lineId,
    itemKind: line.itemKind,
    skuId: line.skuId ?? null,
    snapshotId,
    imageFileId: line.imageFileId ?? null,
    priceSource: line.itemKind === 'NON_STANDARD' ? 'MANUAL_QUOTE' : 'CATALOG_POLICY',
    effectiveUnitPrice: entry.expectedPrice ?? '19.9900',
    priceSnapshot: { sourceKind: line.itemKind === 'NON_STANDARD' ? 'MANUAL_QUOTE' : 'CATALOG_POLICY', sourceCurrency: 'USD', sourceUnitPrice: entry.expectedPrice ?? '19.9900', capturedAt: '2026-11-01T00:00:01Z' },
    fxSnapshot: line.fxSnapshot ?? null,
  };
}

function assertRollbackPrecondition(state, entry) {
  assert(typeof entry.failure === 'string' && entry.failure.length > 0, `${entry.name} lacks a machine failure code`);
  assert(Array.isArray(entry.body?.lines), `${entry.name} has no fixture request body`);
  const submittedIds = entry.body.lines.filter((line) => line.lineId !== null).map((line) => String(line.lineId));
  const existingIds = new Set(state.lines.map((line) => String(line.lineId)));
  if (entry.failure === 'EXTERNAL_LINE_ID') assert(submittedIds.some((lineId) => !existingIds.has(lineId)), `${entry.name} did not submit an external lineId`);
  if (entry.failure === 'LINE_DISAPPEARED') assert(submittedIds.includes('removed-line') && existingIds.has('removed-line'), `${entry.name} did not submit a line that disappeared before lock`);
  if (entry.failure === 'ITEM_KIND_SWITCH') assert(entry.body.lines.some((line) => line.lineId === 'old-line' && line.itemKind === 'NON_STANDARD'), `${entry.name} did not switch an existing line kind`);
  if (entry.failure === 'LATE_STAGE') assert(entry.state?.stage === 'DEPOSIT_PENDING', `${entry.name} lacks a non-editable stage precondition`);
  if (entry.failure === 'TERMINAL') assert(entry.state?.status === 'CANCELLED', `${entry.name} lacks a terminal status precondition`);
  if (entry.failure === 'STALE_ETAG') assert(entry.ifMatch === '"v6"' && entry.ifMatch !== `"v${state.version}"`, `${entry.name} lacks a stale If-Match precondition`);
  if (entry.failure === 'POLICY_RECHECK') assert(entry.policyVersion === state.version + 1, `${entry.name} lacks a changed policy version for the lock-time recheck`);
  if (entry.failure === 'RESOURCE_NOT_FOUND') assert(entry.fileState === 'MISSING' && entry.body.lines.some((line) => line.imageFileId === 'missing-image'), `${entry.name} lacks the Files hidden-404 precondition`);
  if (entry.failure === 'FILE_NOT_READY') assert(entry.fileState !== 'AVAILABLE' && entry.body.lines.some((line) => line.imageFileId === 'pending-image'), `${entry.name} lacks the FILE_NOT_READY precondition`);
  if (['INTERNAL_ERROR', 'DEPENDENCY_FAILURE', 'DEPENDENCY_UNAVAILABLE'].includes(entry.failure)) assert(entry.recovery === true && entry.externalFailure === entry.failure, `${entry.name} lacks its unknown-result recovery classification`);
}

function apply(state, entry, key) {
  if (entry.replay && state.lastKey === key) return { state, outcome: 'REPLAY' };
  if (entry.outcome === 'ROLLBACK') {
    assertRollbackPrecondition(state, entry);
    return { state, outcome: 'ROLLBACK', failure: entry.failure, recovery: Boolean(entry.recovery) };
  }
  assert(entry.body?.lines && Array.isArray(entry.body.lines), `${entry.name} has no complete replacement body`);
  const ids = entry.body.lines.filter((line) => line.lineId !== null).map((line) => line.lineId);
  assert(new Set(ids).size === ids.length, `${entry.name} accepted duplicate stable lineId`);
  const next = structuredClone(state);
  next.lines = entry.body.lines.map((line) => replacementLine(line, key, entry));
  next.immutableSnapshots.push(...next.lines.map((line) => line.snapshotId));
  next.files = next.lines.filter((line) => line.imageFileId !== null).map((line) => line.imageFileId);
  next.version += 1;
  next.audit += 1;
  next.outbox += 1;
  next.ledger += 1;
  next.lastKey = key;
  return { state: next, outcome: 'COMMIT' };
}

let commits = 0;
let rollbacks = 0;
let replays = 0;
let appendAndRepoint = 0;
for (const entry of rehearsal.cases) {
  const state = initialState();
  const key = `edit-${entry.name}`;
  const result = apply(state, entry, key);
  if (entry.outcome === 'ROLLBACK') {
    assert(result.outcome === 'ROLLBACK' && JSON.stringify(result.state) === JSON.stringify(state), `${entry.name} did not preserve atomic rollback`);
    assert(result.state.audit === 0 && result.state.outbox === 0 && result.state.ledger === 0, `${entry.name} left a failure side effect`);
    rollbacks += 1;
    continue;
  }
  assert(result.outcome === 'COMMIT', `${entry.name} did not commit its fixture request`);
  assert(JSON.stringify(result.state.lines.map((line) => line.lineId)) === JSON.stringify(entry.expectedLineIds), `${entry.name} line replacement was not applied from fixture input`);
  assert(result.state.version === 8 && result.state.audit === 1 && result.state.outbox === 1 && result.state.ledger === 1, `${entry.name} did not atomically append one audit/outbox/ledger result`);
  if (entry.removedLineIds) for (const lineId of entry.removedLineIds) assert(!result.state.lines.some((line) => line.lineId === lineId), `${entry.name} did not omit/remove the existing line`);
  if (entry.expectedImages) assert(JSON.stringify(result.state.files) === JSON.stringify(entry.expectedImages), `${entry.name} image association did not follow the fixture`);
  if (entry.priceSource) assert(result.state.lines.some((line) => line.priceSource === entry.priceSource), `${entry.name} price source snapshot was not captured`);
  if (entry.expectedPrice) assert(result.state.lines.every((line) => line.effectiveUnitPrice === entry.expectedPrice), `${entry.name} did not capture the authoritative effective price`);
  if (entry.fx !== undefined) assert(JSON.stringify(result.state.lines[0].fxSnapshot) === JSON.stringify(entry.fx), `${entry.name} FX snapshot was not immutable and per-line`);
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
console.log(`ORDER_EDIT_REHEARSAL exit=0 scenarios=${rehearsal.cases.length} rollback=${rollbacks} commit=${commits} replay=${replays} appendAndRepoint=${appendAndRepoint} fixtureDriven=1 sideEffects=audit+outbox+ledger immutableSnapshots=retained`);
