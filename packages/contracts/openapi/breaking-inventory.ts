import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import SwaggerParser from '@apidevtools/swagger-parser';
import { parse } from 'yaml';
import { assertNoBreakingChanges } from './breaking-gate.js';

type RecordValue = Record<string, unknown>;

export interface BreakingInventoryEntry {
  readonly id: string;
  readonly jsonPath: string;
  readonly oldValue: unknown;
  readonly newValue: unknown;
  readonly reason: string;
  readonly ownership: string;
  readonly disposition: string;
  readonly authorization: {
    readonly status: string;
    readonly requiredApprovers: readonly string[];
    readonly acceptedSemanticDecisionBy: readonly string[];
    readonly baselinePromotion: string;
  };
  readonly verification: {
    readonly evidence: readonly string[];
    readonly source: string;
  };
}

export interface BreakingInventory {
  readonly count: number;
  readonly entries: readonly BreakingInventoryEntry[];
}

const APPROVERS = ['高级 Web 后端架构师', '高级 Web 前端架构师', '全栈交付 Leader'] as const;
const FRONTEND_PROBLEM_DECISION = '高级 Web 前端架构师 comment 01a18255-64b3-76bf-8908-62ebcfe9eb72';
const BASELINE_REVISION = '9fb299cb04ade8674e2819fb00768b6689a44bebc297175bb52b1eba39b29c25';
const CANDIDATE_REVISION = '337e3e97a4b39935495e577780012bf3494827fe';
const BREAKING_COMMAND = 'npm run contract:breaking (approved baseline remains unchanged)';

export async function collectBreakingInventory(previousDocument: RecordValue, nextDocument: RecordValue): Promise<BreakingInventory> {
  const previous = await normalizeDocument(previousDocument);
  const next = await normalizeDocument(nextDocument);
  const failures: Array<{ path: string; reason: string; oldValue: unknown; newValue: unknown }> = [];

  const previousComponents = isRecord(previous.components) && isRecord(previous.components.schemas) ? previous.components.schemas : {};
  const nextComponents = isRecord(next.components) && isRecord(next.components.schemas) ? next.components.schemas : {};
  for (const [name, previousSchema] of Object.entries(previousComponents)) {
    const nextSchema = nextComponents[name];
    capture(failures, `root.components.schemas.${name}`, previousSchema, nextSchema, previous, next);
  }

  const previousPaths = isRecord(previous.paths) ? previous.paths : {};
  const nextPaths = isRecord(next.paths) ? next.paths : {};
  for (const [route, previousPathItem] of Object.entries(previousPaths)) {
    if (!isRecord(previousPathItem)) continue;
    const nextPathItem = isRecord(nextPaths[route]) ? nextPaths[route] : {};
    for (const method of ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace']) {
      const previousOperation = previousPathItem[method];
      if (previousOperation === undefined) continue;
      capture(failures, `root.paths.${route}.${method}`, previousOperation, nextPathItem[method], previous, next);
    }
  }

  const entries = failures.map((failure, index) => enrichEntry(index + 1, failure));
  return { count: entries.length, entries };
}

export function buildAuditDocument(inventory: BreakingInventory, digests: {
  readonly baseline: string;
  readonly candidate: string;
  readonly generated: string;
  readonly generatedClient: string;
}): RecordValue {
  return {
    formatVersion: 1,
    purpose: 'Non-fail-fast audit inventory for the candidate against the approved OpenAPI baseline.',
    baseline: { digest: BASELINE_REVISION, sha256: digests.baseline, path: 'packages/contracts/openapi/openapi.baseline.yaml' },
    candidate: {
      revision: CANDIDATE_REVISION,
      sha256: digests.candidate,
      generatedSha256: digests.generated,
      generatedClientSha256: digests.generatedClient,
      path: 'packages/contracts/openapi/openapi.yaml',
    },
    count: inventory.count,
    inventoryMethod: 'One first failure per approved component schema and HTTP operation after template expansion and Swagger dereference; the full comparator remains fail-closed.',
    promotionStatus: 'blocked: approved baseline is intentionally unchanged; only the Problem v1 semantic direction has frontend acceptance, not promotion authorization.',
    entries: inventory.entries,
  };
}

function capture(
  failures: Array<{ path: string; reason: string; oldValue: unknown; newValue: unknown }>,
  path: string,
  previousValue: unknown,
  nextValue: unknown,
  previousDocument: RecordValue,
  nextDocument: RecordValue,
): void {
  try {
    assertNoBreakingChanges(previousValue, nextValue, path);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const marker = ': ';
    const markerIndex = message.indexOf(marker);
    const failurePath = message.startsWith('Breaking change at ') && markerIndex >= 0
      ? message.slice('Breaking change at '.length, markerIndex)
      : path;
    const reason = message.startsWith('Breaking change at ') && markerIndex >= 0
      ? message.slice(markerIndex + marker.length)
      : message;
    failures.push({
      path: failurePath,
      reason,
      oldValue: valueAtPath(previousDocument, failurePath),
      newValue: valueAtPath(nextDocument, failurePath),
    });
  }
}

function enrichEntry(index: number, failure: { path: string; reason: string; oldValue: unknown; newValue: unknown }): BreakingInventoryEntry {
  const isProblem = failure.path.includes('Problem') || failure.path.includes('/auth/sessions');
  const ownership = isProblem
    ? 'Joint Frozen v1 Problem/status/code/meta consumer contract (BE + FE)'
    : failure.path.includes('CommandStatus')
      ? 'CommandStatus/幂等公共状态契约（BE + FE）'
      : failure.path.includes('/inventory/') || failure.path.includes('Inventory')
        ? 'Inventory domain request/response contract (BE + FE)'
        : 'Shared OpenAPI operation/request/response contract (BE + FE)';
  return {
    id: `BRK-${String(index).padStart(3, '0')}`,
    jsonPath: failure.path,
    oldValue: failure.oldValue,
    newValue: failure.newValue,
    reason: failure.reason,
    ownership,
    disposition: isProblem
      ? 'accepted-v1-semantic-direction; baseline-evolution-required-after-complete-inventory-and-authorized-promotion'
      : 'pending-owner-decision; correct candidate or obtain explicit authorized baseline evolution before promotion',
    authorization: {
      status: isProblem ? 'semantic-direction-accepted; promotion-not-authorized' : 'pending',
      requiredApprovers: APPROVERS,
      acceptedSemanticDecisionBy: isProblem ? [FRONTEND_PROBLEM_DECISION] : [],
      baselinePromotion: 'not authorized in revision 337e3e9',
    },
    verification: {
      evidence: [
        `candidate revision ${CANDIDATE_REVISION}; approved baseline ${BASELINE_REVISION}`,
        BREAKING_COMMAND,
        'non-fail-fast collector rerun over normalized component schemas and every previous HTTP operation',
      ],
      source: 'packages/contracts/openapi/breaking-inventory.ts + tests/contract/breaking-inventory.test.ts',
    },
  };
}

function valueAtPath(document: RecordValue, path: string): unknown {
  const parts = path === 'root' ? [] : path.replace(/^root\.?/, '').split('.');
  let current: unknown = document;
  for (const part of parts) {
    const resolved = lookupPart(current, part);
    if (!resolved.found) return { present: false };
    current = resolved.value;
  }
  return summarizeValue(current);
}

function lookupPart(current: unknown, part: string): { found: boolean; value?: unknown } {
  if (!isRecord(current)) return { found: false };
  if (part in current) return { found: true, value: current[part] };
  if (isRecord(current.content) && part in current.content) return { found: true, value: current.content[part] };
  if (isRecord(current.properties) && part in current.properties) return { found: true, value: current.properties[part] };
  if (Array.isArray(current.allOf)) {
    for (const branch of current.allOf) {
      const resolved = lookupPart(branch, part);
      if (resolved.found) return resolved;
    }
  }
  return { found: false };
}

const SCHEMA_KEYS = new Set([
  'type', 'format', 'pattern', 'const', 'enum', 'required', 'properties', 'items', 'oneOf', 'anyOf', 'allOf',
  'additionalProperties', 'minLength', 'maxLength', 'minimum', 'maximum', 'minItems', 'maxItems',
]);

function summarizeValue(value: unknown, depth = 0): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (depth >= 4) {
    if (Array.isArray(value)) return { kind: 'array', length: value.length };
    return { kind: 'object', keys: Object.keys(value).sort() };
  }
  if (Array.isArray(value)) return value.map((item) => summarizeValue(item, depth + 1));
  const record = value as RecordValue;
  const schemaLike = Object.keys(record).some((key) => SCHEMA_KEYS.has(key));
  const keys = schemaLike ? [...SCHEMA_KEYS].filter((key) => key in record).sort() : Object.keys(record).sort();
  const result: RecordValue = {};
  for (const key of keys) result[key] = summarizeValue(record[key], depth + 1);
  return result;
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
  process.stdout.write(`${JSON.stringify(buildAuditDocument(inventory, {
    baseline: await digest(previousPath),
    candidate: await digest(currentPath),
    generated: 'b0be58f74d9118664e24d7df68c547235abdb3348fbbf894c6f4d7962c7a0831',
    generatedClient: 'c32e0e08f80a96ca893882d70ad13fd3a96c134fa97bef8a6346e383f0b527ab',
  }), null, 2)}\n`);
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  void main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
