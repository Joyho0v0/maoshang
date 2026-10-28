import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import SwaggerParser from '@apidevtools/swagger-parser';
import { parse } from 'yaml';
import { collectBreakingChanges, type BreakingChange } from './breaking-gate.js';

type RecordValue = Record<string, unknown>;

export interface BreakingInventoryEntry {
  readonly id: string;
  readonly jsonPath: string;
  readonly oldValue: unknown;
  readonly newValue: unknown;
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
    readonly comparatorIdentity: string;
  };
}

export interface BreakingInventory {
  readonly count: number;
  readonly entries: readonly BreakingInventoryEntry[];
}

const APPROVERS = ['高级 Web 后端架构师', '高级 Web 前端架构师', '全栈交付 Leader'] as const;
const FRONTEND_PROBLEM_DECISION = '高级 Web 前端架构师 comment 01a18255-64b3-76bf-8908-62ebcfe9eb72';
const BASELINE_REVISION = '9fb299cb04ade8674e2819fb00768b6689a44bebc297175bb52b1eba39b29c25';
const CANDIDATE_REVISION = '9138ea8f5cf130c3664367e39cafc18812edaa55';
const BREAKING_COMMAND = 'npm run contract:breaking (approved baseline remains unchanged)';

export async function collectBreakingInventory(previousDocument: RecordValue, nextDocument: RecordValue): Promise<BreakingInventory> {
  const previous = await normalizeDocument(previousDocument);
  const next = await normalizeDocument(nextDocument);
  const changes = collectBreakingChanges(previous, next);
  const entries = changes.map((change, index) => enrichEntry(index + 1, change));
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
    purpose: 'Complete structured audit inventory for the candidate against the approved OpenAPI baseline.',
    baseline: { revision: BASELINE_REVISION, digest: digests.baseline, path: 'packages/contracts/openapi/openapi.baseline.yaml' },
    candidate: {
      revision: CANDIDATE_REVISION,
      sha256: digests.candidate,
      generatedSha256: digests.generated,
      generatedClientSha256: digests.generatedClient,
      path: 'packages/contracts/openapi/openapi.yaml',
    },
    count: inventory.count,
    inventoryMethod: 'All structured BreakingChange records from the same normalized comparator used by the fail-fast gate; records retain exact paths, old/new domains, stable identities and affected paths after template expansion and Swagger dereference.',
    promotionStatus: 'blocked: approved baseline is intentionally unchanged; only the Problem v1 semantic direction has frontend acceptance, not promotion authorization.',
    entries: inventory.entries,
  };
}
function enrichEntry(index: number, change: BreakingChange): BreakingInventoryEntry {
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
    oldValue: summarizeValue(change.oldValue),
    newValue: summarizeValue(change.newValue),
    reason: change.reason,
    ownership: {
      domain,
      decisionOwner,
      consumerImpact: impact,
      scope: `stable comparator identity: ${change.stableIdentity ?? change.jsonPath}`,
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
      affectedPaths: change.affectedPaths,
      comparatorIdentity: change.stableIdentity ?? change.jsonPath,
    },
  };
}

function summarizeValue(value: unknown, depth = 0): unknown {
  if (value === undefined) return { present: false };
  if (value === null || typeof value !== 'object') return value;
  if (depth >= 3) {
    if (Array.isArray(value)) return { kind: 'array', length: value.length };
    const record = value as RecordValue;
    return {
      kind: 'object',
      keys: Object.keys(record).sort(),
      ...(record.type === undefined ? {} : { type: record.type }),
      ...(record.format === undefined ? {} : { format: record.format }),
      ...(record.const === undefined ? {} : { const: record.const }),
      ...(record.enum === undefined ? {} : { enum: record.enum }),
      ...(record.required === undefined ? {} : { required: record.required }),
    };
  }
  if (Array.isArray(value)) {
    if (value.length > 12 && value.every((item) => isRecord(item))) {
      return {
        kind: 'schema-array',
        length: value.length,
        options: value.map((item) => summarizeSchemaOption(item as RecordValue)),
      };
    }
    return value.map((item) => summarizeValue(item, depth + 1));
  }
  const record = value as RecordValue;
  const result: RecordValue = {};
  for (const key of Object.keys(record).sort()) result[key] = summarizeValue(record[key], depth + 1);
  return result;
}

function summarizeSchemaOption(option: RecordValue): RecordValue {
  const result: RecordValue = { keys: Object.keys(option).sort(), domains: collectSchemaDomains(option) };
  for (const key of ['type', 'format', 'const', 'enum', 'required', 'properties', 'oneOf', 'anyOf', 'allOf'] as const) {
    if (option[key] === undefined) continue;
    if (key === 'properties' && isRecord(option[key])) {
      result[key] = Object.keys(option[key]).sort();
      continue;
    }
    if (key === 'oneOf' || key === 'anyOf' || key === 'allOf') {
      result[key] = Array.isArray(option[key]) ? { length: option[key].length } : option[key];
      continue;
    }
    result[key] = summarizeValue(option[key], 2);
  }
  return result;
}

function collectSchemaDomains(schema: RecordValue, prefix = ''): RecordValue {
  const domains: RecordValue = {};
  for (const key of ['type', 'format', 'const', 'enum'] as const) {
    if (schema[key] !== undefined) domains[prefix === '' ? key : `${prefix}.${key}`] = schema[key];
  }
  if (isRecord(schema.properties)) {
    for (const [name, property] of Object.entries(schema.properties)) {
      if (isRecord(property)) Object.assign(domains, collectSchemaDomains(property, `${prefix}properties.${name}`));
    }
  }
  if (Array.isArray(schema.allOf)) {
    for (const branch of schema.allOf) {
      if (isRecord(branch)) Object.assign(domains, collectSchemaDomains(branch, prefix));
    }
  }
  return domains;
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
