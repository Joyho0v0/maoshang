import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import SwaggerParser from '@apidevtools/swagger-parser';
import { parse } from 'yaml';
import { collectBreakingChanges, type BreakingChange } from './breaking-gate.js';
import {
  analyzeContentIdentity,
  finalizeComparisonEvidence,
  type ContentIdentityOptions,
  type ComparisonEvidence,
} from './content-identity.js';

type RecordValue = Record<string, unknown>;

export interface ValueReference {
  readonly kind: 'content-addressed-value';
  readonly sha256: string;
  readonly jsonLength: number;
  readonly valuePath: string;
}

export interface BreakingInventoryEntry {
  readonly id: string;
  readonly jsonPath: string;
  readonly oldValue: ValueReference;
  readonly newValue: ValueReference;
  readonly reason: string;
  readonly ownership: {
    readonly domain: string;
    readonly decisionOwner: string;
    readonly consumerImpact: string;
    readonly scope: string;
  };
  readonly disposition: {
    readonly status: string;
    readonly action: string;
    readonly rationale: string;
  };
  readonly authorization: {
    readonly status: string;
    readonly requiredApprovers: readonly string[];
    readonly acceptedSemanticDecisionBy: readonly string[];
    readonly baselinePromotion: string;
  };
  readonly verification: {
    readonly evidence: readonly string[];
    readonly source: string;
    readonly affectedPaths: readonly string[];
    readonly affectedPathGroupId: string;
    readonly comparatorIdentity: string;
    readonly sourceIdentity: string;
  };
}

export interface BreakingInventory {
  readonly count: number;
  readonly entries: readonly BreakingInventoryEntry[];
  readonly affectedPathGroups: Readonly<Record<string, readonly string[]>>;
  readonly valueStore: Readonly<Record<string, unknown>>;
}

export interface AuditProvenance {
  readonly baselineRevision?: string;
  readonly comparatorRevision: string;
  readonly generatorRevision: string;
  readonly contentIdentity: {
    readonly revision: string;
    readonly sourceSha256: string;
  };
  readonly comparatorSourceSha256: string;
  readonly generatorSourceSha256: string;
  readonly comparatorCommand: string;
  readonly generatorCommand: string;
}

const APPROVERS = ['高级 Web 后端架构师', '高级 Web 前端架构师', '全栈交付 Leader'] as const;
const BREAKING_COMMAND = 'npm run contract:breaking';
const COMPARATOR_COMMAND = 'npm run contract:breaking -- packages/contracts/openapi/openapi.baseline.yaml packages/contracts/openapi/openapi.yaml';
const GENERATOR_COMMAND = 'npm run contract:breaking:inventory -- packages/contracts/openapi/openapi.baseline.yaml packages/contracts/openapi/openapi.yaml';

export interface BreakingInventoryRunOptions {
  readonly readBinary?: (path: string | URL) => Promise<Buffer>;
  readonly sha256?: (content: Buffer) => string;
  readonly parseYaml?: (source: string) => unknown;
  readonly semanticInventoryCollector?: typeof collectBreakingInventory;
  readonly latestRevision?: (path: string) => string;
  readonly sourceProvenance?: (
    relativePath: string,
    currentPath: string,
  ) => Promise<{ readonly revision: string; readonly sha256: string }>;
  readonly serialize?: (value: unknown) => string;
  readonly writeStdout?: (text: string) => void;
}

export async function collectBreakingInventory(previousDocument: RecordValue, nextDocument: RecordValue): Promise<BreakingInventory> {
  const previous = await normalizeDocument(previousDocument);
  const next = await normalizeDocument(nextDocument);
  const changes = collectBreakingChanges(previous, next);
  const candidateRevision = latestRevision('packages/contracts/openapi/openapi.yaml');
  const affectedPathGroups: Record<string, readonly string[]> = {};
  const contentStore = createContentAddressedValueStore();
  const entries = changes.map((change, index) => {
    const groupId = `affected-paths-${fingerprint(change.logicalIdentity)}`;
    affectedPathGroups[groupId] = change.affectedPaths;
    return enrichEntry(index + 1, change, groupId, contentStore.storeValue, candidateRevision);
  });
  return { count: entries.length, entries, affectedPathGroups, valueStore: contentStore.valueStore };
}

export function buildAuditDocument(inventory: BreakingInventory, digests: {
  readonly baseline: string;
  readonly candidate: string;
  readonly generated: string;
  readonly generatedClient: string;
}, provenance: AuditProvenance, candidateRevision: string, comparison: ComparisonEvidence): RecordValue {
  const baselineRevision = provenance.baselineRevision ?? latestRevision('packages/contracts/openapi/openapi.baseline.yaml');
  const identityInventoryMethod = 'Content identity: raw baseline and candidate bytes are equal and every $ref/$dynamicRef value is a string beginning with "#"; normalization, Swagger dereference, and the semantic comparator were not executed.';
  const semanticInventoryMethod = 'All structured BreakingChange records from the same normalized comparator used by the fail-fast gate; entries retain exact paths and stable identities, raw old/new values via the content-addressed valueStore, and complete affected-path groups after template expansion and Swagger dereference. Semantic disposition is recorded separately by stable comparator identity in breaking-decisions.json.';
  return {
    formatVersion: 3,
    purpose: 'Complete structured audit inventory for the candidate against the approved OpenAPI baseline.',
    baseline: { revision: baselineRevision, digest: digests.baseline, path: 'packages/contracts/openapi/openapi.baseline.yaml' },
    candidate: {
      revision: candidateRevision,
      sha256: digests.candidate,
      generatedSha256: digests.generated,
      generatedClientSha256: digests.generatedClient,
      path: 'packages/contracts/openapi/openapi.yaml',
    },
    comparator: {
      revision: provenance.comparatorRevision,
      sourceSha256: provenance.comparatorSourceSha256,
      command: provenance.comparatorCommand,
    },
    generator: {
      revision: provenance.generatorRevision,
      sourceSha256: provenance.generatorSourceSha256,
      command: provenance.generatorCommand,
    },
    contentIdentity: provenance.contentIdentity,
    comparison,
    count: inventory.count,
    inventoryMethod: comparison.mode === 'content-identity' ? identityInventoryMethod : semanticInventoryMethod,
    promotionStatus: inventory.count === 0 ? 'current/approved-zero-diff' : 'review-required before baseline promotion',
    affectedPathGroups: inventory.affectedPathGroups,
    valueStore: inventory.valueStore,
    entries: inventory.entries,
  };
}

export async function runBreakingInventory(
  previousPath: string,
  currentPath: string,
  options: BreakingInventoryRunOptions = {},
): Promise<ComparisonEvidence> {
  const readBinary = options.readBinary ?? ((path: string | URL) => readFile(path));
  const parseYaml = options.parseYaml ?? parse;
  const semanticInventoryCollector = options.semanticInventoryCollector ?? collectBreakingInventory;
  const getLatestRevision = options.latestRevision ?? latestRevision;

  const previousBytes = await readBinary(previousPath);
  const currentBytes = await readBinary(currentPath);
  const identityOptions: ContentIdentityOptions = options.sha256 === undefined
    ? { parseYaml }
    : { parseYaml, sha256: options.sha256 };
  const analysis = analyzeContentIdentity(previousBytes, currentBytes, identityOptions);

  let inventory: BreakingInventory;
  let comparison: ComparisonEvidence;
  if (analysis.decision === 'content-identity') {
    inventory = { count: 0, entries: [], affectedPathGroups: {}, valueStore: {} };
    comparison = finalizeComparisonEvidence(analysis, false);
  } else {
    const previous = parseYaml(previousBytes.toString('utf8')) as RecordValue;
    const current = parseYaml(currentBytes.toString('utf8')) as RecordValue;
    inventory = await semanticInventoryCollector(previous, current);
    comparison = finalizeComparisonEvidence(analysis, true);
  }

  const comparatorSource = await (options.sourceProvenance ?? sourceProvenance)(
    'packages/contracts/openapi/breaking-gate.ts',
    fileURLToPath(new URL('./breaking-gate.ts', import.meta.url)),
  );
  const generatorSource = await (options.sourceProvenance ?? sourceProvenance)(
    'packages/contracts/openapi/breaking-inventory.ts',
    fileURLToPath(new URL('./breaking-inventory.ts', import.meta.url)),
  );
  const contentIdentitySource = await (options.sourceProvenance ?? sourceProvenance)(
    'packages/contracts/openapi/content-identity.ts',
    fileURLToPath(new URL('./content-identity.ts', import.meta.url)),
  );
  const baselineRevision = getLatestRevision(previousPath);
  const candidateRevision = getLatestRevision(currentPath);
  const digest = options.sha256 ?? defaultSha256;
  const generated = await readBinary(fileURLToPath(new URL('./generated.ts', import.meta.url)));
  const generatedClient = await readBinary(fileURLToPath(new URL('./generated-client.ts', import.meta.url)));
  const audit = buildAuditDocument(inventory, {
    baseline: analysis.baseline.sha256,
    candidate: analysis.candidate.sha256,
    generated: digest(generated),
    generatedClient: digest(generatedClient),
  }, {
    baselineRevision,
    comparatorRevision: comparatorSource.revision,
    generatorRevision: generatorSource.revision,
    contentIdentity: { revision: contentIdentitySource.revision, sourceSha256: contentIdentitySource.sha256 },
    comparatorSourceSha256: comparatorSource.sha256,
    generatorSourceSha256: generatorSource.sha256,
    comparatorCommand: `${COMPARATOR_COMMAND} [sourceRevision=${comparatorSource.revision}]`,
    generatorCommand: `${GENERATOR_COMMAND} [sourceRevision=${generatorSource.revision}]`,
  }, candidateRevision, comparison);
  const serialize = options.serialize ?? JSON.stringify;
  const serialized = serialize(audit);
  if (typeof serialized !== 'string') throw new Error('Inventory audit serializer must return a string.');
  (options.writeStdout ?? ((text: string) => process.stdout.write(text)))(`${serialized}\n`);
  return comparison;
}
function enrichEntry(index: number, change: BreakingChange, affectedPathGroupId: string, storeValue: (value: unknown) => ValueReference, candidateRevision: string): BreakingInventoryEntry {
  const status = 'review-required';
  return {
    id: `BRK-${String(index).padStart(3, '0')}`,
    jsonPath: change.jsonPath,
    oldValue: storeValue(change.oldValue),
    newValue: storeValue(change.newValue),
    reason: change.reason,
    ownership: {
      domain: 'OpenAPI compatibility change; exact consumer impact is reviewed by stable comparator identity.',
      decisionOwner: APPROVERS.join(' + '),
      consumerImpact: 'operation/API compatibility impact; no path-derived authorization is inferred',
      scope: `stable comparator identity: ${change.stableIdentity}`,
    },
    disposition: {
      status,
      action: 'correct candidate or obtain an explicitly authorized baseline evolution before promotion',
      rationale: 'No semantic disposition is inferred from the URL, schema name, operation, or path. The identity-keyed breaking-decisions.json manifest is the source of disposition.',
    },
    authorization: {
      status,
      requiredApprovers: APPROVERS,
      acceptedSemanticDecisionBy: [],
      baselinePromotion: `review required before promotion in revision ${candidateRevision}`,
    },
    verification: {
      evidence: [
        `candidate revision ${candidateRevision}; baseline revision and digest are recorded in audit provenance`,
        BREAKING_COMMAND,
        'complete structured comparator collection over normalized components, parameters, request bodies, response headers, response content and schemas',
      ],
      source: 'packages/contracts/openapi/breaking-gate.ts + packages/contracts/openapi/breaking-inventory.ts + tests/contract/breaking-inventory.test.ts',
      // Keep the same complete logical-change aggregation on the entry and in
      // the immutable top-level map. Consumers may audit one entry without
      // having to infer sibling paths from the map first.
      affectedPaths: change.affectedPaths,
      affectedPathGroupId,
      comparatorIdentity: change.stableIdentity,
      sourceIdentity: change.sourceIdentity,
    },
  };
}

function auditValue(value: unknown): unknown {
  return value === undefined ? { present: false } : { present: true, value };
}

function fingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value) ?? 'undefined').digest('hex');
}

export function createContentAddressedValueStore(
  hashValue: (value: unknown) => string = fingerprint,
): {
  readonly valueStore: Record<string, unknown>;
  readonly storeValue: (value: unknown) => ValueReference;
} {
  const valueStore: Record<string, unknown> = {};
  const storeValue = (value: unknown): ValueReference => {
    const audited = auditValue(value);
    const serialized = JSON.stringify(audited);
    const sha256 = hashValue(audited);
    if (Object.prototype.hasOwnProperty.call(valueStore, sha256)) {
      const existingSerialized = JSON.stringify(valueStore[sha256]);
      if (existingSerialized !== serialized) {
        throw new Error(`content-address collision for ${sha256}`);
      }
    } else {
      valueStore[sha256] = audited;
    }
    return { kind: 'content-addressed-value', sha256, jsonLength: serialized.length, valuePath: `#/valueStore/${sha256}` };
  };
  return { valueStore, storeValue };
}

export async function normalizeDocument(document: RecordValue): Promise<RecordValue> {
  const templates = isRecord(document['x-operationTemplates']) ? document['x-operationTemplates'] : {};
  const paths = isRecord(document.paths) ? document.paths : {};
  const expandedPaths: RecordValue = {};
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!isRecord(pathItem)) continue;
    const expanded: RecordValue = { ...pathItem };
    for (const method of ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace']) {
      if (expanded[method] !== undefined) expanded[method] = resolveTemplate(expanded[method], templates);
    }
    expandedPaths[path] = expanded;
  }
  const normalized: RecordValue = { ...document, paths: expandedPaths };
  delete normalized['x-operationTemplates'];
  return (await SwaggerParser.dereference(normalized as never)) as unknown as RecordValue;
}

function resolveTemplate(value: unknown, templates: RecordValue): unknown {
  if (!isRecord(value)) return value;
  const ref = value['$ref'];
  if (typeof ref !== 'string' || !ref.startsWith('#/x-operationTemplates/')) return value;
  const template = templates[ref.slice('#/x-operationTemplates/'.length)];
  if (!isRecord(template)) throw new Error(`Unknown operation template ${ref}.`);
  const { $ref: _ref, ...overrides } = value;
  void _ref;
  return { ...resolveTemplate(template, templates) as RecordValue, ...overrides };
}

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function main(): Promise<void> {
  const previousPath = process.argv[2];
  const currentPath = process.argv[3];
  if (previousPath === undefined || currentPath === undefined) throw new Error('Usage: breaking-inventory <baseline> <candidate>');
  await runBreakingInventory(previousPath, currentPath);
}

function defaultSha256(content: Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

function latestRevision(relativePath: string): string {
  const revision = execFileSync('git', ['log', '-1', '--format=%H', '--', relativePath], { encoding: 'utf8' }).trim();
  if (revision.length === 0) throw new Error(`Cannot determine committed revision for ${relativePath}.`);
  return revision;
}

async function sourceProvenance(relativePath: string, currentPath: string): Promise<{ revision: string; sha256: string }> {
  const revision = execFileSync('git', ['log', '-1', '--format=%H', '--', relativePath], { encoding: 'utf8' }).trim();
  if (revision.length === 0) throw new Error(`Cannot determine committed source revision for ${relativePath}.`);
  const source = execFileSync('git', ['show', `${revision}:${relativePath}`]);
  const sha256 = createHash('sha256').update(source).digest('hex');
  const currentSha256 = createHash('sha256').update(await readFile(currentPath)).digest('hex');
  if (currentSha256 !== sha256) {
    throw new Error(`Working tree source differs from committed ${revision}:${relativePath}; commit source before generating inventory.`);
  }
  return { revision, sha256 };
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  void main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
