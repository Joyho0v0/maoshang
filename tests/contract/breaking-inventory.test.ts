import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';
import { collectBreakingInventory, createContentAddressedValueStore, normalizeDocument, runBreakingInventory } from '../../packages/contracts/openapi/breaking-inventory.js';
import { collectBreakingChanges } from '../../packages/contracts/openapi/breaking-gate.js';
import {
  ContentIdentityError,
  analyzeContentIdentity,
  finalizeComparisonEvidence,
} from '../../packages/contracts/openapi/content-identity.js';

const liveInventoryPath = new URL('../../packages/contracts/openapi/breaking-inventory.json', import.meta.url);
const liveDecisionsPath = new URL('../../packages/contracts/openapi/breaking-decisions.json', import.meta.url);
const promotionRecordPath = new URL('../../packages/contracts/openapi/audit/baseline-promotions/2026-10-29-joint-contract-v1/promotion-record.json', import.meta.url);
const archiveDirectory = new URL('../../packages/contracts/openapi/audit/baseline-promotions/2026-10-29-joint-contract-v1/', import.meta.url);

type SourceProvenance = {
  revision: string;
  sourceSha256: string;
};

type CommandProvenance = SourceProvenance & {
  command: string;
};

type InventoryEntry = {
  id: string;
  jsonPath: string;
  reason: string;
  ownership: { decisionOwner: string[] };
  disposition: { status: string; action: string };
  authorization: { requiredApprovers: string[] };
  verification: {
    evidence: string[];
    affectedPaths: string[];
    affectedPathGroupId: string;
    comparatorIdentity: string;
  };
  oldValue: { sha256: string };
  newValue: { sha256: string };
};

type InventoryDocument = {
  formatVersion: number;
  purpose: string;
  baseline: { revision: string; digest: string; path: string };
  candidate: {
    revision: string;
    sha256: string;
    generatedSha256: string;
    generatedClientSha256: string;
    path: string;
  };
  comparator: CommandProvenance;
  generator: CommandProvenance;
  contentIdentity: SourceProvenance | null;
  comparison: {
    mode: string;
    comparatorExecuted: boolean;
    baseline: { sha256: string; byteLength: number };
    candidate: { sha256: string; byteLength: number };
    bytesEqual: boolean;
    referenceClosure: { policy: string; result: string; violationKinds: string[] };
    shortcutReason: string;
  } | null;
  count: number;
  inventoryMethod: string;
  promotionStatus: string;
  affectedPathGroups: Record<string, string[]>;
  valueStore: Record<string, unknown>;
  entries: InventoryEntry[];
};

type LiveInventoryDocument = Omit<InventoryDocument, 'contentIdentity' | 'comparison'> & {
  contentIdentity: SourceProvenance;
  comparison: NonNullable<InventoryDocument['comparison']>;
};

type ManifestDecision = {
  decision: 'accept-semantic-direction' | 'reject' | 'pending';
  owner: string[];
  evidence: string[];
  promotionAuthorized: boolean;
};

type DecisionManifest = {
  formatVersion: number;
  baselineDigest: string;
  candidateDigest: string;
  comparatorRevision: string;
  comparatorSourceSha256: string;
  inventoryDigest: string;
  decisions: Record<string, ManifestDecision>;
};

type DispositionDecision = {
  disposition: string;
  evidenceGroup: string;
  exactComparatorIdentity: string;
  explicitRationale: string | null;
  inventoryId: string;
  priorDisposition: string;
  promotionAuthorized: boolean;
};

type DispositionPackage = {
  packageType: string;
  semanticDisposition: string;
  status: string;
  decisions: Record<string, DispositionDecision>;
  evidenceGroups: Record<string, unknown>;
  sourceDecisionCounts: {
    'accept-semantic-direction': number;
    reject: number;
    pending: number;
  };
  gates: Record<string, string>;
};

const expectedPromotionRecord = {
  formatVersion: 1,
  recordType: 'openapi-baseline-promotion',
  status: 'implemented-awaiting-independent-acceptance',
  sourceRevisions: {
    gateC2InputHead: '6a32eab7afdf1241fe8b2135d971d960057d9ac5',
    exactBase: 'b06da0b024e2555a98a2c370c5fdf3195d45d591',
    decisionManifest: 'f342f1567518921cb0e337a4522306dd93cebad4',
    candidateContent: 'a8f0d37a615e2338de4774d8d13f7498b49aa9b8',
    promotionMechanism: 'fdc718a95301f884bb4101c1e78c57051d71c91c',
    baselinePromotion: 'f9c8325b89854d88579c6bebab73dc60cc90a8e9',
    contentIdentityFastPath: '9ba22dddd4ffd8e04cc99339398a9d445854a8ad',
  },
  baselineTransition: {
    baselinePath: 'packages/contracts/openapi/openapi.baseline.yaml',
    fromSha256: '9fb299cb04ade8674e2819fb00768b6689a44bebc297175bb52b1eba39b29c25',
    toSha256: '149e4bbde325ec8ceb4dad3f550af1fa75c2a98dcf8ea882de4f41215b057984',
    candidatePath: 'packages/contracts/openapi/openapi.yaml',
    candidateSha256: '149e4bbde325ec8ceb4dad3f550af1fa75c2a98dcf8ea882de4f41215b057984',
  },
  liveArtifacts: {
    inventory: {
      path: 'packages/contracts/openapi/breaking-inventory.json',
      formatVersion: 3,
      sha256: '88282c07f858d7fb3fe25130ed9c2786774813ab6cf9e411b5f3da6f4387fa2c',
      byteLength: 2376,
      count: 0,
    },
    decisions: {
      path: 'packages/contracts/openapi/breaking-decisions.json',
      formatVersion: 1,
      sha256: 'c775b0a7973b6f57bfb704715165e006e63aaff0f02361f70f7535c563985e59',
      byteLength: 444,
      decisionCount: 0,
    },
  },
  archive: {
    directory: 'packages/contracts/openapi/audit/baseline-promotions/2026-10-29-joint-contract-v1',
    baseline: {
      path: 'openapi.baseline.before.yaml',
      sha256: '9fb299cb04ade8674e2819fb00768b6689a44bebc297175bb52b1eba39b29c25',
    },
    inventory: {
      path: 'breaking-inventory.before.json',
      sha256: 'b89df569dad1b68675618c22696ff2177a7710cf0bd3913d9fd5cd06a5332735',
      count: 2015,
      uniqueIdentityCount: 2015,
    },
    decisions: {
      path: 'breaking-decisions.before.json',
      sha256: '80fce55403521eee5a4bc91be9fad6cc4a66f4651bf663ca1ec5d88675cd063b',
      acceptSemanticDirectionCount: 2015,
      rejectCount: 0,
      pendingCount: 0,
      promotionAuthorizedFalseCount: 2015,
      promotionAuthorizedTrueCount: 0,
    },
    dispositionPackage: {
      path: 'contract-disposition-package.json',
      sha256: '0c82a27e2356fed17dd8c1881b6067b1d9abf8c4334417c6c5419ee00c71a948',
      identityCount: 2015,
      orphanCount: 0,
      duplicateCount: 0,
      mismatchCount: 0,
    },
  },
  sourceProvenance: {
    comparator: {
      revision: '9ba22dddd4ffd8e04cc99339398a9d445854a8ad',
      sourceSha256: 'c0a911f1ab3284aaad1f74de4af51ffa7de66f5c780e106b0e1fa13636a4c699',
    },
    generator: {
      revision: '9ba22dddd4ffd8e04cc99339398a9d445854a8ad',
      sourceSha256: 'bf20cda8721d728fcdc4391935180c073ab124f656824ca2f4ab5248e6d78bef',
    },
    contentIdentity: {
      revision: '9ba22dddd4ffd8e04cc99339398a9d445854a8ad',
      sourceSha256: 'e8884c903f744151641651aba218acdaa3ced430de5e5a9a33b624cb920bff97',
    },
    generatedTypesSha256: 'ae349a7f9f81b712bc0ef276a12ff0127ca40db9e83878b64c47fab5e1b5dc16',
    generatedClientSha256: 'd4b5144d568a460a1b0bae89772fd519eb95ef6747d3cb95fa04e6e810907044',
  },
  evidence: {
    semanticDispositionCommentId: '01a18410-56e1-7b83-b2b2-ec9c7e8e1976',
    dispositionAttachmentId: '01a18410-5580-7ed1-b912-acc7971f3dd7',
    qaCommentId: '01a18668-a201-7c33-81bb-3b360ae61f31',
    leaderFreezeCommentId: '01a1866c-1c7e-70e3-b8b3-c2a9e1f1f468',
    gateC2DecisionCommentId: '01a18678-bd26-7c47-91a0-fb48b58b4794',
    p2aReviewCommentId: '01a18b1a-70a4-7414-a59b-67b781a63036',
    boundaryDecisionCommentId: '01a18b27-1593-714d-8a89-f80346c8dfdc',
  },
  gates: {
    contractPromotionDoesNotAuthorizeRuntime: true,
    runtime: 'closed',
    liveApi: 'closed',
    databaseMigration: 'closed',
    deployment: 'closed',
    adrAcceptance: 'pending-review-qa-leader-completion',
  },
} as const;

it('keeps canonical live zero-diff inventory, decisions, and promotion record auditable', async () => {
  const [inventoryRaw, decisionsRaw, recordRaw] = await Promise.all([
    readFile(liveInventoryPath),
    readFile(liveDecisionsPath),
    readFile(promotionRecordPath),
  ]);
  const persisted = JSON.parse(inventoryRaw.toString('utf8')) as LiveInventoryDocument;
  const manifest = JSON.parse(decisionsRaw.toString('utf8')) as DecisionManifest;
  const promotionRecord = JSON.parse(recordRaw.toString('utf8')) as typeof expectedPromotionRecord;

  expect(inventoryRaw.byteLength).toBe(2376);
  expect(createHash('sha256').update(inventoryRaw).digest('hex')).toBe('88282c07f858d7fb3fe25130ed9c2786774813ab6cf9e411b5f3da6f4387fa2c');
  expect(inventoryRaw.subarray(-1)[0]).toBe(10);
  expect(inventoryRaw.toString('utf8')).toBe(`${JSON.stringify(persisted)}\n`);
  expect(Object.keys(persisted)).toEqual([
    'formatVersion', 'purpose', 'baseline', 'candidate', 'comparator', 'generator',
    'contentIdentity', 'comparison', 'count', 'inventoryMethod', 'promotionStatus',
    'affectedPathGroups', 'valueStore', 'entries',
  ]);
  expect(persisted.formatVersion).toBe(3);
  expect(persisted.purpose).toBe('Complete structured audit inventory for the candidate against the approved OpenAPI baseline.');
  expect(persisted.baseline).toEqual({
    revision: 'f9c8325b89854d88579c6bebab73dc60cc90a8e9',
    digest: '149e4bbde325ec8ceb4dad3f550af1fa75c2a98dcf8ea882de4f41215b057984',
    path: 'packages/contracts/openapi/openapi.baseline.yaml',
  });
  expect(persisted.candidate).toEqual({
    revision: 'a8f0d37a615e2338de4774d8d13f7498b49aa9b8',
    sha256: '149e4bbde325ec8ceb4dad3f550af1fa75c2a98dcf8ea882de4f41215b057984',
    generatedSha256: 'ae349a7f9f81b712bc0ef276a12ff0127ca40db9e83878b64c47fab5e1b5dc16',
    generatedClientSha256: 'd4b5144d568a460a1b0bae89772fd519eb95ef6747d3cb95fa04e6e810907044',
    path: 'packages/contracts/openapi/openapi.yaml',
  });
  expect(Object.keys(persisted.baseline)).toEqual(['revision', 'digest', 'path']);
  expect(Object.keys(persisted.candidate)).toEqual(['revision', 'sha256', 'generatedSha256', 'generatedClientSha256', 'path']);
  expect(persisted.comparator).toEqual({
    revision: '9ba22dddd4ffd8e04cc99339398a9d445854a8ad',
    sourceSha256: 'c0a911f1ab3284aaad1f74de4af51ffa7de66f5c780e106b0e1fa13636a4c699',
    command: 'npm run contract:breaking -- packages/contracts/openapi/openapi.baseline.yaml packages/contracts/openapi/openapi.yaml [sourceRevision=9ba22dddd4ffd8e04cc99339398a9d445854a8ad]',
  });
  expect(Object.keys(persisted.comparator)).toEqual(['revision', 'sourceSha256', 'command']);
  expect(persisted.generator).toEqual({
    revision: '9ba22dddd4ffd8e04cc99339398a9d445854a8ad',
    sourceSha256: 'bf20cda8721d728fcdc4391935180c073ab124f656824ca2f4ab5248e6d78bef',
    command: 'npm run contract:breaking:inventory -- packages/contracts/openapi/openapi.baseline.yaml packages/contracts/openapi/openapi.yaml [sourceRevision=9ba22dddd4ffd8e04cc99339398a9d445854a8ad]',
  });
  expect(Object.keys(persisted.generator)).toEqual(['revision', 'sourceSha256', 'command']);
  expect(persisted.contentIdentity).toEqual({
    revision: '9ba22dddd4ffd8e04cc99339398a9d445854a8ad',
    sourceSha256: 'e8884c903f744151641651aba218acdaa3ced430de5e5a9a33b624cb920bff97',
  });
  expect(Object.keys(persisted.contentIdentity)).toEqual(['revision', 'sourceSha256']);
  expect(Object.keys(persisted.comparison)).toEqual(['mode', 'comparatorExecuted', 'baseline', 'candidate', 'bytesEqual', 'referenceClosure', 'shortcutReason']);
  expect(persisted.comparison).toEqual({
    mode: 'content-identity',
    comparatorExecuted: false,
    baseline: { sha256: persisted.baseline.digest, byteLength: 137931 },
    candidate: { sha256: persisted.candidate.sha256, byteLength: 137931 },
    bytesEqual: true,
    referenceClosure: {
      policy: 'all-$ref-and-$dynamicRef-values-are-string-local-fragments',
      result: 'local-only',
      violationKinds: [],
    },
    shortcutReason: 'identical-bytes-local-reference-closure',
  });
  expect(Object.keys(persisted.comparison.baseline)).toEqual(['sha256', 'byteLength']);
  expect(Object.keys(persisted.comparison.candidate)).toEqual(['sha256', 'byteLength']);
  expect(Object.keys(persisted.comparison.referenceClosure)).toEqual(['policy', 'result', 'violationKinds']);
  expect(persisted.count).toBe(0);
  expect(persisted.inventoryMethod).toBe('Content identity: raw baseline and candidate bytes are equal and every $ref/$dynamicRef value is a string beginning with "#"; normalization, Swagger dereference, and the semantic comparator were not executed.');
  expect(persisted.promotionStatus).toBe('current/approved-zero-diff');
  expect(persisted.affectedPathGroups).toEqual({});
  expect(persisted.valueStore).toEqual({});
  expect(persisted.entries).toEqual([]);

  expect(decisionsRaw.byteLength).toBe(444);
  expect(createHash('sha256').update(decisionsRaw).digest('hex')).toBe('c775b0a7973b6f57bfb704715165e006e63aaff0f02361f70f7535c563985e59');
  expect(decisionsRaw.subarray(-1)[0]).not.toBe(10);
  expect(decisionsRaw.toString('utf8')).toBe(JSON.stringify(manifest));
  expect(Object.keys(manifest)).toEqual([
    'formatVersion', 'baselineDigest', 'candidateDigest', 'comparatorRevision',
    'comparatorSourceSha256', 'inventoryDigest', 'decisions',
  ]);
  expect(manifest).toEqual({
    formatVersion: 1,
    baselineDigest: persisted.baseline.digest,
    candidateDigest: persisted.candidate.sha256,
    comparatorRevision: persisted.comparator.revision,
    comparatorSourceSha256: persisted.comparator.sourceSha256,
    inventoryDigest: createHash('sha256').update(inventoryRaw).digest('hex'),
    decisions: {},
  });

  expect(recordRaw.byteLength).toBe(4195);
  expect(createHash('sha256').update(recordRaw).digest('hex')).toBe('41dac20d7a5cbd9a023d883a41f97b5aa3eb7b964da8b386b7bf68ddbf76cfaf');
  expect(recordRaw.subarray(-1)[0]).toBe(10);
  expect(recordRaw.toString('utf8')).toBe(`${JSON.stringify(promotionRecord, null, 2)}\n`);
  expect(Object.keys(promotionRecord)).toEqual([
    'formatVersion', 'recordType', 'status', 'sourceRevisions', 'baselineTransition',
    'liveArtifacts', 'archive', 'sourceProvenance', 'evidence', 'gates',
  ]);
  expect(Object.keys(promotionRecord.sourceRevisions)).toEqual([
    'gateC2InputHead', 'exactBase', 'decisionManifest', 'candidateContent',
    'promotionMechanism', 'baselinePromotion', 'contentIdentityFastPath',
  ]);
  expect(Object.keys(promotionRecord.baselineTransition)).toEqual(['baselinePath', 'fromSha256', 'toSha256', 'candidatePath', 'candidateSha256']);
  expect(Object.keys(promotionRecord.liveArtifacts)).toEqual(['inventory', 'decisions']);
  expect(Object.keys(promotionRecord.liveArtifacts.inventory)).toEqual(['path', 'formatVersion', 'sha256', 'byteLength', 'count']);
  expect(Object.keys(promotionRecord.liveArtifacts.decisions)).toEqual(['path', 'formatVersion', 'sha256', 'byteLength', 'decisionCount']);
  expect(Object.keys(promotionRecord.archive)).toEqual(['directory', 'baseline', 'inventory', 'decisions', 'dispositionPackage']);
  expect(Object.keys(promotionRecord.archive.baseline)).toEqual(['path', 'sha256']);
  expect(Object.keys(promotionRecord.archive.inventory)).toEqual(['path', 'sha256', 'count', 'uniqueIdentityCount']);
  expect(Object.keys(promotionRecord.archive.decisions)).toEqual([
    'path', 'sha256', 'acceptSemanticDirectionCount', 'rejectCount', 'pendingCount',
    'promotionAuthorizedFalseCount', 'promotionAuthorizedTrueCount',
  ]);
  expect(Object.keys(promotionRecord.archive.dispositionPackage)).toEqual(['path', 'sha256', 'identityCount', 'orphanCount', 'duplicateCount', 'mismatchCount']);
  expect(Object.keys(promotionRecord.sourceProvenance)).toEqual(['comparator', 'generator', 'contentIdentity', 'generatedTypesSha256', 'generatedClientSha256']);
  expect(Object.keys(promotionRecord.sourceProvenance.comparator)).toEqual(['revision', 'sourceSha256']);
  expect(Object.keys(promotionRecord.sourceProvenance.generator)).toEqual(['revision', 'sourceSha256']);
  expect(Object.keys(promotionRecord.sourceProvenance.contentIdentity)).toEqual(['revision', 'sourceSha256']);
  expect(Object.keys(promotionRecord.evidence)).toEqual([
    'semanticDispositionCommentId', 'dispositionAttachmentId', 'qaCommentId',
    'leaderFreezeCommentId', 'gateC2DecisionCommentId', 'p2aReviewCommentId',
    'boundaryDecisionCommentId',
  ]);
  expect(Object.keys(promotionRecord.gates)).toEqual([
    'contractPromotionDoesNotAuthorizeRuntime', 'runtime', 'liveApi',
    'databaseMigration', 'deployment', 'adrAcceptance',
  ]);
  expect(promotionRecord.status).toBe('implemented-awaiting-independent-acceptance');
  expect(promotionRecord.evidence.boundaryDecisionCommentId).toBe('01a18b27-1593-714d-8a89-f80346c8dfdc');
  expect(promotionRecord.liveArtifacts.inventory).toEqual({
    path: 'packages/contracts/openapi/breaking-inventory.json',
    formatVersion: 3,
    sha256: createHash('sha256').update(inventoryRaw).digest('hex'),
    byteLength: inventoryRaw.byteLength,
    count: persisted.count,
  });
  expect(promotionRecord.liveArtifacts.decisions).toEqual({
    path: 'packages/contracts/openapi/breaking-decisions.json',
    formatVersion: 1,
    sha256: createHash('sha256').update(decisionsRaw).digest('hex'),
    byteLength: decisionsRaw.byteLength,
    decisionCount: Object.keys(manifest.decisions).length,
  });
  expect(promotionRecord).toEqual(expectedPromotionRecord);
});

it('keeps immutable pre-promotion inventory, decisions, and disposition evidence complete', async () => {
  const archiveBaselineRaw = await readFile(new URL('openapi.baseline.before.yaml', archiveDirectory));
  const archiveInventoryRaw = await readFile(new URL('breaking-inventory.before.json', archiveDirectory));
  const archiveDecisionsRaw = await readFile(new URL('breaking-decisions.before.json', archiveDirectory));
  const dispositionRaw = await readFile(new URL('contract-disposition-package.json', archiveDirectory));
  const archiveInventory = JSON.parse(archiveInventoryRaw.toString('utf8')) as InventoryDocument;
  const archiveDecisions = JSON.parse(archiveDecisionsRaw.toString('utf8')) as DecisionManifest;
  const disposition = JSON.parse(dispositionRaw.toString('utf8')) as DispositionPackage;

  const archiveBaselineDigest = createHash('sha256').update(archiveBaselineRaw).digest('hex');
  expect(archiveBaselineDigest).toBe('9fb299cb04ade8674e2819fb00768b6689a44bebc297175bb52b1eba39b29c25');
  expect(archiveBaselineDigest).toBe(expectedPromotionRecord.archive.baseline.sha256);
  expect(archiveBaselineDigest).toBe(archiveInventory.baseline.digest);
  expect(createHash('sha256').update(archiveInventoryRaw).digest('hex')).toBe('b89df569dad1b68675618c22696ff2177a7710cf0bd3913d9fd5cd06a5332735');
  expect(createHash('sha256').update(archiveDecisionsRaw).digest('hex')).toBe('80fce55403521eee5a4bc91be9fad6cc4a66f4651bf663ca1ec5d88675cd063b');
  expect(createHash('sha256').update(dispositionRaw).digest('hex')).toBe('0c82a27e2356fed17dd8c1881b6067b1d9abf8c4334417c6c5419ee00c71a948');
  expect(archiveInventory.formatVersion).toBe(2);
  expect(archiveInventory.count).toBe(2015);
  expect(archiveInventory.baseline.digest).toBe('9fb299cb04ade8674e2819fb00768b6689a44bebc297175bb52b1eba39b29c25');
  expect(archiveInventory.entries).toHaveLength(2015);
  expect(new Set(archiveInventory.entries.map((entry: InventoryEntry) => entry.jsonPath)).size).toBe(2015);
  expect(new Set(archiveInventory.entries.map((entry: InventoryEntry) => entry.verification.comparatorIdentity)).size).toBe(2015);
  expect(archiveInventory.entries.map((entry: InventoryEntry) => entry.id)).toEqual(Array.from({ length: 2015 }, (_, index) => `BRK-${String(index + 1).padStart(3, '0')}`));
  expect(archiveInventory.entries.some((entry: InventoryEntry) => entry.jsonPath.startsWith('root.paths./auth/sessions.post.responses.403'))).toBe(true);
  expect(archiveInventory.entries.some((entry: InventoryEntry) => entry.jsonPath.startsWith('root.paths./users/{id}.get.responses.200.content.application/json.schema.href'))).toBe(true);
  expect(archiveInventory.entries.some((entry: InventoryEntry) => entry.jsonPath.startsWith('root.paths./users/{id}.get.responses.404'))).toBe(true);
  expect(archiveInventory.entries.some((entry: InventoryEntry) => entry.jsonPath.startsWith('root.paths./organizations/{id}/users.post.responses.202'))).toBe(true);
  expect(Object.keys(archiveInventory.affectedPathGroups).length).toBeGreaterThan(0);
  expect(Object.values(archiveInventory.affectedPathGroups).some((paths: string[]) => paths.length > 1)).toBe(true);
  expect(Object.keys(archiveInventory.valueStore).length).toBeGreaterThan(0);
  for (const entry of archiveInventory.entries) {
    const oldValue = archiveInventory.valueStore[entry.oldValue.sha256];
    const newValue = archiveInventory.valueStore[entry.newValue.sha256];
    expect(entry.reason.length).toBeGreaterThan(0);
    expect(entry.ownership.decisionOwner.length).toBeGreaterThan(0);
    expect(entry.disposition.status.length).toBeGreaterThan(0);
    expect(entry.disposition.action.length).toBeGreaterThan(0);
    expect(entry.authorization.requiredApprovers.length).toBeGreaterThan(0);
    expect(entry.verification.evidence.length).toBeGreaterThan(0);
    expect(entry.verification.affectedPaths.length).toBeGreaterThan(0);
    expect(entry.oldValue.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(entry.newValue.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(createHash('sha256').update(JSON.stringify(oldValue)).digest('hex')).toBe(entry.oldValue.sha256);
    expect(createHash('sha256').update(JSON.stringify(newValue)).digest('hex')).toBe(entry.newValue.sha256);
    expect(archiveInventory.affectedPathGroups[entry.verification.affectedPathGroupId]).toContain(entry.jsonPath);
  }
  expect(archiveInventory.comparator.revision).toBe('ed10d42bee6ce0553e659485faf2cbd2a36e2f8c');
  expect(archiveInventory.comparator.sourceSha256).toBe(gitSourceDigest(archiveInventory.comparator.revision, 'packages/contracts/openapi/breaking-gate.ts'));
  expect(archiveInventory.comparator.sourceSha256).toBe('17184c65d19a67e240c6d77a02c9d313b1ccbbf0fa8ada046ff686cd0ef3b5ba');
  expect(archiveInventory.comparator.command).toContain(`sourceRevision=${archiveInventory.comparator.revision}`);
  expect(archiveInventory.generator.revision).toBe('af6429a26f69553962466504095932f5142af395');
  expect(archiveInventory.generator.sourceSha256).toBe(gitSourceDigest(archiveInventory.generator.revision, 'packages/contracts/openapi/breaking-inventory.ts'));
  expect(archiveInventory.generator.sourceSha256).toBe('853dd54c49c1f4c37f22e96dc6807fcffe9ea9aff01bd3a0a5bcb54660de0f41');
  expect(archiveInventory.generator.command).toContain(`sourceRevision=${archiveInventory.generator.revision}`);

  expect(archiveDecisions.formatVersion).toBe(1);
  expect(archiveDecisions.baselineDigest).toBe(archiveInventory.baseline.digest);
  expect(archiveDecisions.candidateDigest).toBe(archiveInventory.candidate.sha256);
  expect(archiveDecisions.comparatorRevision).toBe(archiveInventory.comparator.revision);
  expect(archiveDecisions.comparatorSourceSha256).toBe(archiveInventory.comparator.sourceSha256);
  expect(archiveDecisions.inventoryDigest).toBe(createHash('sha256').update(archiveInventoryRaw).digest('hex'));
  const archivedDecisionKeys = Object.keys(archiveDecisions.decisions);
  expect(archivedDecisionKeys).toHaveLength(2015);
  expect(Object.values(archiveDecisions.decisions).filter((decision: ManifestDecision) => decision.decision === 'accept-semantic-direction')).toHaveLength(2015);
  expect(Object.values(archiveDecisions.decisions).filter((decision: ManifestDecision) => decision.decision === 'reject')).toHaveLength(0);
  expect(Object.values(archiveDecisions.decisions).filter((decision: ManifestDecision) => decision.decision === 'pending')).toHaveLength(0);
  expect(Object.values(archiveDecisions.decisions).filter((decision: ManifestDecision) => decision.promotionAuthorized === false)).toHaveLength(2015);
  expect(Object.values(archiveDecisions.decisions).filter((decision: ManifestDecision) => decision.promotionAuthorized === true)).toHaveLength(0);
  expect(Object.values(archiveDecisions.decisions).every((decision: ManifestDecision) => decision.owner.length > 0 && decision.evidence.length > 0)).toBe(true);

  expect(disposition.packageType).toBe('system-contract-disposition');
  expect(disposition.semanticDisposition).toContain('All 2015 exact comparator identities are accepted as the semantic direction');
  expect(disposition.status).toBe('CONDITIONAL PASS');
  expect(Object.keys(disposition.decisions)).toHaveLength(2015);
  expect(Object.keys(disposition.evidenceGroups)).toHaveLength(3);
  expect(disposition.sourceDecisionCounts).toEqual({ 'accept-semantic-direction': 26, reject: 4, pending: 1985 });
  expect(disposition.gates.deployment).toBe('Closed.');
  const inventoryIdentities = new Set(archiveInventory.entries.map((entry: InventoryEntry) => entry.verification.comparatorIdentity));
  const decisionIdentities = new Set(archivedDecisionKeys);
  const packageDecisionEntries = Object.entries(disposition.decisions) as Array<[string, DispositionDecision]>;
  const packageIdentities = new Set(packageDecisionEntries.map(([, decision]) => decision.exactComparatorIdentity));
  const packageKeys = new Set(packageDecisionEntries.map(([identity]) => identity));
  expect(decisionIdentities).toEqual(inventoryIdentities);
  expect(packageIdentities).toEqual(inventoryIdentities);
  expect(packageKeys).toEqual(inventoryIdentities);
  expect(packageKeys.size).toBe(2015);
  expect(new Set(packageDecisionEntries.map(([, decision]) => decision.inventoryId)).size).toBe(2015);
  const entryById = new Map<string, InventoryEntry>(archiveInventory.entries.map((entry: InventoryEntry) => [entry.id, entry]));
  expect(packageDecisionEntries.every(([identity, decision]) => {
    const entry = entryById.get(decision.inventoryId);
    return identity === decision.exactComparatorIdentity
      && entry !== undefined
      && entry.verification.comparatorIdentity === identity;
  })).toBe(true);
  expect(packageDecisionEntries.every(([, decision]) => archiveDecisions.decisions[decision.exactComparatorIdentity] !== undefined)).toBe(true);
  expect((await readFile(liveInventoryPath)).equals(archiveInventoryRaw)).toBe(false);
  expect((await readFile(liveDecisionsPath)).equals(archiveDecisionsRaw)).toBe(false);
  expect(archiveInventoryRaw.equals(await readFile(new URL('breaking-inventory.before.json', archiveDirectory)))).toBe(true);
  expect(archiveDecisionsRaw.equals(await readFile(new URL('breaking-decisions.before.json', archiveDirectory)))).toBe(true);
});

it('keeps live zero-diff decisions in strict one-to-one lockstep with live inventory', async () => {
  const persisted = JSON.parse((await readFile(liveInventoryPath)).toString('utf8')) as LiveInventoryDocument;
  const manifest = JSON.parse((await readFile(liveDecisionsPath)).toString('utf8')) as DecisionManifest;
  const identities = persisted.entries.map((entry: InventoryEntry) => entry.verification.comparatorIdentity);
  expect(persisted.count).toBe(0);
  expect(persisted.entries).toEqual([]);
  expect(Object.keys(manifest.decisions)).toEqual(identities);
  expect(Object.keys(manifest.decisions)).toHaveLength(persisted.count);
  expect(Object.keys(manifest.decisions)).toEqual([]);
});

it('persists raw old/new values from the structured event without lossy summarization', async () => {
  type SyntheticDocument = {
    openapi: string;
    info: { title: string; version: string };
    paths: {
      '/records': {
        get: {
          operationId: string;
          responses: {
            '200': {
              content: {
                'application/json': {
                  schema: { oneOf: Array<{ type: string; required: string[]; properties: Record<string, unknown> }> };
                };
              };
            };
          };
        };
      };
    };
  };
  const baseline: SyntheticDocument = {
    openapi: '3.1.0',
    info: { title: 'Inventory test', version: '1.0.0' },
    paths: {
      '/records': {
        get: {
          operationId: 'getRecords',
          responses: {
            '200': {
              content: {
                'application/json': {
                  schema: { oneOf: [{ type: 'object', required: ['id'], properties: { id: { type: 'string' }, label: { type: 'string' } } }] },
                },
              },
            },
          },
        },
      },
    },
  };
  const candidate = structuredClone(baseline);
  const candidateSchema = candidate.paths['/records'].get.responses['200'].content['application/json'].schema.oneOf[0];
  if (candidateSchema === undefined) throw new Error('synthetic schema branch is missing');
  candidateSchema.required = ['id', 'version'];
  candidateSchema.properties.version = { type: 'integer' };

  const normalizedBaseline = await normalizeDocument(baseline);
  const normalizedCandidate = await normalizeDocument(candidate);
  const rawChanges = collectBreakingChanges(normalizedBaseline, normalizedCandidate);
  const generated = await collectBreakingInventory(baseline, candidate);
  const rawByIdentity = new Map(rawChanges.map((change) => [change.stableIdentity, change]));

  expect(generated.entries).toHaveLength(rawChanges.length);
  for (const entry of generated.entries) {
    const raw = rawByIdentity.get(entry.verification.comparatorIdentity);
    expect(raw, entry.jsonPath).toBeDefined();
    expect(generated.valueStore[entry.oldValue.sha256]).toEqual(raw?.oldValue === undefined ? { present: false } : { present: true, value: raw?.oldValue });
    expect(generated.valueStore[entry.newValue.sha256]).toEqual(raw?.newValue === undefined ? { present: false } : { present: true, value: raw?.newValue });
  }
});

it('keeps undefined distinct from a legitimate present:false raw value', async () => {
  const baseline = {
    openapi: '3.1.0',
    info: { title: 'Sentinel test', version: '1.0.0' },
    paths: {
      '/records': {
        get: {
          operationId: 'getRecords',
          responses: {
            '200': {
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { legacy: { present: false } } },
                },
              },
            },
          },
        },
      },
    },
  };
  const candidate = structuredClone(baseline);
  const sentinelSchema = candidate.paths['/records'].get.responses['200'].content['application/json'].schema as { properties: Record<string, unknown> };
  delete sentinelSchema.properties.legacy;

  const generated = await collectBreakingInventory(baseline, candidate);
  const removed = generated.entries.find((entry) => entry.reason.includes('property legacy was removed.'));
  expect(removed).toBeDefined();
  if (removed === undefined) throw new Error('expected legacy removal');
  expect(generated.valueStore[removed.oldValue.sha256]).toEqual({ present: true, value: { present: false } });
  expect(generated.valueStore[removed.newValue.sha256]).toEqual({ present: false });
  expect(removed.oldValue.sha256).not.toBe(removed.newValue.sha256);
});

it('reuses equal content-address values but rejects same-key different-value collisions', () => {
  const store = createContentAddressedValueStore(() => 'forced-collision');
  const first = store.storeValue({ value: 'same' });
  const second = store.storeValue({ value: 'same' });

  expect(second).toEqual(first);
  expect(Object.keys(store.valueStore)).toEqual(['forced-collision']);
  expect(() => store.storeValue({ value: 'different' })).toThrow(/content-address collision/);
});

it('aggregates shared component paths but keeps equal inline schemas separate', async () => {
  const baseline = {
    openapi: '3.1.0',
    info: { title: 'Source identity test', version: '1.0.0' },
    components: {
      schemas: {
        Shared: { type: 'object', properties: { id: { type: 'string' } } },
      },
    },
    paths: {
      '/shared-a': { get: { operationId: 'getSharedA', responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/Shared' } } } } } } },
      '/shared-b': { get: { operationId: 'getSharedB', responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/Shared' } } } } } } },
      '/inline-a': { get: { operationId: 'getInlineA', responses: { '200': { content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'string' } } } } } } } } },
      '/inline-b': { get: { operationId: 'getInlineB', responses: { '200': { content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'string' } } } } } } } } },
    },
  };
  const candidate = structuredClone(baseline);
  (candidate.components.schemas.Shared as { required?: string[] }).required = ['id'];
  (candidate.paths['/inline-a'].get.responses['200'].content['application/json'].schema as { required?: string[] }).required = ['id'];
  (candidate.paths['/inline-b'].get.responses['200'].content['application/json'].schema as { required?: string[] }).required = ['id'];

  const normalizedBaseline = await normalizeDocument(baseline);
  const normalizedCandidate = await normalizeDocument(candidate);
  const changes = collectBreakingChanges(normalizedBaseline, normalizedCandidate);
  const shared = changes.filter((change) => change.jsonPath.includes('/shared-') || change.jsonPath.includes('components.schemas.Shared'));
  const inlineA = changes.find((change) => change.jsonPath.includes('/inline-a'));
  const inlineB = changes.find((change) => change.jsonPath.includes('/inline-b'));
  expect(shared.some((change) => change.affectedPaths.some((path) => path.includes('/shared-a')) && change.affectedPaths.some((path) => path.includes('/shared-b')))).toBe(true);
  expect(inlineA?.affectedPaths).toEqual(['root.paths./inline-a.get.responses.200.content.application/json.schema.id.required']);
  expect(inlineB?.affectedPaths).toEqual(['root.paths./inline-b.get.responses.200.content.application/json.schema.id.required']);
});

it('preserves provenance through derived allOf property merges and isolates equal inline origins', async () => {
  const makeSchema = (idConst: string) => ({
    allOf: [
      { type: 'object', properties: { id: { type: 'string' } } },
      { type: 'object', properties: { id: { const: idConst } } },
    ],
  });
  const baseline = {
    openapi: '3.1.0',
    info: { title: 'Derived provenance test', version: '1.0.0' },
    paths: {
      '/inline-a': { get: { operationId: 'getInlineA', responses: { '200': { content: { 'application/json': { schema: makeSchema('A') } } } } } },
      '/inline-b': { get: { operationId: 'getInlineB', responses: { '200': { content: { 'application/json': { schema: makeSchema('A') } } } } } },
    },
  };
  const candidate = structuredClone(baseline);
  candidate.paths['/inline-a']!.get.responses['200'].content['application/json'].schema.allOf[1]!.properties.id.const = 'B';
  candidate.paths['/inline-b']!.get.responses['200'].content['application/json'].schema.allOf[1]!.properties.id.const = 'B';

  const [normalizedBaseline, normalizedCandidate] = await Promise.all([
    normalizeDocument(baseline),
    normalizeDocument(candidate),
  ]);
  const changes = collectBreakingChanges(normalizedBaseline, normalizedCandidate)
    .filter((change) => change.reason.includes('const'));

  expect(changes).toHaveLength(2);
  expect(changes.every((change) => !change.sourceIdentity.startsWith('unindexed-'))).toBe(true);
  expect(changes[0]?.sourceIdentity).not.toBe(changes[1]?.sourceIdentity);
  expect(changes.find((change) => change.jsonPath.includes('/inline-a'))?.affectedPaths).toEqual([
    'root.paths./inline-a.get.responses.200.content.application/json.schema.id.const',
  ]);
  expect(changes.find((change) => change.jsonPath.includes('/inline-b'))?.affectedPaths).toEqual([
    'root.paths./inline-b.get.responses.200.content.application/json.schema.id.const',
  ]);
});

it('aggregates shared component derived properties across all consumers', async () => {
  const baseline = {
    openapi: '3.1.0',
    info: { title: 'Shared derived provenance test', version: '1.0.0' },
    components: {
      schemas: {
        Shared: {
          allOf: [
            { type: 'object', properties: { id: { type: 'string' } } },
            { type: 'object', properties: { id: { const: 'A' } } },
          ],
        },
      },
    },
    paths: {
      '/shared-a': { get: { operationId: 'getSharedA', responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/Shared' } } } } } } },
      '/shared-b': { get: { operationId: 'getSharedB', responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/Shared' } } } } } } },
    },
  };
  const candidate = structuredClone(baseline);
  candidate.components.schemas.Shared.allOf[1]!.properties.id.const = 'B';

  const [normalizedBaseline, normalizedCandidate] = await Promise.all([
    normalizeDocument(baseline),
    normalizeDocument(candidate),
  ]);
  const changes = collectBreakingChanges(normalizedBaseline, normalizedCandidate)
    .filter((change) => change.reason.includes('const'));
  expect(changes.length).toBeGreaterThan(0);
  expect(changes.every((change) => !change.sourceIdentity.startsWith('unindexed-'))).toBe(true);
  const paths = changes.flatMap((change) => change.affectedPaths);
  expect(paths).toEqual(expect.arrayContaining([
    'root.components.schemas.Shared.id.const',
    'root.paths./shared-a.get.responses.200.content.application/json.schema.id.const',
    'root.paths./shared-b.get.responses.200.content.application/json.schema.id.const',
  ]));
});

it('uses the content-identity branch for identical local-only bytes and emits v3 audit evidence', async () => {
  const source = `openapi: 3.1.0
info:
  title: identity fixture
  version: 1.0.0
paths: {}
components:
  schemas:
    Node:
      type: object
      properties:
        child:
          $ref: '#/components/schemas/Node'
`;
  const directory = await mkdtemp(join('/tmp', 'joyho-content-identity-'));
  const baselineFile = join(directory, 'baseline.yaml');
  const candidateFile = join(directory, 'candidate.yaml');
  await writeFile(baselineFile, source);
  await writeFile(candidateFile, source);
  try {
    const output: string[] = [];
    const comparator = vi.fn(collectBreakingInventory);
    const provenanceCalls: string[] = [];
    const evidence = await runBreakingInventory(baselineFile, candidateFile, {
      semanticInventoryCollector: comparator,
      latestRevision: () => 'a'.repeat(40),
      sourceProvenance: async (relativePath) => {
        provenanceCalls.push(relativePath);
        return { revision: 'b'.repeat(40), sha256: createHash('sha256').update(relativePath).digest('hex') };
      },
      writeStdout: (text) => output.push(text),
    });

    expect(comparator).toHaveBeenCalledTimes(0);
    expect(evidence.mode).toBe('content-identity');
    expect(evidence.comparatorExecuted).toBe(false);
    expect(evidence.referenceClosure.result).toBe('local-only');
    expect(output).toHaveLength(1);
    const audit = JSON.parse(output[0] ?? '{}') as Record<string, unknown>;
    expect(Object.keys(audit)).toEqual([
      'formatVersion', 'purpose', 'baseline', 'candidate', 'comparator', 'generator',
      'contentIdentity', 'comparison', 'count', 'inventoryMethod', 'promotionStatus',
      'affectedPathGroups', 'valueStore', 'entries',
    ]);
    expect(audit.formatVersion).toBe(3);
    expect(audit.count).toBe(0);
    expect(audit.entries).toEqual([]);
    expect(audit.affectedPathGroups).toEqual({});
    expect(audit.valueStore).toEqual({});
    expect(audit.inventoryMethod).toBe('Content identity: raw baseline and candidate bytes are equal and every $ref/$dynamicRef value is a string beginning with "#"; normalization, Swagger dereference, and the semantic comparator were not executed.');
    expect(provenanceCalls).toEqual([
      'packages/contracts/openapi/breaking-gate.ts',
      'packages/contracts/openapi/breaking-inventory.ts',
      'packages/contracts/openapi/content-identity.ts',
    ]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('routes byte-different semantic-equal documents through the real inventory collector', async () => {
  const baseline = `openapi: 3.1.0
info: {title: equal, version: 1.0.0}
paths: {}
`;
  const candidate = `${baseline}# formatting-only comment
`;
  const directory = await mkdtemp(join('/tmp', 'joyho-content-identity-'));
  const baselineFile = join(directory, 'baseline.yaml');
  const candidateFile = join(directory, 'candidate.yaml');
  await writeFile(baselineFile, baseline);
  await writeFile(candidateFile, candidate);
  try {
    const output: string[] = [];
    const comparator = vi.fn(collectBreakingInventory);
    const evidence = await runBreakingInventory(baselineFile, candidateFile, {
      semanticInventoryCollector: comparator,
      latestRevision: () => 'a'.repeat(40),
      sourceProvenance: async (relativePath) => ({
        revision: 'b'.repeat(40),
        sha256: createHash('sha256').update(relativePath).digest('hex'),
      }),
      writeStdout: (text) => output.push(text),
    });

    expect(comparator).toHaveBeenCalledTimes(1);
    expect(evidence.mode).toBe('semantic-comparator');
    expect(evidence.comparatorExecuted).toBe(true);
    expect(evidence.bytesEqual).toBe(false);
    expect(evidence.referenceClosure.result).toBe('not-scanned-bytes-differ');
    expect(JSON.parse(output[0] ?? '{}')).toMatchObject({ formatVersion: 3, count: 0 });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('routes a one-byte semantic change through the real collector and records breaking inventory', async () => {
  const baseline = `openapi: 3.1.0
info: {title: breaking inventory, version: 1.0.0}
paths:
  /probe:
    get:
      responses:
        '200':
          description: ok
          content:
            application/json:
              schema: {type: number, minimum: 1}
`;
  const candidate = baseline.replace('minimum: 1', 'minimum: 2');
  const directory = await mkdtemp(join('/tmp', 'joyho-content-identity-'));
  const baselineFile = join(directory, 'baseline.yaml');
  const candidateFile = join(directory, 'candidate.yaml');
  await writeFile(baselineFile, baseline);
  await writeFile(candidateFile, candidate);
  try {
    const output: string[] = [];
    const comparator = vi.fn(collectBreakingInventory);
    const evidence = await runBreakingInventory(baselineFile, candidateFile, {
      semanticInventoryCollector: comparator,
      latestRevision: () => 'a'.repeat(40),
      sourceProvenance: async (relativePath) => ({
        revision: 'b'.repeat(40),
        sha256: createHash('sha256').update(relativePath).digest('hex'),
      }),
      writeStdout: (text) => output.push(text),
    });

    expect(comparator).toHaveBeenCalledTimes(1);
    expect(evidence.mode).toBe('semantic-comparator');
    const audit = JSON.parse(output[0] ?? '{}') as { count: number; comparison: { comparatorExecuted: boolean } };
    expect(audit.comparison.comparatorExecuted).toBe(true);
    expect(audit.count).toBeGreaterThan(0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('does not write partial inventory output when provenance or serialization fails', async () => {
  const source = `openapi: 3.1.0
info: {title: failure fixture, version: 1.0.0}
paths: {}
`;
  const directory = await mkdtemp(join('/tmp', 'joyho-content-identity-'));
  const baselineFile = join(directory, 'baseline.yaml');
  const candidateFile = join(directory, 'candidate.yaml');
  await writeFile(baselineFile, source);
  await writeFile(candidateFile, source);
  const common = {
    latestRevision: () => 'a'.repeat(40),
    sourceProvenance: async () => { throw new Error('provenance failed'); },
  };
  try {
    const provenanceOutput: string[] = [];
    await expect(runBreakingInventory(baselineFile, candidateFile, {
      ...common,
      writeStdout: (text) => provenanceOutput.push(text),
    })).rejects.toThrow('provenance failed');
    expect(provenanceOutput).toEqual([]);

    const serializationOutput: string[] = [];
    await expect(runBreakingInventory(baselineFile, candidateFile, {
      latestRevision: () => 'a'.repeat(40),
      sourceProvenance: async (relativePath) => ({
        revision: 'b'.repeat(40),
        sha256: createHash('sha256').update(relativePath).digest('hex'),
      }),
      serialize: () => { throw new Error('serialization failed'); },
      writeStdout: (text) => serializationOutput.push(text),
    })).rejects.toThrow('serialization failed');
    expect(serializationOutput).toEqual([]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('fails closed on hash, parse, scan, and evidence truthfulness violations', () => {
  const hashOrder: string[] = [];
  let parseCalls = 0;
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  const cyclicAnalysis = analyzeContentIdentity(Buffer.from('baseline'), Buffer.from('baseline'), {
    sha256: (content) => {
      hashOrder.push(content.toString('utf8'));
      return 'a'.repeat(64);
    },
    parseYaml: () => {
      parseCalls += 1;
      return cyclic;
    },
  });
  expect(cyclicAnalysis.decision).toBe('content-identity');
  expect(parseCalls).toBe(1);
  expect(hashOrder).toEqual(['baseline', 'baseline']);

  parseCalls = 0;
  const byteDifferent = analyzeContentIdentity(Buffer.from('baseline'), Buffer.from('candidate'), {
    sha256: () => 'a'.repeat(64),
    parseYaml: () => {
      parseCalls += 1;
      return {};
    },
  });
  expect(byteDifferent.decision).toBe('semantic-comparator');
  expect(byteDifferent.bytesEqual).toBe(false);
  expect(parseCalls).toBe(0);

  expect(() => analyzeContentIdentity(Buffer.from('same'), Buffer.from('same'), {
    sha256: () => 'not-a-sha256',
  })).toThrowError(ContentIdentityError);
  try {
    analyzeContentIdentity(Buffer.from('same'), Buffer.from('same'), { sha256: () => 'not-a-sha256' });
  } catch (error) {
    expect(error).toMatchObject({ phase: 'hash' });
  }

  expect(() => analyzeContentIdentity(Buffer.from('invalid'), Buffer.from('invalid'), {
    parseYaml: () => { throw new Error('invalid yaml'); },
  })).toThrowError(ContentIdentityError);
  try {
    analyzeContentIdentity(Buffer.from('invalid'), Buffer.from('invalid'), { parseYaml: () => { throw new Error('invalid yaml'); } });
  } catch (error) {
    expect(error).toMatchObject({ phase: 'parse' });
  }

  const throwingReference = {};
  Object.defineProperty(throwingReference, '$ref', {
    enumerable: true,
    get: () => { throw new Error('getter failed'); },
  });
  expect(() => analyzeContentIdentity(Buffer.from('same'), Buffer.from('same'), {
    parseYaml: () => throwingReference,
  })).toThrowError(ContentIdentityError);
  try {
    analyzeContentIdentity(Buffer.from('same'), Buffer.from('same'), { parseYaml: () => throwingReference });
  } catch (error) {
    expect(error).toMatchObject({ phase: 'scan' });
  }

  const local = analyzeContentIdentity(Buffer.from('same'), Buffer.from('same'), { parseYaml: () => ({ $ref: '#/local' }) });
  expect(() => finalizeComparisonEvidence(local, true)).toThrow(/comparatorExecuted/);
  const semantic = analyzeContentIdentity(Buffer.from('a'), Buffer.from('b'));
  expect(() => finalizeComparisonEvidence(semantic, false)).toThrow(/comparatorExecuted/);
});

it('rejects external and non-string references without parsing them as identity input', () => {
  const external = analyzeContentIdentity(Buffer.from('same'), Buffer.from('same'), {
    parseYaml: () => ({ $ref: '/tmp/external.yaml' }),
  });
  expect(external.decision).toBe('semantic-comparator');
  expect(external.referenceClosure).toMatchObject({ result: 'not-local', violationKinds: ['external-reference'] });

  const dynamic = analyzeContentIdentity(Buffer.from('same'), Buffer.from('same'), {
    parseYaml: () => ({ $dynamicRef: '#/local' }),
  });
  expect(dynamic.decision).toBe('content-identity');

  const nonString = analyzeContentIdentity(Buffer.from('same'), Buffer.from('same'), {
    parseYaml: () => ({ $ref: 42 }),
  });
  expect(nonString.decision).toBe('semantic-comparator');
  expect(nonString.referenceClosure).toMatchObject({ result: 'not-local', violationKinds: ['non-string-reference'] });
});

function gitSourceDigest(revision: string, path: string): string {
  return createHash('sha256').update(execFileSync('git', ['show', `${revision}:${path}`])).digest('hex');
}
