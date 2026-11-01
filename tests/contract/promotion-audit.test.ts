import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';

const oldPromotionDirectory = 'packages/contracts/openapi/audit/baseline-promotions/2026-10-29-joint-contract-v1';
const currentPromotionDirectory = 'packages/contracts/openapi/audit/baseline-promotions/2026-10-30-session-identity';
const liveInventoryPath = new URL('../../packages/contracts/openapi/breaking-inventory.json', import.meta.url);
const liveDecisionsPath = new URL('../../packages/contracts/openapi/breaking-decisions.json', import.meta.url);

type InventoryEntry = {
  id: string;
  jsonPath: string;
  verification: { comparatorIdentity: string; affectedPathGroupId: string };
  oldValue: { sha256: string };
  newValue: { sha256: string };
};

type Inventory = {
  baseline: { revision?: string; digest: string };
  candidate: { revision?: string; sha256: string };
  comparator: { revision: string; sourceSha256: string };
  generator: { revision: string; sourceSha256: string };
  count: number;
  entries: InventoryEntry[];
  affectedPathGroups: Record<string, string[]>;
  valueStore: Record<string, unknown>;
};

type Decision = {
  decision?: string;
  disposition?: string;
  promotionAuthorized: boolean;
  owner: string[];
  evidence: string[];
  inventoryId?: string;
  exactComparatorIdentity?: string;
};

type DecisionManifest = {
  decisions: Record<string, Decision>;
  inventoryDigest: string;
};

function sha256(content: Uint8Array): string {
  return createHash('sha256').update(content).digest('hex');
}

function repositoryFile(relativePath: string): URL {
  return new URL(`../../${relativePath}`, import.meta.url);
}

function gitFile(revision: string, relativePath: string): Buffer {
  return execFileSync('git', ['show', `${revision}:${relativePath}`]);
}

function identitySet(inventory: Inventory): Set<string> {
  return new Set(inventory.entries.map((entry) => entry.verification.comparatorIdentity));
}

function isAcceptedDecision(decision: Decision): boolean {
  return (decision.decision ?? decision.disposition) === 'accept-semantic-direction';
}

it('keeps the original 2026-10-29 promotion audit immutable and identity-complete', async () => {
  const recordPath = repositoryFile(`${oldPromotionDirectory}/promotion-record.json`);
  const recordRaw = await readFile(recordPath);
  const record = JSON.parse(recordRaw.toString('utf8')) as {
    formatVersion: number;
    recordType: string;
    status: string;
    sourceRevisions: Record<string, string>;
    baselineTransition: Record<string, string>;
    archive: {
      directory: string;
      baseline: { sha256: string };
      inventory: { sha256: string; count: number; uniqueIdentityCount: number };
      decisions: { sha256: string; acceptSemanticDirectionCount: number; rejectCount: number; pendingCount: number; promotionAuthorizedFalseCount: number; promotionAuthorizedTrueCount: number };
      dispositionPackage: { sha256: string; identityCount: number; orphanCount: number; duplicateCount: number; mismatchCount: number };
    };
    sourceProvenance: {
      comparator: { revision: string; sourceSha256: string };
      generator: { revision: string; sourceSha256: string };
      contentIdentity: { revision: string; sourceSha256: string };
      generatedTypesSha256: string;
      generatedClientSha256: string;
    };
  };
  expect(record).toMatchObject({ formatVersion: 1, recordType: 'openapi-baseline-promotion', status: 'implemented-awaiting-independent-acceptance' });
  expect(record.sourceRevisions).toEqual({
    gateC2InputHead: '6a32eab7afdf1241fe8b2135d971d960057d9ac5',
    exactBase: 'b06da0b024e2555a98a2c370c5fdf3195d45d591',
    decisionManifest: 'f342f1567518921cb0e337a4522306dd93cebad4',
    candidateContent: 'a8f0d37a615e2338de4774d8d13f7498b49aa9b8',
    promotionMechanism: 'fdc718a95301f884bb4101c1e78c57051d71c91c',
    baselinePromotion: 'f9c8325b89854d88579c6bebab73dc60cc90a8e9',
    contentIdentityFastPath: '9ba22dddd4ffd8e04cc99339398a9d445854a8ad',
  });
  expect(record.baselineTransition).toEqual({
    baselinePath: 'packages/contracts/openapi/openapi.baseline.yaml',
    fromSha256: '9fb299cb04ade8674e2819fb00768b6689a44bebc297175bb52b1eba39b29c25',
    toSha256: '149e4bbde325ec8ceb4dad3f550af1fa75c2a98dcf8ea882de4f41215b057984',
    candidatePath: 'packages/contracts/openapi/openapi.yaml',
    candidateSha256: '149e4bbde325ec8ceb4dad3f550af1fa75c2a98dcf8ea882de4f41215b057984',
  });
  expect(record.archive.directory).toBe(oldPromotionDirectory);

  const [baselineRaw, inventoryRaw, decisionsRaw, dispositionRaw, liveInventoryRaw, liveDecisionsRaw] = await Promise.all([
    readFile(repositoryFile(`${oldPromotionDirectory}/openapi.baseline.before.yaml`)),
    readFile(repositoryFile(`${oldPromotionDirectory}/breaking-inventory.before.json`)),
    readFile(repositoryFile(`${oldPromotionDirectory}/breaking-decisions.before.json`)),
    readFile(repositoryFile(`${oldPromotionDirectory}/contract-disposition-package.json`)),
    readFile(liveInventoryPath),
    readFile(liveDecisionsPath),
  ]);
  const inventory = JSON.parse(inventoryRaw.toString('utf8')) as Inventory;
  const decisions = JSON.parse(decisionsRaw.toString('utf8')) as DecisionManifest;
  const disposition = JSON.parse(dispositionRaw.toString('utf8')) as {
    decisions: Record<string, Decision>;
    evidenceGroups: Record<string, unknown>;
    sourceDecisionCounts: Record<string, number>;
  };

  expect(sha256(recordRaw)).toBe('41dac20d7a5cbd9a023d883a41f97b5aa3eb7b964da8b386b7bf68ddbf76cfaf');
  expect(sha256(baselineRaw)).toBe('9fb299cb04ade8674e2819fb00768b6689a44bebc297175bb52b1eba39b29c25');
  expect(sha256(baselineRaw)).toBe(record.archive.baseline.sha256);
  expect(sha256(inventoryRaw)).toBe('b89df569dad1b68675618c22696ff2177a7710cf0bd3913d9fd5cd06a5332735');
  expect(sha256(decisionsRaw)).toBe('80fce55403521eee5a4bc91be9fad6cc4a66f4651bf663ca1ec5d88675cd063b');
  expect(sha256(dispositionRaw)).toBe('0c82a27e2356fed17dd8c1881b6067b1d9abf8c4334417c6c5419ee00c71a948');
  expect(record.sourceProvenance).toEqual({
    comparator: { revision: '9ba22dddd4ffd8e04cc99339398a9d445854a8ad', sourceSha256: 'c0a911f1ab3284aaad1f74de4af51ffa7de66f5c780e106b0e1fa13636a4c699' },
    generator: { revision: '9ba22dddd4ffd8e04cc99339398a9d445854a8ad', sourceSha256: 'bf20cda8721d728fcdc4391935180c073ab124f656824ca2f4ab5248e6d78bef' },
    contentIdentity: { revision: '9ba22dddd4ffd8e04cc99339398a9d445854a8ad', sourceSha256: 'e8884c903f744151641651aba218acdaa3ced430de5e5a9a33b624cb920bff97' },
    generatedTypesSha256: 'ae349a7f9f81b712bc0ef276a12ff0127ca40db9e83878b64c47fab5e1b5dc16',
    generatedClientSha256: 'd4b5144d568a460a1b0bae89772fd519eb95ef6747d3cb95fa04e6e810907044',
  });
  expect(record.archive.inventory).toMatchObject({ count: 2015, uniqueIdentityCount: 2015, sha256: sha256(inventoryRaw) });
  expect(record.archive.decisions).toMatchObject({
    sha256: sha256(decisionsRaw),
    acceptSemanticDirectionCount: 2015,
    rejectCount: 0,
    pendingCount: 0,
    promotionAuthorizedFalseCount: 2015,
    promotionAuthorizedTrueCount: 0,
  });
  expect(record.archive.dispositionPackage).toMatchObject({
    sha256: sha256(dispositionRaw),
    identityCount: 2015,
    orphanCount: 0,
    duplicateCount: 0,
    mismatchCount: 0,
  });

  expect(inventory.count).toBe(2015);
  expect(inventory.entries).toHaveLength(2015);
  expect(inventory.comparator).toMatchObject({
    revision: 'ed10d42bee6ce0553e659485faf2cbd2a36e2f8c',
    sourceSha256: sha256(gitFile('ed10d42bee6ce0553e659485faf2cbd2a36e2f8c', 'packages/contracts/openapi/breaking-gate.ts')),
  });
  expect(inventory.generator).toMatchObject({
    revision: 'af6429a26f69553962466504095932f5142af395',
    sourceSha256: sha256(gitFile('af6429a26f69553962466504095932f5142af395', 'packages/contracts/openapi/breaking-inventory.ts')),
  });
  expect(new Set(inventory.entries.map((entry) => entry.id))).toEqual(new Set(Array.from({ length: 2015 }, (_, index) => `BRK-${String(index + 1).padStart(3, '0')}`)));
  expect(identitySet(inventory).size).toBe(2015);
  expect(Object.keys(inventory.valueStore).length).toBeGreaterThan(0);
  for (const entry of inventory.entries) {
    expect(sha256(Buffer.from(JSON.stringify(inventory.valueStore[entry.oldValue.sha256])))).toBe(entry.oldValue.sha256);
    expect(sha256(Buffer.from(JSON.stringify(inventory.valueStore[entry.newValue.sha256])))).toBe(entry.newValue.sha256);
    expect(inventory.affectedPathGroups[entry.verification.affectedPathGroupId]).toContain(entry.jsonPath);
  }

  const inventoryIdentities = identitySet(inventory);
  const decisionIdentities = new Set(Object.keys(decisions.decisions));
  const dispositionIdentities = new Set(Object.keys(disposition.decisions));
  const dispositionComparatorIdentities = new Set(Object.values(disposition.decisions).map((decision) => decision.exactComparatorIdentity));
  expect(decisionIdentities).toEqual(inventoryIdentities);
  expect(dispositionIdentities).toEqual(inventoryIdentities);
  expect(dispositionComparatorIdentities).toEqual(inventoryIdentities);
  expect(Object.values(decisions.decisions).every((decision) => isAcceptedDecision(decision) && decision.promotionAuthorized === false && decision.owner.length > 0 && decision.evidence.length > 0)).toBe(true);
  const entryById = new Map(inventory.entries.map((entry) => [entry.id, entry]));
  for (const [identity, decision] of Object.entries(disposition.decisions)) {
    const entry = entryById.get(decision.inventoryId ?? '');
    expect(decision.exactComparatorIdentity).toBe(identity);
    expect(entry?.verification.comparatorIdentity).toBe(identity);
    expect(decisions.decisions[identity]).toBeDefined();
  }
  expect(disposition.sourceDecisionCounts).toEqual({ 'accept-semantic-direction': 26, reject: 4, pending: 1985 });
  expect(liveInventoryRaw.equals(inventoryRaw)).toBe(false);
  expect(liveDecisionsRaw.equals(decisionsRaw)).toBe(false);
});

it('locks the Session promotion provenance to the immutable baseline transition revision', async () => {
  const recordRaw = await readFile(repositoryFile(`${currentPromotionDirectory}/promotion-record.json`));
  const record = JSON.parse(recordRaw.toString('utf8')) as {
    sourceRevisions: { exactBase: string; candidateContent: string; promotionMechanism: string; baselinePromotion: string };
    baselineTransition: { baselinePath: string; fromSha256: string; toSha256: string; candidatePath: string; candidateSha256: string };
    archive: { directory: string; baseline: { path: string; sha256: string }; inventory: { path: string; sha256: string; count: number; uniqueIdentityCount: number }; decisions: { path: string; sha256: string; acceptSemanticDirectionCount: number; promotionAuthorizedFalseCount: number; promotionAuthorizedTrueCount: number }; dispositionPackage: { path: string; sha256: string; identityCount: number; orphanCount: number; duplicateCount: number; mismatchCount: number } };
    liveArtifacts: { inventory: { path: string; sha256: string; count: number }; decisions: { path: string; sha256: string; decisionCount: number } };
    sourceProvenance: {
      comparator: { revision: string; sourceSha256: string };
      generator: { revision: string; sourceSha256: string };
      contentIdentity: { revision: string; sourceSha256: string };
      generatedTypesSha256: string;
      generatedClientSha256: string;
    };
  };
  expect(record.sourceRevisions.candidateContent).toBe('520154f9ec5b6cee864e380fd80826067875da06');
  expect(record.sourceRevisions.promotionMechanism).toBe('406844b3c208c7dda2a4f83fe68d40f407b04d0d');
  expect(record.sourceRevisions.baselinePromotion).toBe('406844b3c208c7dda2a4f83fe68d40f407b04d0d');
  expect(record.archive.directory).toBe(currentPromotionDirectory);

  expect(sha256(gitFile(record.sourceRevisions.candidateContent, record.baselineTransition.candidatePath))).toBe(record.baselineTransition.candidateSha256);
  expect(sha256(gitFile(record.sourceRevisions.baselinePromotion, record.baselineTransition.baselinePath))).toBe(record.baselineTransition.toSha256);
  expect(sha256(gitFile(record.sourceRevisions.exactBase, record.baselineTransition.baselinePath))).toBe(record.baselineTransition.fromSha256);
  expect(sha256(gitFile(record.sourceRevisions.candidateContent, record.baselineTransition.baselinePath))).toBe(record.baselineTransition.fromSha256);

  const [inventoryRaw, decisionsRaw, archiveBaselineRaw, archiveInventoryRaw, archiveDecisionsRaw, dispositionRaw] = await Promise.all([
    readFile(liveInventoryPath),
    readFile(liveDecisionsPath),
    readFile(repositoryFile(`${currentPromotionDirectory}/${record.archive.baseline.path}`)),
    readFile(repositoryFile(`${currentPromotionDirectory}/${record.archive.inventory.path}`)),
    readFile(repositoryFile(`${currentPromotionDirectory}/${record.archive.decisions.path}`)),
    readFile(repositoryFile(`${currentPromotionDirectory}/${record.archive.dispositionPackage.path}`)),
  ]);
  const inventory = JSON.parse(archiveInventoryRaw.toString('utf8')) as Inventory;
  const decisions = JSON.parse(archiveDecisionsRaw.toString('utf8')) as DecisionManifest;
  const disposition = JSON.parse(dispositionRaw.toString('utf8')) as { decisions: Record<string, Decision>; identityCount: number; orphanCount: number; duplicateCount: number; mismatchCount: number };
  const liveInventory = JSON.parse(inventoryRaw.toString('utf8')) as Inventory;
  const liveDecisions = JSON.parse(decisionsRaw.toString('utf8')) as DecisionManifest;

  expect(record.sourceProvenance.comparator).toEqual({
    revision: inventory.comparator.revision,
    sourceSha256: sha256(gitFile(inventory.comparator.revision, 'packages/contracts/openapi/breaking-gate.ts')),
  });
  expect(record.sourceProvenance.generator).toEqual({
    revision: inventory.generator.revision,
    sourceSha256: sha256(gitFile(inventory.generator.revision, 'packages/contracts/openapi/breaking-inventory.ts')),
  });
  expect(record.sourceProvenance.contentIdentity).toEqual({
    revision: '9ba22dddd4ffd8e04cc99339398a9d445854a8ad',
    sourceSha256: sha256(gitFile('9ba22dddd4ffd8e04cc99339398a9d445854a8ad', 'packages/contracts/openapi/content-identity.ts')),
  });
  expect(record.sourceProvenance.generatedTypesSha256).toBe('ea9e00ccb78daf8ec8121e2a4e6fe12859beceb20992c764dccc2d74d089944a');
  expect(record.sourceProvenance.generatedClientSha256).toBe('d4b5144d568a460a1b0bae89772fd519eb95ef6747d3cb95fa04e6e810907044');
  expect(record.baselineTransition).toMatchObject({
    baselinePath: 'packages/contracts/openapi/openapi.baseline.yaml',
    candidatePath: 'packages/contracts/openapi/openapi.yaml',
  });
  expect(record.archive.baseline.sha256).toBe(sha256(archiveBaselineRaw));
  expect(record.archive.inventory).toMatchObject({ sha256: sha256(archiveInventoryRaw), count: 12, uniqueIdentityCount: 12 });
  expect(record.archive.decisions).toMatchObject({ sha256: sha256(archiveDecisionsRaw), acceptSemanticDirectionCount: 12, promotionAuthorizedFalseCount: 12, promotionAuthorizedTrueCount: 0 });
  expect(record.archive.dispositionPackage).toMatchObject({ sha256: sha256(dispositionRaw), identityCount: 12, orphanCount: 0, duplicateCount: 0, mismatchCount: 0 });
  expect(record.liveArtifacts.inventory).toMatchObject({ path: 'packages/contracts/openapi/breaking-inventory.json', sha256: sha256(inventoryRaw), count: 0 });
  expect(record.liveArtifacts.decisions).toMatchObject({ path: 'packages/contracts/openapi/breaking-decisions.json', sha256: sha256(decisionsRaw), decisionCount: 0 });
  expect(liveInventory.baseline.revision).toBe(record.sourceRevisions.baselinePromotion);
  expect(liveInventory.candidate.revision).toBe(record.sourceRevisions.candidateContent);
  expect(liveInventory.count).toBe(0);
  expect(Object.keys(liveDecisions.decisions)).toHaveLength(0);

  expect(inventory.count).toBe(12);
  expect(inventory.entries).toHaveLength(12);
  expect(identitySet(inventory).size).toBe(12);
  const inventoryIdentities = identitySet(inventory);
  expect(new Set(Object.keys(decisions.decisions))).toEqual(inventoryIdentities);
  expect(new Set(Object.keys(disposition.decisions))).toEqual(inventoryIdentities);
  expect(new Set(Object.values(disposition.decisions).map((decision) => decision.exactComparatorIdentity))).toEqual(inventoryIdentities);
  expect(Object.values(decisions.decisions).every((decision) => isAcceptedDecision(decision) && decision.promotionAuthorized === false)).toBe(true);
  const entryById = new Map(inventory.entries.map((entry) => [entry.id, entry]));
  for (const [identity, decision] of Object.entries(disposition.decisions)) {
    const entry = entryById.get(decision.inventoryId ?? '');
    expect(decision.exactComparatorIdentity).toBe(identity);
    expect(entry?.verification.comparatorIdentity).toBe(identity);
    expect(decisions.decisions[identity]?.inventoryId).toBe(decision.inventoryId);
  }
});
