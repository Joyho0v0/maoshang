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
  readonly sourceIdentity: string;
}

const collectionLimits = new WeakMap<BreakingChange[], number>();
interface CollectionContext {
  readonly sourceIds: WeakMap<object, string>;
  readonly occurrenceSources: WeakMap<object, SourceOccurrence[]>;
}

interface SourceOccurrence {
  readonly arrayPath: string;
  readonly index: number;
  readonly sourceIdentity: string;
}

const collectionContexts = new WeakMap<BreakingChange[], CollectionContext>();
const activeComparisons = new WeakMap<BreakingChange[], WeakMap<object, WeakSet<object>>>();

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
  const merge = (source: RecordValue): void => {
    for (const [property, propertySchema] of Object.entries(source)) {
      const existing = properties[property];
      properties[property] = existing === undefined ? propertySchema : mergePropertySchemas(existing, propertySchema);
    }
  };
  const allOf = schema.allOf;
  if (Array.isArray(allOf)) {
    for (const branch of allOf) {
      if (isRecord(branch)) merge(effectiveProperties(branch));
    }
  }
  if (isRecord(schema.properties)) merge(schema.properties);
  return properties;
}

function mergePropertySchemas(previous: unknown, next: unknown): unknown {
  if (stableSerialize(previous) === stableSerialize(next)) return previous;
  const branches: unknown[] = [];
  const append = (value: unknown): void => {
    if (isRecord(value) && Object.keys(value).length === 1 && Array.isArray(value.allOf)) {
      branches.push(...value.allOf);
    } else {
      branches.push(value);
    }
  };
  append(previous);
  append(next);
  branches.sort((left, right) => stableSerialize(left).localeCompare(stableSerialize(right)));
  return { allOf: branches };
}

function allOfFlattenedInto(previous: RecordValue, next: RecordValue): boolean {
  if (!Array.isArray(previous.allOf)) return false;
  if (equivalentAfterAllOfFlattening(previous, next)) return true;
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
      const comparableNextSchema = isRecord(nextSchema) && Array.isArray(nextSchema.allOf)
        ? flattenAllOfForContainment(nextSchema)
        : nextSchema;
      if (hasBreakingChange(previousSchema, comparableNextSchema, `allOf.${property}`)) return false;
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

  if (equivalentAfterAllOfFlattening(candidate, previousOption)) return true;

  if (schemaContainsOption(candidate, previousOption)) {
    // An allOf wrapper containing the old option can still add a mandatory
    // constraint to every value. It is not a containment proof. oneOf/anyOf
    // wrappers are additive only when they do not add root requirements or
    // sibling constraints which narrow every value in the nested branch.
    if (Array.isArray(candidate.allOf)) return false;
    if (candidateAddsNarrowingRootConstraint(candidate, previousOption)) return false;
    return true;
  }

  // The candidate may split a previously merged object into equivalent allOf
  // branches. Compare the effective merged shape, rather than treating the
  // composition wrapper as an unrelated one-to-one option.
  if (Array.isArray(candidate.allOf) && !Array.isArray(previousOption.allOf)) {
    return schemaContainsCompatibleOption(flattenAllOfForContainment(candidate), previousOption, inheritedRequired);
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
  const comparablePrevious = Array.isArray(previousOption.allOf)
    ? flattenAllOfForContainment(previousOption)
    : previousOption;
  const comparableCandidate = removeRedundantRequired(candidate, redundantRequired);
  return !hasBreakingChange(comparablePrevious, comparableCandidate, 'composition');
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

const containmentConstraintKeys = [
  'type', 'format', 'pattern', 'const', 'enum', 'minLength', 'maxLength',
  'minimum', 'maximum', 'minItems', 'maxItems', 'minProperties', 'maxProperties',
  'exclusiveMinimum', 'exclusiveMaximum', 'uniqueItems', 'multipleOf', 'contains',
  'propertyNames', 'dependentRequired', 'unevaluatedProperties', 'not',
  'minContains', 'maxContains', 'prefixItems', 'dependentSchemas',
  'patternProperties', 'if', 'then', 'else', 'unevaluatedItems',
] as const;

const supportedSchemaKeywords = new Set([
  '$schema', '$id', '$ref', '$anchor', '$dynamicRef', '$dynamicAnchor', '$defs',
  'type', 'format', 'pattern', 'const', 'enum', 'minLength', 'maxLength',
  'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf',
  'minItems', 'maxItems', 'uniqueItems', 'contains', 'minContains', 'maxContains',
  'prefixItems', 'items', 'minProperties', 'maxProperties', 'required', 'properties',
  'patternProperties', 'additionalProperties', 'propertyNames', 'dependentRequired',
  'dependentSchemas', 'allOf', 'anyOf', 'oneOf', 'not', 'if', 'then', 'else',
  'unevaluatedItems', 'unevaluatedProperties', 'contentEncoding', 'contentMediaType',
  'contentSchema', 'title', 'description', 'default', 'deprecated', 'readOnly',
  'writeOnly', 'examples', 'example', 'nullable', 'xml', 'discriminator', 'externalDocs',
]);

const schemaMarkerKeywords = new Set([
  '$schema', '$id', '$ref', '$anchor', '$dynamicRef', '$dynamicAnchor', '$defs',
  'type', 'format', 'pattern', 'const', 'enum', 'minLength', 'maxLength',
  'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf',
  'minItems', 'maxItems', 'uniqueItems', 'contains', 'minContains', 'maxContains',
  'prefixItems', 'items', 'minProperties', 'maxProperties', 'properties',
  'patternProperties', 'additionalProperties', 'propertyNames', 'dependentRequired',
  'dependentSchemas', 'allOf', 'anyOf', 'oneOf', 'not', 'if', 'then', 'else',
  'unevaluatedItems', 'unevaluatedProperties', 'contentEncoding', 'contentMediaType',
  'contentSchema',
]);

const schemaChildKeywords = new Set([
  '$defs', 'properties', 'patternProperties', 'additionalProperties', 'propertyNames',
  'dependentSchemas', 'allOf', 'anyOf', 'oneOf', 'not', 'if', 'then', 'else',
  'items', 'prefixItems', 'contains', 'unevaluatedItems', 'unevaluatedProperties',
  'contentSchema',
]);

function hasUnsupportedSchemaKeyword(value: unknown, assumeSchema = false, seen = new WeakSet<object>()): boolean {
  if (!isRecord(value) || seen.has(value)) return false;
  seen.add(value);
  const schemaLike = assumeSchema || Object.keys(value).some((key) => schemaMarkerKeywords.has(key));
  if (schemaLike) {
    for (const key of Object.keys(value)) {
      if (!supportedSchemaKeywords.has(key) && !key.startsWith('x-')) return true;
    }
  }
  for (const [key, child] of Object.entries(value)) {
    if (!schemaChildKeywords.has(key)) continue;
    if (['$defs', 'properties', 'patternProperties', 'dependentSchemas'].includes(key) && isRecord(child)) {
      if (Object.values(child).some((item) => hasUnsupportedSchemaKeyword(item, true, seen))) return true;
      continue;
    }
    if (Array.isArray(child)) {
      if (child.some((item) => hasUnsupportedSchemaKeyword(item, true, seen))) return true;
    } else if (hasUnsupportedSchemaKeyword(child, true, seen)) {
      return true;
    }
  }
  return false;
}

function collectUnsupportedSchemaKeywords(previous: RecordValue, next: RecordValue, path: string, changes: BreakingChange[]): void {
  if (!hasUnsupportedSchemaKeyword(previous) && !hasUnsupportedSchemaKeyword(next)) return;
  const previousKeys = new Set(Object.keys(previous));
  const nextKeys = new Set(Object.keys(next));
  const keys = [...new Set([...previousKeys, ...nextKeys])].filter((key) => !supportedSchemaKeywords.has(key) && !key.startsWith('x-'));
  for (const key of keys) {
    if (stableSerialize(previous[key]) === stableSerialize(next[key])) continue;
    addChange(changes, `${path}.${key}`, `unsupported schema keyword ${key} changed; compatibility is not proven.`, previous[key], next[key], key, previous);
  }
}

function candidateAddsNarrowingRootConstraint(candidate: RecordValue, previousOption: RecordValue): boolean {
  if (hasUnsupportedSchemaKeyword(candidate)) return true;
  for (const key of containmentConstraintKeys) {
    const candidateValue = inheritedConstraint(candidate, key);
    if (candidateValue === undefined) continue;
    const previousValue = inheritedConstraint(previousOption, key);
    if (previousValue === undefined) return true;
    if (key === 'enum') {
      const previousValues = new Set(arrayOfScalars(previousValue).map((value) => stableSerialize(value)));
      const candidateValues = new Set(arrayOfScalars(candidateValue).map((value) => stableSerialize(value)));
      if ([...previousValues].some((value) => !candidateValues.has(value))) return true;
      continue;
    }
    if (key === 'unevaluatedProperties') {
      if (candidateValue === false && previousValue !== false) return true;
      if (stableSerialize(previousValue) !== stableSerialize(candidateValue)) return true;
      continue;
    }
    if (key === 'maxLength' || key === 'maximum' || key === 'maxItems' || key === 'maxProperties' || key === 'maxContains' || key === 'exclusiveMaximum') {
      if (typeof previousValue === 'number' && typeof candidateValue === 'number' && candidateValue < previousValue) return true;
      continue;
    }
    if (key === 'minLength' || key === 'minimum' || key === 'minItems' || key === 'minProperties' || key === 'minContains' || key === 'exclusiveMinimum') {
      if (typeof previousValue === 'number' && typeof candidateValue === 'number' && candidateValue > previousValue) return true;
      continue;
    }
    if (stableSerialize(previousValue) !== stableSerialize(candidateValue)) return true;
  }

  const previousRequired = new Set(effectiveRequired(previousOption));
  if (arrayOfStrings(candidate.required).some((field) => !previousRequired.has(field))) return true;
  const candidateAdditionalProperties = inheritedConstraint(candidate, 'additionalProperties');
  const previousAdditionalProperties = inheritedConstraint(previousOption, 'additionalProperties');
  if (candidateAdditionalProperties !== undefined
    && candidateAdditionalProperties !== true
    && (previousAdditionalProperties === undefined || previousAdditionalProperties === true)) return true;
  if (isRecord(candidateAdditionalProperties) && isRecord(previousAdditionalProperties)
    && hasBreakingChange(previousAdditionalProperties, candidateAdditionalProperties, 'composition.additionalProperties')) return true;

  const previousProperties = effectiveProperties(previousOption);
  if (isRecord(candidate.properties)) {
    for (const [property, candidateSchema] of Object.entries(candidate.properties)) {
      const previousSchema = previousProperties[property];
      if (previousSchema !== undefined && isRecord(candidateSchema) && isRecord(previousSchema) && hasBreakingChange(previousSchema, candidateSchema, `composition.properties.${property}`)) return true;
    }
  }
  const candidateItems = inheritedConstraint(candidate, 'items');
  const previousItems = inheritedConstraint(previousOption, 'items');
  if (candidateItems !== undefined && previousItems === undefined) return true;
  if (isRecord(candidateItems) && isRecord(previousItems) && hasBreakingChange(previousItems, candidateItems, 'composition.items')) return true;
  return false;
}

function flattenAllOfForContainment(schema: RecordValue): RecordValue {
  const flattened: RecordValue = { ...schema };
  delete flattened.allOf;
  const required = effectiveRequired(schema);
  if (required.length > 0) flattened.required = required;
  const properties = effectiveProperties(schema);
  const flattenedProperties: RecordValue = {};
  for (const [property, propertySchema] of Object.entries(properties)) {
    flattenedProperties[property] = isRecord(propertySchema) && Array.isArray(propertySchema.allOf)
      ? flattenAllOfForContainment(propertySchema)
      : propertySchema;
  }
  if (Object.keys(flattenedProperties).length > 0) flattened.properties = flattenedProperties;
  for (const key of containmentConstraintKeys) {
    const value = inheritedConstraint(schema, key);
    if (value !== undefined) flattened[key] = value;
  }
  const additionalProperties = inheritedConstraint(schema, 'additionalProperties');
  if (additionalProperties !== undefined) flattened.additionalProperties = additionalProperties;
  return flattened;
}

function equivalentAfterAllOfFlattening(left: RecordValue, right: RecordValue): boolean {
  const leftHasAllOf = Array.isArray(left.allOf);
  const rightHasAllOf = Array.isArray(right.allOf);
  if (!leftHasAllOf && !rightHasAllOf) return false;
  if (hasUnsupportedSchemaKeyword(left) || hasUnsupportedSchemaKeyword(right)) return false;
  return stableSerialize(canonicalAllOfSchema(left)) === stableSerialize(canonicalAllOfSchema(right));
}

function canonicalAllOfSchema(schema: RecordValue): RecordValue {
  const result: RecordValue = {};
  const allOfBranches = Array.isArray(schema.allOf) ? schema.allOf.filter(isRecord) : [];
  const hasConflictingAllOfConstraint = allOfBranches.some((branch, index) => [...containmentConstraintKeys, 'additionalProperties'].some((key) => {
    const value = inheritedConstraint(branch, key);
    if (value === undefined) return false;
    return allOfBranches.slice(index + 1).some((other) => {
      const otherValue = inheritedConstraint(other, key);
      return otherValue !== undefined && stableSerialize(value) !== stableSerialize(otherValue);
    });
  }));
  for (const key of containmentConstraintKeys) {
    const value = inheritedConstraint(schema, key);
    if (value !== undefined) result[key] = value;
  }
  const additionalProperties = inheritedConstraint(schema, 'additionalProperties');
  if (additionalProperties !== undefined) {
    result.additionalProperties = isRecord(additionalProperties)
      ? canonicalAllOfSchema(additionalProperties)
      : additionalProperties;
  }
  const required = effectiveRequired(schema);
  if (required.length > 0) result.required = [...new Set(required)].sort();
  const properties = effectiveProperties(schema);
  if (Object.keys(properties).length > 0) {
    result.properties = Object.fromEntries(Object.entries(properties)
      .map(([property, value]): [string, unknown] => [property, isRecord(value) ? canonicalAllOfSchema(value) : value])
      .sort(([left], [right]) => left.localeCompare(right)));
  }
  if (schema.items !== undefined) result.items = isRecord(schema.items) ? canonicalAllOfSchema(schema.items) : schema.items;
  for (const key of ['oneOf', 'anyOf'] as const) {
    const direct = Array.isArray(schema[key]) ? schema[key] : undefined;
    const inherited = direct ?? (Array.isArray(schema.allOf)
      ? schema.allOf.filter(isRecord).flatMap((branch) => Array.isArray(branch[key]) ? [branch[key]] : [])
      : []);
    if (inherited.length === 0) continue;
    const options = inherited.length === 1 && Array.isArray(inherited[0]) ? inherited[0] : inherited;
    result[key] = options.map((option) => isRecord(option) ? canonicalAllOfSchema(option) : option)
      .sort((left, right) => stableSerialize(left).localeCompare(stableSerialize(right)));
  }
  if (hasConflictingAllOfConstraint) {
    result.allOf = allOfBranches.map((branch) => canonicalAllOfSchema(branch))
      .sort((left, right) => stableSerialize(left).localeCompare(stableSerialize(right)));
  }
  return result;
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
  const context: CollectionContext = {
    sourceIds: new WeakMap<object, string>(),
    occurrenceSources: new WeakMap<object, SourceOccurrence[]>(),
  };
  collectionContexts.set(changes, context);
  indexSourceObjects(previous, 'previous', context);
  indexSourceObjects(next, 'next', context);
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
  const result = [...unique.values()].map((change) => ({
    ...change,
    affectedPaths: groupedPaths.get(change.logicalIdentity) ?? [change.jsonPath],
  }));
  collectionContexts.delete(changes);
  return result;
}

function collectValue(previous: unknown, next: unknown, path: string, changes: BreakingChange[]): void {
  if (shouldStop(changes)) return;
  if (!isRecord(previous) || !isRecord(next)) {
    if (JSON.stringify(previous) !== JSON.stringify(next)) addChange(changes, path, 'value changed.', previous, next);
    return;
  }
  const previousObject = previous as object;
  const nextObject = next as object;
  const pairs = activeComparisons.get(changes) ?? new WeakMap<object, WeakSet<object>>();
  activeComparisons.set(changes, pairs);
  const nextObjects = pairs.get(previousObject) ?? new WeakSet<object>();
  if (nextObjects.has(nextObject)) return;
  nextObjects.add(nextObject);
  pairs.set(previousObject, nextObjects);
  try {
    collectValueObject(previous, next, path, changes);
  } finally {
    nextObjects.delete(nextObject);
  }
}

function collectValueObject(previous: RecordValue, next: RecordValue, path: string, changes: BreakingChange[]): void {
  if (shouldStop(changes)) return;

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
    if (!nextRequired.has(field)) addChange(changes, `${path}.${field}.required`, 'required field was removed.', true, false, field, previous);
  }
  for (const field of nextRequired) {
    if (!previousRequired.has(field)) addChange(changes, `${path}.${field}.required`, 'field became required.', false, true, field, previous);
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
    if (previousEntry.required === true && match.required !== true) addChange(changes, `${entryPath}.required`, 'required parameter was relaxed unexpectedly.', true, match.required ?? false, identityValue, previousEntry);
    if (previousEntry.required !== true && match.required === true) addChange(changes, `${entryPath}.required`, 'optional parameter became required.', previousEntry.required ?? false, true, identityValue, previousEntry);
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
  if (isRecord(previous) && previous.required === true && next.required !== true) addChange(changes, `${path}.required`, 'required request body was relaxed unexpectedly.', true, next.required ?? false, 'requestBody', previous);
  if (isRecord(previous) && previous.required !== true && next.required === true) addChange(changes, `${path}.required`, 'request body became required.', previous.required ?? false, true, 'requestBody', previous);
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
  collectUnsupportedSchemaKeywords(previous, next, path, changes);
  if (shouldStop(changes)) return;
  for (const key of [
    'type', 'format', 'pattern', 'const', 'minLength', 'maxLength', 'minimum', 'maximum',
    'exclusiveMinimum', 'exclusiveMaximum', 'minItems', 'maxItems', 'minProperties', 'maxProperties',
    'minContains', 'maxContains', 'contains', 'propertyNames', 'dependentRequired',
    'dependentSchemas', 'prefixItems', 'patternProperties', 'unevaluatedItems',
    'unevaluatedProperties', 'not', 'if', 'then', 'else',
  ] as const) {
    const previousValue = inheritedConstraint(previous, key);
    const nextValue = inheritedConstraint(next, key);
    if (previousValue === undefined) {
      if (nextValue !== undefined) addChange(changes, `${path}.${key}`, `candidate-only constraint ${key} narrowed the value space.`, undefined, nextValue, key, previous);
      continue;
    }
    if (nextValue === undefined) {
      addChange(changes, `${path}.${key}`, `constraint ${key} was removed.`, previousValue, undefined, key, previous);
      continue;
    }
    const narrowed = key === 'maxLength' || key === 'maximum' || key === 'exclusiveMaximum' || key === 'maxItems' || key === 'maxProperties' || key === 'maxContains'
      ? typeof previousValue === 'number' && typeof nextValue === 'number' && nextValue < previousValue
      : key === 'minLength' || key === 'minimum' || key === 'exclusiveMinimum' || key === 'minItems' || key === 'minProperties' || key === 'minContains'
        ? typeof previousValue === 'number' && typeof nextValue === 'number' && nextValue > previousValue
        : JSON.stringify(previousValue) !== JSON.stringify(nextValue);
    if (narrowed) addChange(changes, `${path}.${key}`, `constraint ${key} was narrowed.`, previousValue, nextValue, key, previous);
  }

  const previousAdditionalProperties = inheritedConstraint(previous, 'additionalProperties');
  const nextAdditionalProperties = inheritedConstraint(next, 'additionalProperties');
  if ((previousAdditionalProperties === true || previousAdditionalProperties === undefined)
    && nextAdditionalProperties !== undefined && nextAdditionalProperties !== true) {
    addChange(changes, `${path}.additionalProperties`, 'additional properties were narrowed.', previousAdditionalProperties ?? true, nextAdditionalProperties, 'additionalProperties', previous);
  } else if (isRecord(previousAdditionalProperties) && isRecord(nextAdditionalProperties)) {
    collectValue(previousAdditionalProperties, nextAdditionalProperties, `${path}.additionalProperties`, changes);
  }

  const previousEnumValue = inheritedConstraint(previous, 'enum');
  const previousEnum = arrayOfScalars(previousEnumValue);
  const nextEnumValue = inheritedConstraint(next, 'enum');
  if (previousEnumValue === undefined && nextEnumValue !== undefined) addChange(changes, `${path}.enum`, 'candidate-only enum narrowed the value space.', undefined, nextEnumValue, 'enum', previous);
  if (previousEnum.length > 0) {
    const nextEnum = new Set(arrayOfScalars(nextEnumValue).map((value) => JSON.stringify(value)));
    for (const value of previousEnum) {
      if (!nextEnum.has(JSON.stringify(value))) addChange(changes, `${path}.enum`, `enum value ${String(value)} was removed.`, previousEnumValue, nextEnumValue, 'enum', previous);
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
      if (key === 'allOf' && Array.isArray(nextOptions) && equivalentAfterAllOfFlattening(previous, next)) continue;
      if (Array.isArray(nextOptions)) addChange(changes, `${path}.${key}`, `${key} was added as a candidate-only composition.`, undefined, nextOptions, key);
      continue;
    }
    if (!Array.isArray(nextOptions)) {
      if (key === 'allOf' && allOfFlattenedIntoWithoutThrowing(previous, next)) continue;
      addChange(changes, `${path}.${key}`, `${key} was removed.`, previousOptions, undefined, key);
      continue;
    }
    if (key === 'allOf' && equivalentAfterAllOfFlattening(previous, next)) continue;
    if (key === 'oneOf' && nextOptions.length > previousOptions.length) {
      addChange(changes, `${path}.${key}`, 'oneOf option was added without a disjointness proof.', previousOptions, nextOptions, key);
    }

    const inheritedRequired = new Set(effectiveRequired(previous));
    const matchedPreviousIndexes = matchCompositionOptions(previousOptions, nextOptions, inheritedRequired);
    for (let index = 0; index < previousOptions.length; index += 1) {
      if (matchedPreviousIndexes.has(index)) continue;
      const previousOption = previousOptions[index];
      addChange(changes, `${path}.${key}[${index}]`, `a ${key} option was removed.`, previousOption, undefined, `${key}:option:${fingerprint(previousOption)}`, previousOption);
    }
  }
}

function matchCompositionOptions(previousOptions: unknown[], nextOptions: unknown[], inheritedRequired: Set<string>): Set<number> {
  const matchedPrevious = new Set<number>();
  const reusableCandidates = new Set<number>();

  // A nested composition is a single candidate branch that can intentionally
  // contain several old branches. It must not be consumed by the first old
  // option that happens to match it.
  for (let candidateIndex = 0; candidateIndex < nextOptions.length; candidateIndex += 1) {
    const candidate = nextOptions[candidateIndex];
    const covered = previousOptions.filter((previousOption) => schemaContainsCompatibleOption(candidate, previousOption, inheritedRequired));
    if (covered.length < 2 || !isRecord(candidate)) continue;
    const hasNestedComposition = ['oneOf', 'anyOf', 'allOf'].some((key) => Array.isArray(candidate[key]));
    if (!hasNestedComposition) continue;
    reusableCandidates.add(candidateIndex);
    for (let index = 0; index < previousOptions.length; index += 1) {
      if (schemaContainsCompatibleOption(candidate, previousOptions[index], inheritedRequired)) matchedPrevious.add(index);
    }
  }

  // For ordinary branches use deterministic maximum bipartite matching. A
  // greedy first match can consume a branch needed by a later, more specific
  // option and manufacture a false removal.
  const assignedCandidate = new Map<number, number>();
  const match = (previousIndex: number, visited: Set<number>): boolean => {
    for (let candidateIndex = 0; candidateIndex < nextOptions.length; candidateIndex += 1) {
      if (reusableCandidates.has(candidateIndex) || visited.has(candidateIndex)) continue;
      if (!schemaContainsCompatibleOption(nextOptions[candidateIndex], previousOptions[previousIndex], inheritedRequired)) continue;
      visited.add(candidateIndex);
      const assignedPrevious = assignedCandidate.get(candidateIndex);
      if (assignedPrevious === undefined || match(assignedPrevious, visited)) {
        assignedCandidate.set(candidateIndex, previousIndex);
        return true;
      }
    }
    return false;
  };

  for (let previousIndex = 0; previousIndex < previousOptions.length; previousIndex += 1) {
    if (matchedPrevious.has(previousIndex)) continue;
    if (match(previousIndex, new Set())) matchedPrevious.add(previousIndex);
  }
  return matchedPrevious;
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
  source?: unknown,
): void {
  if (shouldStop(changes)) return;
  const kind = stableIdentity ?? 'value';
  const sourceIdentity = getSourceIdentity(changes, source ?? objectValue(oldValue) ?? objectValue(newValue), jsonPath);
  const logicalIdentity = `${sourceIdentity}#${kind}#${fingerprint(reason)}#${identityFingerprint(oldValue, kind)}->${identityFingerprint(newValue, kind)}`;
  changes.push({
    jsonPath,
    reason,
    oldValue,
    newValue,
    affectedPaths: [jsonPath],
    stableIdentity: `${canonicalChangePath(jsonPath)}#${logicalIdentity}`,
    logicalIdentity,
    sourceIdentity,
  });
}

function getSourceIdentity(changes: BreakingChange[], source: unknown, jsonPath: string): string {
  if (typeof source !== 'object' || source === null) return 'value';
  const context = collectionContexts.get(changes);
  if (context === undefined) return 'value';
  const object = source as object;
  const occurrences = context.occurrenceSources.get(object);
  if (occurrences !== undefined) {
    for (const candidate of compositionPathCandidates(jsonPath).reverse()) {
      const matching = occurrences.find((occurrence) => occurrence.arrayPath === candidate.arrayPath && occurrence.index === candidate.index);
      if (matching !== undefined) return matching.sourceIdentity;
    }
  }
  const existing = context.sourceIds.get(object);
  return existing ?? `unindexed-${fingerprint(source)}`;
}

function compositionPathCandidates(path: string): Array<{ arrayPath: string; index: number }> {
  const candidates: Array<{ arrayPath: string; index: number }> = [];
  const pattern = /(?:^|\.)(oneOf|anyOf|allOf)\[(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(path)) !== null) {
    const prefix = path.slice(0, match.index);
    candidates.push({
      arrayPath: `${prefix}.${match[1]}`.replace(/^(root|previous|next)\./, ''),
      index: Number(match[2]),
    });
  }
  return candidates;
}

function objectValue(value: unknown): object | undefined {
  return typeof value === 'object' && value !== null ? value : undefined;
}

function shouldStop(changes: BreakingChange[]): boolean {
  return changes.length >= (collectionLimits.get(changes) ?? Number.POSITIVE_INFINITY);
}

function fingerprint(value: unknown): string {
  return createHash('sha256').update(stableSerialize(value)).digest('hex');
}

function identityFingerprint(value: unknown, kind: string): string {
  const composition = /^(oneOf|anyOf|allOf)(?::|$)/.test(kind);
  return createHash('sha256').update(stableSerialize(value, undefined, composition)).digest('hex');
}

function canonicalChangePath(path: string): string {
  return path.replace(/\.(oneOf|anyOf|allOf)\[\d+\]/g, '.$1[*]');
}

function stableSerialize(value: unknown, seen = new WeakSet<object>(), canonicalizeCompositions = false): string {
  if (value === undefined) return 'undefined';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (seen.has(value)) return '"[Circular]"';
  seen.add(value);
  let serialized: string;
  if (Array.isArray(value)) {
    const items = value.map((item) => stableSerialize(item, seen, canonicalizeCompositions));
    if (canonicalizeCompositions) items.sort();
    serialized = `[${items.join(',')}]`;
  } else {
    serialized = `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize((value as Record<string, unknown>)[key], seen, canonicalizeCompositions && ['oneOf', 'anyOf', 'allOf'].includes(key))}`).join(',')}}`;
  }
  seen.delete(value);
  return serialized;
}

function indexSourceObjects(value: unknown, rootPath: string, context: CollectionContext): void {
  const occurrenceVisited = new WeakMap<object, Set<string>>();
  const visit = (current: unknown, path: string, inheritedOccurrences: readonly SourceOccurrence[] = []): void => {
    if (isRecord(current)) {
      let addedOccurrence = inheritedOccurrences.length === 0;
      for (const occurrence of inheritedOccurrences) {
        const seen = occurrenceVisited.get(current) ?? new Set<string>();
        if (seen.has(occurrence.sourceIdentity)) continue;
        addedOccurrence = true;
        seen.add(occurrence.sourceIdentity);
        occurrenceVisited.set(current, seen);
        const sources = context.occurrenceSources.get(current) ?? [];
        if (!sources.some((candidate) => candidate.sourceIdentity === occurrence.sourceIdentity)) sources.push(occurrence);
        context.occurrenceSources.set(current, sources);
      }
      // A recursive dereferenced $ref can revisit the same object through an
      // already indexed occurrence. Do not descend into its children again;
      // doing so would recurse forever while adding no new provenance.
      if (!addedOccurrence) return;
      if (inheritedOccurrences.length === 0) {
        if (context.sourceIds.has(current)) return;
        context.sourceIds.set(current, path);
      }
      const keys = Object.keys(current).sort((left, right) => {
        if (path === rootPath && left === 'components') return -1;
        if (path === rootPath && right === 'components') return 1;
        return left.localeCompare(right);
      });
      for (const key of keys) visit(current[key], `${path}.${key}`, inheritedOccurrences);
      return;
    }
    if (!Array.isArray(current)) return;
    if (inheritedOccurrences.length === 0) {
      if (context.sourceIds.has(current)) return;
      context.sourceIds.set(current, path);
    }
    const occurrences = new Map<string, number>();
    current
      .map((item, index) => ({ item, index, identity: fingerprint(item) }))
      .sort((left, right) => left.identity.localeCompare(right.identity))
      .forEach(({ item, index, identity }) => {
        const occurrence = occurrences.get(identity) ?? 0;
        occurrences.set(identity, occurrence + 1);
        const arrayPath = normalizeSourcePath(path);
        const sourceIdentity = `${arrayPath}[${identity}${occurrence === 0 ? '' : `~${occurrence}`}]`;
        const ownOccurrence: SourceOccurrence = { arrayPath, index, sourceIdentity };
        const nextOccurrences = [...inheritedOccurrences, ownOccurrence];
        if (typeof item === 'object' && item !== null) {
          const sources = context.occurrenceSources.get(item) ?? [];
          if (!sources.some((candidate) => candidate.sourceIdentity === sourceIdentity)) sources.push(ownOccurrence);
          context.occurrenceSources.set(item, sources);
        }
        visit(item, `${path}[${identity}${occurrence === 0 ? '' : `~${occurrence}`}]`, nextOccurrences);
      });
  };
  visit(value, rootPath);
}

function normalizeSourcePath(path: string): string {
  return path.replace(/^(previous|next|root)\.?/, '');
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
