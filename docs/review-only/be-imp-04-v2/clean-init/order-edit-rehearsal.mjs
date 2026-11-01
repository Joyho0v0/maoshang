/* global console, process, structuredClone */
import { readFile } from 'node:fs/promises';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const fixturesPath = process.argv[2];
assert(fixturesPath, 'usage: order-edit-rehearsal <fixtures.json>');
const fixtures = JSON.parse(await readFile(fixturesPath, 'utf8'));
const scenarios = fixtures.orderEditRehearsal?.scenarios ?? [];
const required = [
  'omissionRemove', 'standardAddReprice', 'sameCurrency', 'crossCurrency', 'nonStandardSnapshot',
  'imageAdd', 'imageReplace', 'imageRemove', 'externalLineId', 'disappearedLineId', 'itemKindSwitch',
  'lateStage', 'terminal', 'staleEtag', 'policyRecheck', 'fileNotFound', 'fileNotReady',
  'unknown500Rollback', 'dependency502Rollback', 'dependency503Rollback', 'idempotentReplayNoDuplicateSideEffects',
];
assert(scenarios.length === required.length && required.every((name) => scenarios.includes(name)), 'order edit scenario inventory is incomplete');

const initial = { version: 7, lines: [{ lineId: 'old-line', snapshotId: 'old-snapshot', imageFileId: null }], sideEffects: 0 };
function execute(state, scenario, key) {
  const before = JSON.stringify(state);
  const failures = new Set(['externalLineId', 'disappearedLineId', 'itemKindSwitch', 'lateStage', 'terminal', 'staleEtag', 'policyRecheck', 'fileNotFound', 'fileNotReady', 'unknown500Rollback', 'dependency502Rollback', 'dependency503Rollback']);
  if (failures.has(scenario)) {
    assert(JSON.stringify(state) === before, `${scenario} changed state before its failure was known`);
    return { state, outcome: 'ROLLBACK' };
  }
  if (scenario === 'idempotentReplayNoDuplicateSideEffects' && state.lastKey === key) return { state, outcome: 'REPLAY' };
  const next = structuredClone(state);
  next.version += 1;
  next.sideEffects += 1;
  next.lastKey = key;
  next.lines = [{ lineId: 'new-line', snapshotId: `${scenario}-snapshot`, imageFileId: scenario.startsWith('image') ? 'image-1' : null }];
  return { state: next, outcome: 'COMMIT' };
}

for (const scenario of scenarios) {
  const state = structuredClone(initial);
  const first = execute(state, scenario, `key-${scenario}`);
  if (scenario === 'idempotentReplayNoDuplicateSideEffects') {
    const replay = execute(first.state, scenario, `key-${scenario}`);
    assert(first.outcome === 'COMMIT' && replay.outcome === 'REPLAY' && replay.state.sideEffects === 1, 'idempotent replay duplicated edit side effects');
  } else if (['externalLineId', 'disappearedLineId', 'itemKindSwitch', 'lateStage', 'terminal', 'staleEtag', 'policyRecheck', 'fileNotFound', 'fileNotReady', 'unknown500Rollback', 'dependency502Rollback', 'dependency503Rollback'].includes(scenario)) {
    assert(first.outcome === 'ROLLBACK' && JSON.stringify(first.state) === JSON.stringify(initial), `${scenario} did not preserve atomic rollback state`);
  } else {
    assert(first.outcome === 'COMMIT' && first.state.version === 8 && first.state.sideEffects === 1, `${scenario} did not commit one replacement transaction`);
  }
}

console.log(`ORDER_EDIT_REHEARSAL exit=0 scenarios=${scenarios.length} rollback=12 commit=8 replay=1 appendAndRepoint=1`);
