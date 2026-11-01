import { createHash } from 'node:crypto';
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
const promotionRecordPath = new URL('../../packages/contracts/openapi/audit/baseline-promotions/2026-10-31-files-complete-404/promotion-record.json', import.meta.url);
const archiveDirectory = new URL('../../packages/contracts/openapi/audit/baseline-promotions/2026-10-30-session-identity/', import.meta.url);

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

it('keeps the promoted completeUpload 404 inventory and digests auditable', async () => {
  const [inventoryRaw, decisionsRaw, recordRaw] = await Promise.all([
    readFile(liveInventoryPath),
    readFile(liveDecisionsPath),
    readFile(promotionRecordPath),
  ]);
  const persisted = JSON.parse(inventoryRaw.toString('utf8')) as LiveInventoryDocument;
  const manifest = JSON.parse(decisionsRaw.toString('utf8')) as DecisionManifest;
  const record = JSON.parse(recordRaw.toString('utf8')) as {
    status: string;
    baselineTransition: { fromSha256: string; toSha256: string; candidateSha256: string };
    liveArtifacts: {
      inventory: { sha256: string; byteLength: number; count: number };
      decisions: { sha256: string; byteLength: number; decisionCount: number };
    };
    sourceProvenance: { generatedTypesSha256: string; generatedClientSha256: string };
  };

  expect(inventoryRaw.toString('utf8')).toBe(JSON.stringify(persisted) + '\n');
  expect(inventoryRaw.subarray(-1)[0]).toBe(10);
  expect(persisted.formatVersion).toBe(3);
  expect(persisted.baseline.digest).toBe('a3e5168ac3346ac72d3d06aa9d67b4c52f893398c64ed80da71973e923be843c');
  expect(persisted.candidate.sha256).toBe(persisted.baseline.digest);
  expect(persisted.candidate.generatedSha256).toBe('0cf5340ae26aecfd24d0f7a1ce433ccd2450c9c65f1183dd5b19ea9d910d4821');
  expect(persisted.candidate.generatedClientSha256).toBe('b4a017cef65a11018f70321f624e3456708d55fdea638b9683a57fb610b5712c');
  expect(persisted.comparison.mode).toBe('content-identity');
  expect(persisted.comparison.comparatorExecuted).toBe(false);
  expect(persisted.comparison.bytesEqual).toBe(true);
  expect(persisted.count).toBe(0);
  expect(persisted.entries).toEqual([]);
  expect(persisted.affectedPathGroups).toEqual({});

  expect(decisionsRaw.toString('utf8')).toBe(JSON.stringify(manifest) + '\n');
  expect(manifest.baselineDigest).toBe(persisted.baseline.digest);
  expect(manifest.candidateDigest).toBe(persisted.candidate.sha256);
  expect(manifest.inventoryDigest).toBe(createHash('sha256').update(inventoryRaw).digest('hex'));
  expect(manifest.decisions).toEqual({});

  const candidateAndBaseline = await Promise.all([
    readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url)),
    readFile(new URL('../../packages/contracts/openapi/openapi.baseline.yaml', import.meta.url)),
  ]);
  expect(candidateAndBaseline[0].equals(candidateAndBaseline[1])).toBe(true);
  expect(record.status).toBe('implemented-awaiting-independent-acceptance');
  expect(record.baselineTransition).toEqual(expect.objectContaining({
    fromSha256: 'aa81c1b5d6de39a808e682fcd2c60cd387ae0719e5bd2ae0ea3ef1e1624bd29f',
    toSha256: persisted.candidate.sha256,
    candidateSha256: persisted.candidate.sha256,
  }));
  expect(record.liveArtifacts.inventory).toEqual(expect.objectContaining({
    sha256: createHash('sha256').update(inventoryRaw).digest('hex'),
    byteLength: inventoryRaw.byteLength,
    count: 0,
  }));
  expect(record.liveArtifacts.decisions).toEqual(expect.objectContaining({
    sha256: createHash('sha256').update(decisionsRaw).digest('hex'),
    byteLength: decisionsRaw.byteLength,
    decisionCount: 0,
  }));
  expect(record.sourceProvenance).toEqual(expect.objectContaining({
    generatedTypesSha256: persisted.candidate.generatedSha256,
    generatedClientSha256: persisted.candidate.generatedClientSha256,
  }));
});
it('keeps the candidate-only Session breaking disposition immutable after promotion', async () => {
  const archiveBaselineRaw = await readFile(new URL('openapi.baseline.before.yaml', archiveDirectory));
  const archiveInventoryRaw = await readFile(new URL('breaking-inventory.before.json', archiveDirectory));
  const archiveDecisionsRaw = await readFile(new URL('breaking-decisions.before.json', archiveDirectory));
  const dispositionRaw = await readFile(new URL('contract-disposition-package.json', archiveDirectory));
  const archiveInventory = JSON.parse(archiveInventoryRaw.toString('utf8')) as InventoryDocument;
  const archiveDecisions = JSON.parse(archiveDecisionsRaw.toString('utf8')) as {
    decisions: Record<string, { disposition: string; promotionAuthorized: boolean; inventoryId: string }>;
  };
  const disposition = JSON.parse(dispositionRaw.toString('utf8')) as {
    identityCount: number;
    orphanCount: number;
    duplicateCount: number;
    mismatchCount: number;
    decisions: Record<string, unknown>;
  };

  expect(createHash('sha256').update(archiveBaselineRaw).digest('hex')).toBe('149e4bbde325ec8ceb4dad3f550af1fa75c2a98dcf8ea882de4f41215b057984');
  expect(archiveInventory.count).toBe(12);
  expect(archiveInventory.entries).toHaveLength(12);
  expect(new Set(archiveInventory.entries.map((entry) => entry.jsonPath)).size).toBe(12);
  expect(new Set(archiveInventory.entries.map((entry) => entry.verification.comparatorIdentity)).size).toBe(12);
  expect(Object.keys(archiveInventory.affectedPathGroups)).toHaveLength(3);
  expect(archiveInventory.entries.every((entry) => entry.reason.includes('required') && entry.verification.affectedPaths.length === 4)).toBe(true);
  expect(archiveInventory.entries.every((entry) => archiveInventory.affectedPathGroups[entry.verification.affectedPathGroupId]?.includes(entry.jsonPath))).toBe(true);

  const decisionKeys = Object.keys(archiveDecisions.decisions);
  expect(decisionKeys).toHaveLength(12);
  expect(Object.values(archiveDecisions.decisions).every((decision) => decision.disposition === 'accept-semantic-direction' && decision.promotionAuthorized === false)).toBe(true);
  expect(new Set(Object.values(archiveDecisions.decisions).map((decision) => decision.inventoryId)).size).toBe(12);
  expect(disposition).toEqual(expect.objectContaining({
    identityCount: 12,
    orphanCount: 0,
    duplicateCount: 0,
    mismatchCount: 0,
  }));
  expect(Object.keys(disposition.decisions)).toHaveLength(12);
  expect((await readFile(liveInventoryPath)).equals(archiveInventoryRaw)).toBe(false);
  expect((await readFile(liveDecisionsPath)).equals(archiveDecisionsRaw)).toBe(false);
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
