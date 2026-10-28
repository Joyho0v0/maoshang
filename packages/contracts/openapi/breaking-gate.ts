import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve as resolvePath } from 'node:path';
import SwaggerParser from '@apidevtools/swagger-parser';
import { parse } from 'yaml';

type RecordValue = Record<string, unknown>;

export interface BreakingChange {
  readonly jsonPath: string;
  readonly reason: string;
  readonly oldValue: unknown;
  readonly newValue: unknown;
  readonly affectedPaths: readonly string[];
  readonly stableIdentity: string;
  readonly logicalIdentity: string;
}

const collectionLimits = new WeakMap<BreakingChange[], number>();

export function assertNoBreakingChanges(previous: unknown, next: unknown, path = 'root'): void {
  const first = collectBreakingChanges(previous, next, path)[0];
  if (first !== undefined) throw new Error(formatBreakingChange(first));
}

function formatBreakingChange(change: BreakingChange): string {
  return `Breaking change at ${change.jsonPath}: ${change.reason} old=${JSON.stringify(change.oldValue)} new=${JSON.stringify(change.newValue)}`;
}
function inheritedConstraint(schema: RecordValue, key: string): unknown {
  if (schema[key] !== undefined) return schema[key];
  if (!Array.isArray(schema.allOf)) return undefined;
  const values = schema.allOf
    .filter(isRecord)
    .map((branch) => inheritedConstraint(branch, key))
    .filter((value) => value !== undefined);
  if (values.length === 0) return undefined;
  const first = JSON.stringify(values[0]);
  return values.every((value) => JSON.stringify(value) === first) ? values[0] : undefined;
}

function effectiveRequired(schema: RecordValue): string[] {
  const required = new Set(arrayOfStrings(schema.required));
  const allOf = schema.allOf;
  if (Array.isArray(allOf)) {
    for (const branch of allOf) {
      if (isRecord(branch)) {
        for (const field of effectiveRequired(branch)) required.add(field);
      }
    }
  }
  for (const key of ['oneOf', 'anyOf'] as const) {
    const branches = schema[key];
    if (!Array.isArray(branches) || branches.length === 0 || !branches.every(isRecord)) continue;
    const first = branches[0];
    if (!isRecord(first)) continue;
    const common = new Set(effectiveRequired(first));
    for (const branch of branches.slice(1)) {
      if (!isRecord(branch)) continue;
      const branchRequired = new Set(effectiveRequired(branch));
      for (const field of common) {
        if (!branchRequired.has(field)) common.delete(field);
      }
    }
    for (const field of common) required.add(field);
  }
  return [...required];
}

function effectiveProperties(schema: RecordValue): RecordValue {
  const properties: RecordValue = {};
  const allOf = schema.allOf;
  if (Array.isArray(allOf)) {
    for (const branch of allOf) {
      if (isRecord(branch)) Object.assign(properties, effectiveProperties(branch));
    }
  }
  if (isRecord(schema.properties)) Object.assign(properties, schema.properties);
  return properties;
}

function allOfFlattenedInto(previous: RecordValue, next: RecordValue): boolean {
  if (!Array.isArray(previous.allOf)) return false;
  const nextRequired = new Set(effectiveRequired(next));
  const nextProperties = effectiveProperties(next);
  for (const branch of previous.allOf) {
    if (!isRecord(branch)) return false;
    for (const field of effectiveRequired(branch)) {
      if (!nextRequired.has(field)) return false;
    }
    const branchRequired = new Set(effectiveRequired(branch));
    const redundantRequired = new Set([...effectiveRequired(next)].filter((field) => !branchRequired.has(field)));
    if (hasBreakingChange(branch, removeRedundantRequired(next, redundantRequired), 'allOf')) return false;
    for (const [property, previousSchema] of Object.entries(effectiveProperties(branch))) {
      const nextSchema = nextProperties[property];
      if (nextSchema === undefined) return false;
      if (hasBreakingChange(previousSchema, nextSchema, `allOf.${property}`)) return false;
    }
    for (const key of ['oneOf', 'anyOf'] as const) {
      const options = branch[key];
      if (!Array.isArray(options)) continue;
      for (const option of options) {
        if (!schemaContainsCompatibleOption(next, option, new Set(effectiveRequired(previous)))) return false;
      }
    }
  }
  return true;
}

function schemaContainsCompatibleOption(candidate: unknown, previousOption: unknown, inheritedRequired = new Set<string>()): boolean {
  if (!isRecord(candidate) || !isRecord(previousOption)) return false;

  if (schemaContainsOption(candidate, previousOption)) {
    // An allOf wrapper containing the old option can still add a mandatory
    // constraint to every value. It is not a containment proof. oneOf/anyOf
    // wrappers are additive only when they do not add root requirements.
    if (Array.isArray(candidate.allOf)) return false;
    const previousRequired = new Set(effectiveRequired(previousOption));
    if (arrayOfStrings(candidate.required).some((field) => !previousRequired.has(field))) return false;
    return true;
  }

  // A candidate-only composition can narrow an option even when the ordinary
  // object comparison sees no newly-required root property.  Do not use the
  // general comparator as a containment proof until composition shapes match;
  // compareComposition will recursively inspect matching branches instead.
  for (const key of ['oneOf', 'anyOf', 'allOf'] as const) {
    if (Array.isArray(candidate[key]) && !Array.isArray(previousOption[key])) return false;
  }

  const previousRequired = new Set(effectiveRequired(previousOption));
  const redundantRequired = new Set([...inheritedRequired].filter((field) => !previousRequired.has(field)));
  const comparableCandidate = removeRedundantRequired(candidate, redundantRequired);
  return !hasBreakingChange(previousOption, comparableCandidate, 'composition');
}

function hasBreakingChange(previous: unknown, next: unknown, path: string): boolean {
  const changes: BreakingChange[] = [];
  collectionLimits.set(changes, 1);
  collectValue(previous, next, path, changes);
  return changes.length > 0;
}

function removeRedundantRequired(schema: RecordValue, redundantRequired: Set<string>): RecordValue {
  if (redundantRequired.size === 0) return schema;
  const copy: RecordValue = { ...schema };
  if (Array.isArray(schema.required)) copy.required = schema.required.filter((field) => typeof field !== 'string' || !redundantRequired.has(field));
  for (const key of ['oneOf', 'anyOf', 'allOf'] as const) {
    if (Array.isArray(schema[key])) copy[key] = schema[key].map((branch) => isRecord(branch) ? removeRedundantRequired(branch, redundantRequired) : branch);
  }
  return copy;
}

function schemaContainsOption(candidate: unknown, previousOption: unknown): boolean {
  if (JSON.stringify(candidate) === JSON.stringify(previousOption)) return true;
  if (!isRecord(candidate)) return false;
  for (const key of ['oneOf', 'anyOf', 'allOf'] as const) {
    const options = candidate[key];
    if (Array.isArray(options) && options.some((option) => schemaContainsOption(option, previousOption))) return true;
  }
  return false;
}

/**
 * Collect every compatibility failure in a normalized artifact.
 *
 * `assertNoBreakingChanges` deliberately remains fail-fast for the release
 * gate. Inventory and review tooling must use this collector instead so a
 * first failure in one response cannot hide sibling headers, schemas, or
 * problem variants.
 */
export function collectBreakingChanges(previous: unknown, next: unknown, path = 'root'): BreakingChange[] {
  const changes: BreakingChange[] = [];
  collectValue(previous, next, path, changes);
  const unique = new Map<string, BreakingChange>();
  for (const change of changes) {
    if (!unique.has(change.stableIdentity)) unique.set(change.stableIdentity, change);
  }
  const groupedPaths = new Map<string, string[]>();
  for (const change of unique.values()) {
    const paths = groupedPaths.get(change.logicalIdentity) ?? [];
    paths.push(change.jsonPath);
    groupedPaths.set(change.logicalIdentity, paths);
  }
  return [...unique.values()].map((change) => ({
    ...change,
    affectedPaths: groupedPaths.get(change.logicalIdentity) ?? [change.jsonPath],
  }));
}

function collectValue(previous: unknown, next: unknown, path: string, changes: BreakingChange[]): void {
  if (shouldStop(changes)) return;
  if (!isRecord(previous) || !isRecord(next)) {
    if (JSON.stringify(previous) !== JSON.stringify(next)) addChange(changes, path, 'value changed.', previous, next);
    return;
  }

  if (path === 'root' && (previous.openapi !== undefined || previous.paths !== undefined)) {
    collectOpenApiDocument(previous, next, changes);
    return;
  }

  collectCommonSchemaConstraints(previous, next, path, changes);
  if (shouldStop(changes)) return;
  collectComposition(previous, next, path, changes);
  if (shouldStop(changes)) return;

  const previousRequired = new Set(effectiveRequired(previous));
  const nextRequired = new Set(effectiveRequired(next));
  for (const field of previousRequired) {
    if (!nextRequired.has(field)) addChange(changes, `${path}.${field}.required`, 'required field was removed.', true, false, field);
  }
  for (const field of nextRequired) {
    if (!previousRequired.has(field)) addChange(changes, `${path}.${field}.required`, 'field became required.', false, true, field);
  }

  const previousProperties = effectiveProperties(previous);
  const nextProperties = effectiveProperties(next);
  for (const [property, previousSchema] of Object.entries(previousProperties)) {
    const nextSchema = nextProperties[property];
    if (nextSchema === undefined) {
      addChange(changes, `${path}.${property}`, `property ${property} was removed.`, previousSchema, undefined, property);
      continue;
    }
    collectValue(previousSchema, nextSchema, `${path}.${property}`, changes);
  }

  if (previous.items !== undefined) {
    if (next.items === undefined) addChange(changes, `${path}.items`, 'items schema was removed.', previous.items, undefined, 'items');
    else collectValue(previous.items, next.items, `${path}.items`, changes);
  }

  if (previous.parameters !== undefined) collectNamedCollection(previous.parameters, next.parameters, ['name', 'in'], `${path}.parameters`, changes);
  if (previous.requestBody !== undefined) collectRequestBody(previous.requestBody, next.requestBody, `${path}.requestBody`, changes);
  if (previous.responses !== undefined) collectResponses(previous.responses, next.responses, `${path}.responses`, changes);
  if (previous.security !== undefined) collectSecurity(previous.security, next.security, `${path}.security`, changes);
}

function collectOpenApiDocument(previous: RecordValue, next: RecordValue, changes: BreakingChange[]): void {
  const previousPaths = isRecord(previous.paths) ? previous.paths : {};
  const nextPaths = isRecord(next.paths) ? next.paths : {};
  for (const [route, previousPathItem] of Object.entries(previousPaths)) {
    const nextPathItem = nextPaths[route];
    if (!isRecord(nextPathItem)) {
      addChange(changes, `root.paths.${route}`, `path ${route} was removed.`, previousPathItem, undefined, route);
      continue;
    }
    collectPathItem(previousPathItem, nextPathItem, `root.paths.${route}`, changes);
  }

  const previousComponents = isRecord(previous.components) ? previous.components : {};
  const nextComponents = isRecord(next.components) ? next.components : {};
  for (const [section, previousSection] of Object.entries(previousComponents)) {
    const nextSection = nextComponents[section];
    if (!isRecord(previousSection)) continue;
    if (!isRecord(nextSection)) {
      addChange(changes, `root.components.${section}`, `component section ${section} was removed.`, previousSection, undefined, section);
      continue;
    }
    for (const [name, previousValue] of Object.entries(previousSection)) {
      const nextValue = nextSection[name];
      if (nextValue === undefined) {
        addChange(changes, `root.components.${section}.${name}`, `${name} was removed.`, previousValue, undefined, name);
        continue;
      }
      collectValue(previousValue, nextValue, `root.components.${section}.${name}`, changes);
    }
  }

  collectSecurity(previous.security, next.security, 'root.security', changes);
}

function collectPathItem(previous: unknown, next: RecordValue, path: string, changes: BreakingChange[]): void {
  if (!isRecord(previous)) return;
  for (const [method, previousOperation] of Object.entries(previous)) {
    if (!['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'].includes(method)) continue;
    const nextOperation = next[method];
    if (!isRecord(nextOperation)) {
      addChange(changes, `${path}.${method}`, `${method.toUpperCase()} operation was removed.`, previousOperation, undefined, method);
      continue;
    }
    collectOperation(previousOperation, nextOperation, `${path}.${method}`, changes);
  }
}

function collectOperation(previous: unknown, next: RecordValue, path: string, changes: BreakingChange[]): void {
  if (!isRecord(previous)) return;
  if (previous.operationId !== undefined && previous.operationId !== next.operationId) {
    addChange(changes, `${path}.operationId`, 'operationId changed.', previous.operationId, next.operationId, String(previous.operationId));
  }
  collectNamedCollection(previous.parameters, next.parameters, ['name', 'in'], `${path}.parameters`, changes);
  collectRequestBody(previous.requestBody, next.requestBody, `${path}.requestBody`, changes);
  collectResponses(previous.responses, next.responses, `${path}.responses`, changes);
  collectSecurity(previous.security, next.security, `${path}.security`, changes);
}

function collectNamedCollection(previousValue: unknown, nextValue: unknown, identity: string[], path: string, changes: BreakingChange[]): void {
  if (!Array.isArray(previousValue)) return;
  const next = Array.isArray(nextValue) ? nextValue : [];
  for (const previousEntry of previousValue) {
    if (!isRecord(previousEntry)) continue;
    const identityValue = identity.map((key) => `${key}=${String(previousEntry[key])}`).join(', ');
    const entryPath = `${path}[${identityValue}]`;
    const match = next.find((candidate) => isRecord(candidate) && identity.every((key) => candidate[key] === previousEntry[key]));
    if (!isRecord(match)) {
      addChange(changes, entryPath, 'named parameter was removed.', previousEntry, undefined, identityValue);
      continue;
    }
    if (previousEntry.required === true && match.required !== true) addChange(changes, `${entryPath}.required`, 'required parameter was relaxed unexpectedly.', true, match.required ?? false, identityValue);
    if (previousEntry.required !== true && match.required === true) addChange(changes, `${entryPath}.required`, 'optional parameter became required.', previousEntry.required ?? false, true, identityValue);
    if (previousEntry.schema !== undefined) {
      if (match.schema === undefined) addChange(changes, `${entryPath}.schema`, 'parameter schema was removed.', previousEntry.schema, undefined, identityValue);
      else collectValue(previousEntry.schema, match.schema, `${entryPath}.schema`, changes);
    }
  }
}

function collectRequestBody(previous: unknown, next: unknown, path: string, changes: BreakingChange[]): void {
  if (previous === undefined) return;
  if (!isRecord(next)) {
    addChange(changes, path, 'request body was removed.', previous, undefined, 'requestBody');
    return;
  }
  if (isRecord(previous) && previous.required === true && next.required !== true) addChange(changes, `${path}.required`, 'required request body was relaxed unexpectedly.', true, next.required ?? false, 'requestBody');
  if (isRecord(previous) && previous.required !== true && next.required === true) addChange(changes, `${path}.required`, 'request body became required.', previous.required ?? false, true, 'requestBody');
  if (isRecord(previous) && isRecord(next)) collectContent(previous.content, next.content, `${path}.content`, changes);
}

function collectResponses(previous: unknown, next: unknown, path: string, changes: BreakingChange[]): void {
  if (!isRecord(previous)) return;
  if (!isRecord(next)) {
    addChange(changes, path, 'responses were removed.', previous, undefined, 'responses');
    return;
  }
  for (const [status, previousResponse] of Object.entries(previous)) {
    const nextResponse = next[status];
    const responsePath = `${path}.${status}`;
    if (!isRecord(nextResponse)) {
      addChange(changes, responsePath, `response ${status} was removed.`, previousResponse, undefined, status);
      continue;
    }
    if (isRecord(previousResponse) && isRecord(nextResponse)) {
      collectHeaders(previousResponse.headers, nextResponse.headers, `${responsePath}.headers`, changes);
      collectContent(previousResponse.content, nextResponse.content, `${responsePath}.content`, changes);
    }
  }
}

function collectHeaders(previous: unknown, next: unknown, path: string, changes: BreakingChange[]): void {
  if (!isRecord(previous)) return;
  if (!isRecord(next)) {
    addChange(changes, path, 'response headers were removed.', previous, undefined, 'headers');
    return;
  }
  for (const [name, previousHeader] of Object.entries(previous)) {
    const headerPath = `${path}.${name}`;
    const nextHeader = next[name];
    if (nextHeader === undefined) {
      addChange(changes, headerPath, `header ${name} was removed.`, previousHeader, undefined, name);
      continue;
    }
    collectValue(previousHeader, nextHeader, headerPath, changes);
  }
}

function collectContent(previous: unknown, next: unknown, path: string, changes: BreakingChange[]): void {
  if (!isRecord(previous)) return;
  if (!isRecord(next)) {
    addChange(changes, path, 'content was removed.', previous, undefined, 'content');
    return;
  }
  for (const [mediaType, previousMedia] of Object.entries(previous)) {
    const mediaPath = `${path}.${mediaType}`;
    const nextMedia = next[mediaType];
    if (!isRecord(nextMedia)) {
      addChange(changes, mediaPath, `media type ${mediaType} was removed.`, previousMedia, undefined, mediaType);
      continue;
    }
    if (isRecord(previousMedia) && isRecord(nextMedia) && previousMedia.schema !== undefined) {
      if (nextMedia.schema === undefined) addChange(changes, `${mediaPath}.schema`, 'schema was removed.', previousMedia.schema, undefined, mediaType);
      else collectValue(previousMedia.schema, nextMedia.schema, `${mediaPath}.schema`, changes);
    }
  }
}

function collectCommonSchemaConstraints(previous: RecordValue, next: RecordValue, path: string, changes: BreakingChange[]): void {
  if (shouldStop(changes)) return;
  for (const key of ['type', 'format', 'pattern', 'const', 'minLength', 'maxLength', 'minimum', 'maximum', 'minItems', 'maxItems'] as const) {
    const previousValue = inheritedConstraint(previous, key);
    const nextValue = inheritedConstraint(next, key);
    if (previousValue === undefined) {
      if (nextValue !== undefined) addChange(changes, `${path}.${key}`, `candidate-only constraint ${key} narrowed the value space.`, undefined, nextValue, key);
      continue;
    }
    if (nextValue === undefined) {
      addChange(changes, `${path}.${key}`, `constraint ${key} was removed.`, previousValue, undefined, key);
      continue;
    }
    const narrowed = key === 'maxLength' || key === 'maximum' || key === 'maxItems'
      ? typeof previousValue === 'number' && typeof nextValue === 'number' && nextValue < previousValue
      : key === 'minLength' || key === 'minimum' || key === 'minItems'
        ? typeof previousValue === 'number' && typeof nextValue === 'number' && nextValue > previousValue
        : JSON.stringify(previousValue) !== JSON.stringify(nextValue);
    if (narrowed) addChange(changes, `${path}.${key}`, `constraint ${key} was narrowed.`, previousValue, nextValue, key);
  }

  if ((previous.additionalProperties === true || previous.additionalProperties === undefined) && next.additionalProperties === false) {
    addChange(changes, `${path}.additionalProperties`, 'additional properties were disallowed.', previous.additionalProperties ?? true, false, 'additionalProperties');
  }

  const previousEnumValue = inheritedConstraint(previous, 'enum');
  const previousEnum = arrayOfScalars(previousEnumValue);
  const nextEnumValue = inheritedConstraint(next, 'enum');
  if (previousEnumValue === undefined && nextEnumValue !== undefined) addChange(changes, `${path}.enum`, 'candidate-only enum narrowed the value space.', undefined, nextEnumValue, 'enum');
  if (previousEnum.length > 0) {
    const nextEnum = new Set(arrayOfScalars(nextEnumValue).map((value) => JSON.stringify(value)));
    for (const value of previousEnum) {
      if (!nextEnum.has(JSON.stringify(value))) addChange(changes, `${path}.enum`, `enum value ${String(value)} was removed.`, previousEnumValue, nextEnumValue, 'enum');
    }
  }
}

function collectComposition(previous: RecordValue, next: RecordValue, path: string, changes: BreakingChange[]): void {
  if (shouldStop(changes)) return;
  for (const key of ['oneOf', 'anyOf', 'allOf'] as const) {
    if (shouldStop(changes)) return;
    const previousOptions = previous[key];
    const nextOptions = next[key];
    if (!Array.isArray(previousOptions)) {
      if (Array.isArray(nextOptions)) addChange(changes, `${path}.${key}`, `${key} was added as a candidate-only composition.`, undefined, nextOptions, key);
      continue;
    }
    if (!Array.isArray(nextOptions)) {
      if (key === 'allOf' && allOfFlattenedIntoWithoutThrowing(previous, next)) continue;
      addChange(changes, `${path}.${key}`, `${key} was removed.`, previousOptions, undefined, key);
      continue;
    }
    if (key === 'oneOf' && nextOptions.length > previousOptions.length) {
      addChange(changes, `${path}.${key}`, 'oneOf option was added without a disjointness proof.', previousOptions, nextOptions, key);
    }

    const matchedNextIndexes = new Set<number>();
    for (let index = 0; index < previousOptions.length; index += 1) {
      const previousOption = previousOptions[index];
      const matchIndex = nextOptions.findIndex((candidate, candidateIndex) => {
        if (matchedNextIndexes.has(candidateIndex)) return false;
        return schemaContainsCompatibleOption(candidate, previousOption, new Set(effectiveRequired(previous)));
      });
      if (matchIndex === -1) {
        addChange(changes, `${path}.${key}[${index}]`, `a ${key} option was removed.`, previousOption, undefined, `${key}[${index}]`);
        continue;
      }
      matchedNextIndexes.add(matchIndex);
    }
  }
}

function collectSecurity(previous: unknown, next: unknown, path: string, changes: BreakingChange[]): void {
  if (previous === undefined) {
    if (next !== undefined) addChange(changes, path, 'security requirement was added.', undefined, next, 'security');
    return;
  }
  if (!Array.isArray(next)) {
    addChange(changes, path, 'security requirement was removed.', previous, next, 'security');
    return;
  }
  if (JSON.stringify(previous) !== JSON.stringify(next)) addChange(changes, path, 'security requirement changed.', previous, next, 'security');
}

function allOfFlattenedIntoWithoutThrowing(previous: RecordValue, next: RecordValue): boolean {
  try {
    return allOfFlattenedInto(previous, next);
  } catch {
    return false;
  }
}

function addChange(
  changes: BreakingChange[],
  jsonPath: string,
  reason: string,
  oldValue: unknown,
  newValue: unknown,
  stableIdentity?: string,
): void {
  if (shouldStop(changes)) return;
  const kind = stableIdentity ?? 'value';
  const logicalIdentity = `${kind}#${fingerprint(reason)}#${fingerprint(oldValue)}->${fingerprint(newValue)}`;
  changes.push({
    jsonPath,
    reason,
    oldValue,
    newValue,
    affectedPaths: [jsonPath],
    stableIdentity: `${jsonPath}#${logicalIdentity}`,
    logicalIdentity,
  });
}

function shouldStop(changes: BreakingChange[]): boolean {
  return changes.length >= (collectionLimits.get(changes) ?? Number.POSITIVE_INFINITY);
}

function fingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value) ?? 'undefined').digest('hex').slice(0, 16);
}

function arrayOfStrings(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
function arrayOfScalars(value: unknown): Array<string | number | boolean | null> { return Array.isArray(value) ? value.filter(isScalar) : []; }
function isScalar(value: unknown): value is string | number | boolean | null { return value === null || ['string', 'number', 'boolean'].includes(typeof value); }
function isRecord(value: unknown): value is RecordValue { return typeof value === 'object' && value !== null && !Array.isArray(value); }

export async function runBreakingGate(previousPath: URL, currentPath: URL): Promise<void> {
  const previous = await normalize(await readContract(previousPath));
  const current = await normalize(await readContract(currentPath));
  assertNoBreakingChanges(previous, current);
  process.stdout.write('OpenAPI breaking gate passed: baseline and current artifacts are backward compatible.\n');
}

async function readContract(path: URL): Promise<RecordValue> {
  return parse(await readFile(path, 'utf8')) as RecordValue;
}

async function normalize(document: RecordValue): Promise<RecordValue> {
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

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const previousPath = process.argv[2];
  const currentPath = process.argv[3];
  if (previousPath === undefined || currentPath === undefined) throw new Error('Usage: breaking-gate <baseline> <current>');
  void runBreakingGate(pathToFileURL(resolvePath(previousPath)), pathToFileURL(resolvePath(currentPath))).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
