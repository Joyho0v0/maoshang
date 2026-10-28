import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { expect, it } from 'vitest';
import inventory from '../../packages/contracts/openapi/breaking-inventory.json' with { type: 'json' };
import { collectBreakingInventory, createContentAddressedValueStore, normalizeDocument } from '../../packages/contracts/openapi/breaking-inventory.js';
import { collectBreakingChanges } from '../../packages/contracts/openapi/breaking-gate.js';

const baselinePath = new URL('../../packages/contracts/openapi/openapi.baseline.yaml', import.meta.url);
const candidatePath = new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url);

it('keeps the complete breaking inventory auditable and synchronized with both artifacts', async () => {
  const baseline = parse(await readFile(baselinePath, 'utf8')) as Record<string, unknown>;
  const candidate = parse(await readFile(candidatePath, 'utf8')) as Record<string, unknown>;
  const generated = await collectBreakingInventory(baseline, candidate);
  const persisted = inventory as typeof generated;

  expect(persisted.count).toBeGreaterThan(84);
  expect(persisted.entries).toHaveLength(persisted.count);
  expect((inventory as { baseline: { digest: string } }).baseline.digest).toBe('9fb299cb04ade8674e2819fb00768b6689a44bebc297175bb52b1eba39b29c25');
  expect((inventory as { candidate: { revision: string; sha256: string; generatedSha256: string; generatedClientSha256: string } }).candidate).toEqual({
    revision: '9138ea8f5cf130c3664367e39cafc18812edaa55',
    sha256: 'ed189686794ceae08890d3aa264c099c5239bd6d7ee8b5b0d401556c9257b287',
    generatedSha256: 'b0be58f74d9118664e24d7df68c547235abdb3348fbbf894c6f4d7962c7a0831',
    generatedClientSha256: 'c32e0e08f80a96ca893882d70ad13fd3a96c134fa97bef8a6346e383f0b527ab',
    path: 'packages/contracts/openapi/openapi.yaml',
  });
  const comparator = inventory as typeof inventory & { comparator: { revision: string; sourceSha256: string; command: string } };
  const generator = inventory as typeof inventory & { generator: { revision: string; sourceSha256: string; command: string } };
  expect(comparator.comparator.revision).toMatch(/^[0-9a-f]{40}$/);
  expect(generator.generator.revision).toMatch(/^[0-9a-f]{40}$/);
  expect(comparator.comparator.sourceSha256).toBe(gitSourceDigest(comparator.comparator.revision, 'packages/contracts/openapi/breaking-gate.ts'));
  expect(generator.generator.sourceSha256).toBe(gitSourceDigest(generator.generator.revision, 'packages/contracts/openapi/breaking-inventory.ts'));
  expect(comparator.comparator.command).toContain(`sourceRevision=${comparator.comparator.revision}`);
  expect(generator.generator.command).toContain(`sourceRevision=${generator.generator.revision}`);
  expect(new Set(persisted.entries.map((entry) => entry.jsonPath)).size).toBe(persisted.count);
  for (const pathPrefix of [
    'root.paths./auth/sessions.post.responses.403',
    'root.paths./users/{id}.get.responses.200.content.application/json.schema.href',
    'root.paths./users/{id}.get.responses.404',
    'root.paths./organizations/{id}/users.post.responses.202',
  ]) {
    expect(persisted.entries.some((entry) => entry.jsonPath.startsWith(pathPrefix)), pathPrefix).toBe(true);
  }
  expect(persisted.entries.every((entry) => entry.reason.length > 0)).toBe(true);
  expect(persisted.entries.every((entry) => entry.ownership.decisionOwner.length > 0)).toBe(true);
  expect(persisted.entries.every((entry) => entry.disposition.status.length > 0 && entry.disposition.action.length > 0)).toBe(true);
  expect(persisted.entries.every((entry) => entry.authorization.requiredApprovers.length > 0)).toBe(true);
  expect(persisted.entries.every((entry) => entry.verification.evidence.length > 0)).toBe(true);
  expect(persisted.entries.every((entry) => entry.verification.affectedPaths.length > 0)).toBe(true);
  expect(new Set(persisted.entries.map((entry) => entry.verification.comparatorIdentity)).size).toBe(persisted.count);
  expect(Object.keys(persisted.affectedPathGroups).length).toBeGreaterThan(0);
  expect(Object.values(persisted.affectedPathGroups).some((paths) => paths.length > 1)).toBe(true);
  expect(Object.keys(persisted.valueStore).length).toBeGreaterThan(0);
  expect(persisted.entries.every((entry) => entry.oldValue.sha256.length === 64 && entry.newValue.sha256.length === 64)).toBe(true);
  for (const entry of persisted.entries) {
    const oldValue = persisted.valueStore[entry.oldValue.sha256];
    const newValue = persisted.valueStore[entry.newValue.sha256];
    expect(createHash('sha256').update(JSON.stringify(oldValue)).digest('hex')).toBe(entry.oldValue.sha256);
    expect(createHash('sha256').update(JSON.stringify(newValue)).digest('hex')).toBe(entry.newValue.sha256);
  }
  expect(persisted.entries.every((entry) => {
    const paths = persisted.affectedPathGroups[entry.verification.affectedPathGroupId];
    return paths !== undefined && paths.includes(entry.jsonPath);
  })).toBe(true);

  expect(digest(generated.entries)).toBe(digest(persisted.entries));
  expect(digest(generated.affectedPathGroups)).toBe(digest(persisted.affectedPathGroups));
  expect(digest(generated.valueStore)).toBe(digest(persisted.valueStore));
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

function digest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function gitSourceDigest(revision: string, path: string): string {
  return createHash('sha256').update(execFileSync('git', ['show', `${revision}:${path}`])).digest('hex');
}
