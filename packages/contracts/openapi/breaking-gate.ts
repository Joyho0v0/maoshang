import { readFile } from 'node:fs/promises';
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
  readonly stableIdentity?: string;
}

export function assertNoBreakingChanges(previous: unknown, next: unknown, path = 'root'): void {
  if (!isRecord(previous) || !isRecord(next)) {
    if (JSON.stringify(previous) !== JSON.stringify(next)) throw new Error(`Breaking change at ${path}: value changed.`);
    return;
  }

  compareCommonSchemaConstraints(previous, next, path);
  compareComposition(previous, next, path);

  if (path === 'root' && (previous.openapi !== undefined || previous.paths !== undefined)) {
    compareOpenApiDocument(previous, next, path);
    return;
  }

  const previousRequired = effectiveRequired(previous);
  const nextRequired = new Set(effectiveRequired(next));
  for (const field of previousRequired) {
    if (!nextRequired.has(field)) throw new Error(`Breaking change at ${path}: required field ${field} was removed.`);
  }
  const previousRequiredSet = new Set(previousRequired);
  for (const field of nextRequired) {
    if (!previousRequiredSet.has(field)) throw new Error(`Breaking change at ${path}: field ${field} became required.`);
  }

  const previousProperties = effectiveProperties(previous);
  const nextProperties = effectiveProperties(next);
  for (const [property, previousSchema] of Object.entries(previousProperties)) {
    const nextSchema = nextProperties[property];
    if (nextSchema === undefined) throw new Error(`Breaking change at ${path}: property ${property} was removed.`);
    assertNoBreakingChanges(previousSchema, nextSchema, `${path}.${property}`);
  }

  const previousItems = previous.items;
  if (previousItems !== undefined) {
    if (next.items === undefined) throw new Error(`Breaking change at ${path}: items schema was removed.`);
    assertNoBreakingChanges(previousItems, next.items, `${path}.items`);
  }

  if (previous.parameters !== undefined) compareNamedCollection(previous.parameters, next.parameters, ['name', 'in'], `${path}.parameters`);
  if (previous.requestBody !== undefined) compareRequestBody(previous.requestBody, next.requestBody, `${path}.requestBody`);
  if (previous.responses !== undefined) compareResponses(previous.responses, next.responses, `${path}.responses`);
  if (previous.security !== undefined) compareSecurity(previous.security, next.security, `${path}.security`);
}
function compareOpenApiDocument(previous: RecordValue, next: RecordValue, path: string): void {
  if (path === 'root') {
    const previousPaths = isRecord(previous.paths) ? previous.paths : {};
    const nextPaths = isRecord(next.paths) ? next.paths : {};
    for (const [route, previousPathItem] of Object.entries(previousPaths)) {
      const nextPathItem = nextPaths[route];
      if (!isRecord(nextPathItem)) throw new Error(`Breaking change at root.paths: path ${route} was removed.`);
      comparePathItem(previousPathItem, nextPathItem, `root.paths.${route}`);
    }

    const previousComponents = isRecord(previous.components) ? previous.components : {};
    const nextComponents = isRecord(next.components) ? next.components : {};
    for (const [section, previousSection] of Object.entries(previousComponents)) {
      const nextSection = nextComponents[section];
      if (!isRecord(previousSection)) continue;
      if (!isRecord(nextSection)) throw new Error(`Breaking change at root.components: section ${section} was removed.`);
      for (const [name, previousValue] of Object.entries(previousSection)) {
        const nextValue = nextSection[name];
        if (nextValue === undefined) throw new Error(`Breaking change at root.components.${section}: ${name} was removed.`);
        assertNoBreakingChanges(previousValue, nextValue, `root.components.${section}.${name}`);
      }
    }

    compareSecurity(previous.security, next.security, 'root.security');
  }
}

function comparePathItem(previous: unknown, next: RecordValue, path: string): void {
  if (!isRecord(previous)) return;
  for (const [method, previousOperation] of Object.entries(previous)) {
    if (!['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'].includes(method)) continue;
    const nextOperation = next[method];
    if (!isRecord(nextOperation)) throw new Error(`Breaking change at ${path}: ${method.toUpperCase()} operation was removed.`);
    compareOperation(previousOperation, nextOperation, `${path}.${method}`);
  }
}

function compareOperation(previous: unknown, next: RecordValue, path: string): void {
  if (!isRecord(previous)) return;
  if (previous.operationId !== undefined && previous.operationId !== next.operationId) {
    throw new Error(`Breaking change at ${path}: operationId changed.`);
  }

  compareNamedCollection(previous.parameters, next.parameters, ['name', 'in'], `${path}.parameters`);
  compareRequestBody(previous.requestBody, next.requestBody, `${path}.requestBody`);
  compareResponses(previous.responses, next.responses, `${path}.responses`);
  compareSecurity(previous.security, next.security, `${path}.security`);
}

function compareNamedCollection(previousValue: unknown, nextValue: unknown, identity: string[], path: string): void {
  if (!Array.isArray(previousValue)) return;
  const next = Array.isArray(nextValue) ? nextValue : [];
  for (const previousEntry of previousValue) {
    if (!isRecord(previousEntry)) continue;
    const match = next.find((candidate) => isRecord(candidate) && identity.every((key) => candidate[key] === previousEntry[key]));
    if (!isRecord(match)) throw new Error(`Breaking change at ${path}: parameter was removed.`);
    if (previousEntry.required === true && match.required !== true) throw new Error(`Breaking change at ${path}: required parameter was relaxed unexpectedly.`);
    if (previousEntry.required !== true && match.required === true) throw new Error(`Breaking change at ${path}: optional parameter became required.`);
    if (previousEntry.schema !== undefined) assertNoBreakingChanges(previousEntry.schema, match.schema, `${path}.${String(previousEntry.name)}`);
  }
}

function compareRequestBody(previous: unknown, next: unknown, path: string): void {
  if (previous === undefined) return;
  if (!isRecord(next)) throw new Error(`Breaking change at ${path}: request body was removed.`);
  if (isRecord(previous) && previous.required === true && next.required !== true) throw new Error(`Breaking change at ${path}: required request body was relaxed unexpectedly.`);
  if (isRecord(previous) && previous.required !== true && next.required === true) throw new Error(`Breaking change at ${path}: request body became required.`);
  if (isRecord(previous) && isRecord(next)) compareContent(previous.content, next.content, path);
}

function compareResponses(previous: unknown, next: unknown, path: string): void {
  if (!isRecord(previous)) return;
  if (!isRecord(next)) throw new Error(`Breaking change at ${path}: responses were removed.`);
  for (const [status, previousResponse] of Object.entries(previous)) {
    const nextResponse = next[status];
    if (!isRecord(nextResponse)) throw new Error(`Breaking change at ${path}: response ${status} was removed.`);
    if (isRecord(previousResponse) && isRecord(nextResponse)) {
      compareHeaders(previousResponse.headers, nextResponse.headers, `${path}.${status}.headers`);
      compareContent(previousResponse.content, nextResponse.content, `${path}.${status}.content`);
    }
  }
}

function compareHeaders(previous: unknown, next: unknown, path: string): void {
  if (!isRecord(previous)) return;
  if (!isRecord(next)) throw new Error(`Breaking change at ${path}: response headers were removed.`);
  for (const [name, previousHeader] of Object.entries(previous)) {
    const nextHeader = next[name];
    if (nextHeader === undefined) throw new Error(`Breaking change at ${path}: header ${name} was removed.`);
    assertNoBreakingChanges(previousHeader, nextHeader, `${path}.${name}`);
  }
}

function compareContent(previous: unknown, next: unknown, path: string): void {
  if (!isRecord(previous)) return;
  if (!isRecord(next)) throw new Error(`Breaking change at ${path}: content was removed.`);
  for (const [mediaType, previousMedia] of Object.entries(previous)) {
    const nextMedia = next[mediaType];
    if (!isRecord(nextMedia)) throw new Error(`Breaking change at ${path}: media type ${mediaType} was removed.`);
    if (isRecord(previousMedia) && isRecord(nextMedia) && previousMedia.schema !== undefined) {
      if (nextMedia.schema === undefined) throw new Error(`Breaking change at ${path}.${mediaType}: schema was removed.`);
      assertNoBreakingChanges(previousMedia.schema, nextMedia.schema, `${path}.${mediaType}.schema`);
    }
  }
}

function compareCommonSchemaConstraints(previous: RecordValue, next: RecordValue, path: string): void {
  for (const key of ['type', 'format', 'pattern', 'const', 'minLength', 'maxLength', 'minimum', 'maximum', 'minItems', 'maxItems'] as const) {
    const previousValue = inheritedConstraint(previous, key);
    const nextValue = next[key];
    if (previousValue === undefined) {
      if (nextValue !== undefined) throw new Error(`Breaking change at ${path}: candidate-only constraint ${key} narrowed the value space.`);
      continue;
    }
    if (nextValue === undefined) throw new Error(`Breaking change at ${path}: constraint ${key} was removed.`);
    if (key === 'maxLength' || key === 'maximum' || key === 'maxItems') {
      if (typeof previousValue === 'number' && typeof nextValue === 'number' && nextValue < previousValue) throw new Error(`Breaking change at ${path}: constraint ${key} was narrowed.`);
    } else if (key === 'minLength' || key === 'minimum' || key === 'minItems') {
      if (typeof previousValue === 'number' && typeof nextValue === 'number' && nextValue > previousValue) throw new Error(`Breaking change at ${path}: constraint ${key} was narrowed.`);
    } else if (JSON.stringify(previousValue) !== JSON.stringify(nextValue)) {
      throw new Error(`Breaking change at ${path}: constraint ${key} changed.`);
    }
  }

  if ((previous.additionalProperties === true || previous.additionalProperties === undefined) && next.additionalProperties === false) {
    throw new Error(`Breaking change at ${path}: additional properties were disallowed.`);
  }

  const previousEnumValue = inheritedConstraint(previous, 'enum');
  const previousEnum = arrayOfScalars(previousEnumValue);
  if (previousEnumValue === undefined && next.enum !== undefined) {
    throw new Error(`Breaking change at ${path}: candidate-only enum narrowed the value space.`);
  }
  if (previousEnum.length > 0) {
    const nextEnum = new Set(arrayOfScalars(next.enum).map((value) => JSON.stringify(value)));
    for (const value of previousEnum) {
      if (!nextEnum.has(JSON.stringify(value))) throw new Error(`Breaking change at ${path}: enum value ${String(value)} was removed.`);
    }
  }
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

function compareComposition(previous: RecordValue, next: RecordValue, path: string): void {
  for (const key of ['oneOf', 'anyOf', 'allOf'] as const) {
    if (!Array.isArray(previous[key])) {
      if (Array.isArray(next[key])) throw new Error(`Breaking change at ${path}: ${key} was added as a candidate-only composition.`);
      continue;
    }
    if (!Array.isArray(next[key])) {
      if (key === 'allOf' && allOfFlattenedInto(previous, next)) continue;
      throw new Error(`Breaking change at ${path}: ${key} was removed.`);
    }
    if (key === 'oneOf' && next[key].length > previous[key].length) {
      throw new Error(`Breaking change at ${path}: oneOf option was added without a disjointness proof.`);
    }
    for (const previousOption of previous[key]) {
      const inheritedRequired = new Set(effectiveRequired(previous));
      if (!next[key].some((candidate) => schemaContainsCompatibleOption(candidate, previousOption, inheritedRequired))) throw new Error(`Breaking change at ${path}: a ${key} option was removed.`);
    }
  }
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
    compareCommonSchemaConstraints(branch, next, 'allOf');
    for (const [property, previousSchema] of Object.entries(effectiveProperties(branch))) {
      const nextSchema = nextProperties[property];
      if (nextSchema === undefined) return false;
      assertNoBreakingChanges(previousSchema, nextSchema, `allOf.${property}`);
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

  try {
    assertNoBreakingChanges(previousOption, comparableCandidate, 'composition');
    return true;
  } catch {
    return false;
  }
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

function compareSecurity(previous: unknown, next: unknown, path: string): void {
  if (previous === undefined) {
    if (next !== undefined) throw new Error(`Breaking change at ${path}: security requirement was added.`);
    return;
  }
  if (!Array.isArray(next)) throw new Error(`Breaking change at ${path}: security requirement was removed.`);
  if (JSON.stringify(previous) !== JSON.stringify(next)) throw new Error(`Breaking change at ${path}: security requirement changed.`);
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
  return changes;
}

function collectValue(previous: unknown, next: unknown, path: string, changes: BreakingChange[]): void {
  if (!isRecord(previous) || !isRecord(next)) {
    if (JSON.stringify(previous) !== JSON.stringify(next)) addChange(changes, path, 'value changed.', previous, next);
    return;
  }

  if (path === 'root' && (previous.openapi !== undefined || previous.paths !== undefined)) {
    collectOpenApiDocument(previous, next, changes);
    return;
  }

  collectCommonSchemaConstraints(previous, next, path, changes);
  collectComposition(previous, next, path, changes);

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
  for (const key of ['oneOf', 'anyOf', 'allOf'] as const) {
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
    if (nextOptions.length < previousOptions.length) {
      for (let index = nextOptions.length; index < previousOptions.length; index += 1) {
        addChange(changes, `${path}.${key}[${index}]`, `a ${key} option was removed.`, previousOptions[index], undefined, `${key}[${index}]`);
      }
    }
    // When a composition's option count changes, the surviving branches do not
    // have a stable positional correspondence. The composition-level record is
    // the canonical change; descending into arbitrary branches would manufacture
    // false old/new pairings (especially for Problem's typed oneOf matrix).
    if (nextOptions.length !== previousOptions.length) continue;
    for (let index = 0; index < previousOptions.length; index += 1) {
      const previousOption = previousOptions[index];
      const nextOption = nextOptions[index];
      if (JSON.stringify(previousOption) === JSON.stringify(nextOption)) continue;
      collectValue(previousOption, nextOption, `${path}.${key}[${index}]`, changes);
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
  changes.push({ jsonPath, reason, oldValue, newValue, affectedPaths: [jsonPath], ...(stableIdentity === undefined ? {} : { stableIdentity }) });
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
