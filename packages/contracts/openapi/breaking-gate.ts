import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve as resolvePath } from 'node:path';
import SwaggerParser from '@apidevtools/swagger-parser';
import { parse } from 'yaml';

type RecordValue = Record<string, unknown>;

export function assertNoBreakingChanges(previous: unknown, next: unknown, path = 'root'): void {
  if (!isRecord(previous) || !isRecord(next)) {
    if (JSON.stringify(previous) !== JSON.stringify(next)) throw new Error(`Breaking change at ${path}: value changed.`);
    return;
  }

  compareCommonSchemaConstraints(previous, next, path);

  if (path === 'root' && (previous.openapi !== undefined || previous.paths !== undefined)) {
    compareOpenApiDocument(previous, next, path);
    return;
  }

  const previousRequired = arrayOfStrings(previous.required);
  const nextRequired = new Set(arrayOfStrings(next.required));
  for (const field of previousRequired) {
    if (!nextRequired.has(field)) throw new Error(`Breaking change at ${path}: required field ${field} was removed.`);
  }
  const previousRequiredSet = new Set(previousRequired);
  for (const field of nextRequired) {
    if (!previousRequiredSet.has(field)) throw new Error(`Breaking change at ${path}: field ${field} became required.`);
  }

  const previousProperties = isRecord(previous.properties) ? previous.properties : {};
  const nextProperties = isRecord(next.properties) ? next.properties : {};
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

  compareComposition(previous, next, path);
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
    const previousValue = previous[key];
    const nextValue = next[key];
    if (previousValue === undefined) continue;
    if (nextValue === undefined) throw new Error(`Breaking change at ${path}: constraint ${key} was removed.`);
    if (key === 'maxLength' || key === 'maximum' || key === 'maxItems') {
      if (typeof previousValue === 'number' && typeof nextValue === 'number' && nextValue < previousValue) throw new Error(`Breaking change at ${path}: constraint ${key} was narrowed.`);
    } else if (key === 'minLength' || key === 'minimum' || key === 'minItems') {
      if (typeof previousValue === 'number' && typeof nextValue === 'number' && nextValue > previousValue) throw new Error(`Breaking change at ${path}: constraint ${key} was narrowed.`);
    } else if (JSON.stringify(previousValue) !== JSON.stringify(nextValue)) {
      throw new Error(`Breaking change at ${path}: constraint ${key} changed.`);
    }
  }

  if (previous.additionalProperties === true && next.additionalProperties === false) {
    throw new Error(`Breaking change at ${path}: additional properties were disallowed.`);
  }

  const previousEnum = arrayOfScalars(previous.enum);
  if (previousEnum.length > 0) {
    const nextEnum = new Set(arrayOfScalars(next.enum).map((value) => JSON.stringify(value)));
    for (const value of previousEnum) {
      if (!nextEnum.has(JSON.stringify(value))) throw new Error(`Breaking change at ${path}: enum value ${String(value)} was removed.`);
    }
  }
}

function compareComposition(previous: RecordValue, next: RecordValue, path: string): void {
  for (const key of ['oneOf', 'anyOf'] as const) {
    if (!Array.isArray(previous[key])) continue;
    if (!Array.isArray(next[key])) throw new Error(`Breaking change at ${path}: ${key} was removed.`);
    for (const previousOption of previous[key]) {
      if (!next[key].some((candidate) => JSON.stringify(candidate) === JSON.stringify(previousOption))) throw new Error(`Breaking change at ${path}: a ${key} option was removed.`);
    }
  }
}

function compareSecurity(previous: unknown, next: unknown, path: string): void {
  if (previous === undefined) {
    if (next !== undefined) throw new Error(`Breaking change at ${path}: security requirement was added.`);
    return;
  }
  if (!Array.isArray(next)) throw new Error(`Breaking change at ${path}: security requirement was removed.`);
  if (JSON.stringify(previous) !== JSON.stringify(next)) throw new Error(`Breaking change at ${path}: security requirement changed.`);
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
  await runBreakingGate(pathToFileURL(resolvePath(previousPath)), pathToFileURL(resolvePath(currentPath)));
}
