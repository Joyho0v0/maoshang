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
    expectedFailure: 'EXTERNAL_LINE_ID',
    mutate(value) {
      const entry = value.orderEditRehearsal.cases.find((candidate) => candidate.name === 'externalLineId');
      entry.expectedOutcome = 'COMMIT';
    },
  },
  {
    name: 'cross-currency-source-mismatch',
    expectedFailure: 'FX_CURRENCY_MISMATCH',
    mutate(value) {
      const entry = value.orderEditRehearsal.cases.find((candidate) => candidate.name === 'crossCurrency');
      entry.policyCurrency = 'EUR';
      entry.fx.baseCurrency = 'JPY';
    },
  },
  {
    name: 'lock-stage-race',
    expectedFailure: 'LATE_STAGE',
    mutate(value) {
      const entry = value.orderEditRehearsal.cases.find((candidate) => candidate.name === 'omissionRemove');
      entry.lockState = { stage: 'DEPOSIT_PENDING' };
    },
  },
  {
    name: 'lock-terminal-race',
    expectedFailure: 'TERMINAL',
    mutate(value) {
      const entry = value.orderEditRehearsal.cases.find((candidate) => candidate.name === 'omissionRemove');
      entry.lockState = { status: 'CANCELLED' };
    },
  },
  {
    name: 'expected-price-oracle',
    mutate(value) {
      const entry = value.orderEditRehearsal.cases.find((candidate) => candidate.name === 'omissionRemove');
      entry.expectedPrice = '77.0000';
    },
  },
  {
    name: 'missing-policy-fact',
    expectedFailure: 'POLICY_FACT_MISSING',
    mutate(value) {
      const entry = value.orderEditRehearsal.cases.find((candidate) => candidate.name === 'omissionRemove');
      delete entry.policyUnitPrice;
    },
  },
  {
    name: 'generated-line-id-collision',
    expectedFailure: 'LINE_ID_COLLISION',
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
    if (mutation.expectedFailure && !`${result.stdout}${result.stderr}`.includes(`actualFailure=${mutation.expectedFailure}`)) {
      throw new Error(`${mutation.name} did not expose ${mutation.expectedFailure}: ${result.stdout}${result.stderr}`);
    }
  }
  assert(accepted === 0, `order edit rehearsal accepted ${accepted}/${mutations.length} mutation(s)`);
  console.log(`ORDER_EDIT_MUTATION_GATE exit=0 mutations=${mutations.length} rejected=${mutations.length}`);
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
