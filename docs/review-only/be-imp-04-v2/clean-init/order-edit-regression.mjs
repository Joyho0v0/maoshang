/* global console, process, structuredClone, URL */
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const directory = new URL('./', import.meta.url);
const rehearsalPath = new URL('./order-edit-rehearsal.mjs', directory).pathname;
const fixturesPath = new URL('../fixtures.json', directory).pathname;
const original = JSON.parse(await readFile(fixturesPath, 'utf8'));
const mutations = [
  {
    name: 'expected-outcome-oracle',
    mutate(value) {
      const entry = value.orderEditRehearsal.cases.find((candidate) => candidate.name === 'externalLineId');
      entry.expectedOutcome = 'COMMIT';
    },
  },
  {
    name: 'cross-currency-source-mismatch',
    mutate(value) {
      const entry = value.orderEditRehearsal.cases.find((candidate) => candidate.name === 'crossCurrency');
      entry.policyCurrency = 'EUR';
      entry.body.lines[0].fxSnapshot = { baseCurrency: 'JPY', quoteCurrency: 'USD', rawMarketRate: '1.080000000000' };
      entry.fx.baseCurrency = 'JPY';
    },
  },
  {
    name: 'generated-line-id-collision',
    mutate(value) {
      const entry = value.orderEditRehearsal.cases.find((candidate) => candidate.name === 'standardAddReprice');
      entry.idAllocator = 'COLLIDE';
    },
  },
];

const temporaryDirectory = await mkdtemp(join(process.cwd(), '.order-edit-regression-'));
try {
  let accepted = 0;
  for (const mutation of mutations) {
    const mutated = structuredClone(original);
    mutation.mutate(mutated);
    const path = join(temporaryDirectory, `${mutation.name}.json`);
    await writeFile(path, JSON.stringify(mutated));
    const result = spawnSync(process.execPath, [rehearsalPath, path], { encoding: 'utf8' });
    if (result.status === 0) accepted += 1;
  }
  assert(accepted === 0, `order edit rehearsal accepted ${accepted}/${mutations.length} mutation(s)`);
  console.log(`ORDER_EDIT_MUTATION_GATE exit=0 mutations=${mutations.length} rejected=${mutations.length}`);
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
