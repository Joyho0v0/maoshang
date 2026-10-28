import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import SwaggerParser from '@apidevtools/swagger-parser';
import { parse } from 'yaml';
import { collectBreakingChanges, type BreakingChange } from './breaking-gate.js';

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
  readonly comparatorRevision: string;
  readonly generatorRevision: string;
  readonly comparatorSourceSha256: string;
  readonly generatorSourceSha256: string;
  readonly comparatorCommand: string;
  readonly generatorCommand: string;
}

const APPROVERS = ['高级 Web 后端架构师', '高级 Web 前端架构师', '全栈交付 Leader'] as const;
const FRONTEND_PROBLEM_DECISION = '高级 Web 前端架构师 comment 01a18255-64b3-76bf-8908-62ebcfe9eb72';
const BASELINE_REVISION = '9fb299cb04ade8674e2819fb00768b6689a44bebc297175bb52b1eba39b29c25';
const CANDIDATE_REVISION = '9138ea8f5cf130c3664367e39cafc18812edaa55';
const BREAKING_COMMAND = 'npm run contract:breaking (approved baseline remains unchanged)';
const COMPARATOR_COMMAND = 'npm run contract:breaking -- packages/contracts/openapi/openapi.baseline.yaml packages/contracts/openapi/openapi.yaml';
const GENERATOR_COMMAND = 'npm run contract:breaking:inventory -- packages/contracts/openapi/openapi.baseline.yaml packages/contracts/openapi/openapi.yaml';

export async function collectBreakingInventory(previousDocument: RecordValue, nextDocument: RecordValue): Promise<BreakingInventory> {
  const previous = await normalizeDocument(previousDocument);
  const next = await normalizeDocument(nextDocument);
  const changes = collectBreakingChanges(previous, next);
  const affectedPathGroups: Record<string, readonly string[]> = {};
  const contentStore = createContentAddressedValueStore();
  const entries = changes.map((change, index) => {
    const groupId = `affected-paths-${fingerprint(change.logicalIdentity)}`;
    affectedPathGroups[groupId] = change.affectedPaths;
    return enrichEntry(index + 1, change, groupId, contentStore.storeValue);
  });
  return { count: entries.length, entries, affectedPathGroups, valueStore: contentStore.valueStore };
}

export function buildAuditDocument(inventory: BreakingInventory, digests: {
  readonly baseline: string;
  readonly candidate: string;
  readonly generated: string;
  readonly generatedClient: string;
}, provenance: AuditProvenance): RecordValue {
  return {
    formatVersion: 2,
    purpose: 'Complete structured audit inventory for the candidate against the approved OpenAPI baseline.',
    baseline: { revision: BASELINE_REVISION, digest: digests.baseline, path: 'packages/contracts/openapi/openapi.baseline.yaml' },
    candidate: {
      revision: CANDIDATE_REVISION,
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
    count: inventory.count,
    inventoryMethod: 'All structured BreakingChange records from the same normalized comparator used by the fail-fast gate; entries retain exact paths and stable identities, raw old/new values via the content-addressed valueStore, and complete affected-path groups after template expansion and Swagger dereference.',
    promotionStatus: 'blocked: approved baseline is intentionally unchanged; only the Problem v1 semantic direction has frontend acceptance, not promotion authorization.',
    affectedPathGroups: inventory.affectedPathGroups,
    valueStore: inventory.valueStore,
    entries: inventory.entries,
  };
}
function enrichEntry(index: number, change: BreakingChange, affectedPathGroupId: string, storeValue: (value: unknown) => ValueReference): BreakingInventoryEntry {
  const isProblem = change.jsonPath.includes('Problem') || change.jsonPath.includes('/auth/sessions');
  const isCommandStatus = change.jsonPath.includes('CommandStatus') || change.jsonPath.includes('/commands/status');
  const isInventory = change.jsonPath.includes('/inventory/') || change.jsonPath.includes('Inventory');
  const domain = isProblem
    ? 'Joint Frozen v1 Problem/status/code/meta consumer contract'
    : isCommandStatus
      ? 'CommandStatus/幂等公共状态契约'
      : isInventory
        ? 'Inventory domain request/response contract'
        : 'Shared OpenAPI operation/request/response contract';
  const decisionOwner = isProblem || isCommandStatus
    ? '高级 Web 后端架构师 + 高级 Web 前端架构师'
    : '高级 Web 后端架构师 + 高级 Web 前端架构师 + 全栈交付 Leader';
  const impact = isProblem || isCommandStatus || isInventory ? 'direct FE/BE consumer or runtime contract impact' : 'operation/API compatibility impact';
  const status = isProblem ? 'semantic-direction-accepted; promotion-not-authorized' : 'pending-owner-decision';
  const action = isProblem
    ? 'retain strict candidate semantics and obtain authorized baseline evolution after complete inventory review'
    : 'correct candidate or obtain explicit authorized baseline evolution before promotion';
  return {
    id: `BRK-${String(index).padStart(3, '0')}`,
    jsonPath: change.jsonPath,
    oldValue: storeValue(change.oldValue),
    newValue: storeValue(change.newValue),
    reason: change.reason,
    ownership: {
      domain,
      decisionOwner,
      consumerImpact: impact,
      scope: `stable comparator identity: ${change.stableIdentity}`,
    },
    disposition: {
      status,
      action,
      rationale: isProblem
        ? `Problem v1 strict code/status/meta semantics were accepted only as a semantic direction by ${FRONTEND_PROBLEM_DECISION}; this entry is not promotion authorization.`
        : `No authorized decision exists for this exact path; preserve the approved baseline until the named owners decide whether to fix the candidate or authorize an explicit baseline evolution.`,
    },
    authorization: {
      status,
      requiredApprovers: APPROVERS,
      acceptedSemanticDecisionBy: isProblem ? [FRONTEND_PROBLEM_DECISION] : [],
      baselinePromotion: `not authorized in revision ${CANDIDATE_REVISION}`,
    },
    verification: {
      evidence: [
        `candidate revision ${CANDIDATE_REVISION}; approved baseline ${BASELINE_REVISION}`,
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
  const previous = parse(await readFile(previousPath, 'utf8')) as RecordValue;
  const current = parse(await readFile(currentPath, 'utf8')) as RecordValue;
  const inventory = await collectBreakingInventory(previous, current);
  const digest = async (path: string) => createHash('sha256').update(await readFile(path)).digest('hex');
  const comparatorSource = await sourceProvenance('packages/contracts/openapi/breaking-gate.ts', fileURLToPath(new URL('./breaking-gate.ts', import.meta.url)));
  const generatorSource = await sourceProvenance('packages/contracts/openapi/breaking-inventory.ts', fileURLToPath(new URL('./breaking-inventory.ts', import.meta.url)));
  process.stdout.write(`${JSON.stringify(buildAuditDocument(inventory, {
    baseline: await digest(previousPath),
    candidate: await digest(currentPath),
    generated: 'b0be58f74d9118664e24d7df68c547235abdb3348fbbf894c6f4d7962c7a0831',
    generatedClient: 'c32e0e08f80a96ca893882d70ad13fd3a96c134fa97bef8a6346e383f0b527ab',
  }, {
    comparatorRevision: comparatorSource.revision,
    generatorRevision: generatorSource.revision,
    comparatorSourceSha256: comparatorSource.sha256,
    generatorSourceSha256: generatorSource.sha256,
    comparatorCommand: `${COMPARATOR_COMMAND} [sourceRevision=${comparatorSource.revision}]`,
    generatorCommand: `${GENERATOR_COMMAND} [sourceRevision=${generatorSource.revision}]`,
  }))}\n`);
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
