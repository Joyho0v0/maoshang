/* global process, URL, console */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import SwaggerParser from '@apidevtools/swagger-parser';
import openapiTS, { astToString } from 'openapi-typescript';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  if (process.argv[index].startsWith('--')) args.set(process.argv[index].slice(2), process.argv[index + 1]);
}
const output = resolve(args.get('out') ?? '');
if (!output || output === resolve('.')) throw new Error('Usage: node generate.mjs --out <temporary-directory>');
await mkdir(output, { recursive: true });

const source = parse(await readFile(new URL('./openapi.yaml', import.meta.url), 'utf8'));
const document = await SwaggerParser.dereference(source);
const operations = operationDefinitions(source);
await writeFile(resolve(output, 'document.json'), JSON.stringify(document, null, 2));
await writeFile(resolve(output, 'types.ts'), astToString(await openapiTS(source)));
await writeFile(resolve(output, 'runtime-validator.ts'), runtimeValidatorTypescript());
await writeFile(resolve(output, 'runtime-validator.mjs'), runtimeValidatorJavascript());
await writeFile(resolve(output, 'client.ts'), clientTypescript(operations));
await writeFile(resolve(output, 'client.mjs'), clientJavascript(operations));
await writeFile(resolve(output, 'tsconfig.json'), JSON.stringify({
  compilerOptions: { module: 'NodeNext', moduleResolution: 'NodeNext', target: 'ES2022', lib: ['ES2022', 'DOM', 'DOM.Iterable'], strict: true, esModuleInterop: true, skipLibCheck: true, types: ['node'] },
  include: ['types.ts', 'client.ts', 'runtime-validator.ts'],
}, null, 2));
console.log(JSON.stringify({
  output,
  baseUrl: document.servers?.[0]?.url ?? null,
  operationCount: operations.length,
  operationIds: operations.map((operation) => operation.operationId),
  generatedFiles: ['types.ts', 'client.ts', 'runtime-validator.ts', 'client.mjs', 'runtime-validator.mjs', 'document.json'],
}, null, 2));

function operationDefinitions(document) {
  const methods = new Set(['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace']);
  return Object.entries(document.paths ?? {}).flatMap(([path, item]) =>
    Object.entries(item).filter(([method]) => methods.has(method)).map(([method, operation]) => {
      const parameters = [...(item.parameters ?? []), ...(operation.parameters ?? [])].map((parameter) => resolveRef(source, parameter));
      const requestBody = resolveRef(source, operation.requestBody)?.content?.['application/json']?.schema;
      const responses = Object.fromEntries(Object.entries(operation.responses ?? {}).map(([status, response]) => {
        const resolved = resolveRef(source, response);
        const content = resolved.content?.['application/json'] ?? resolved.content?.['application/problem+json'];
        return [status, {
          schema: schemaName(content?.schema),
          contentType: resolved.content?.['application/problem+json'] ? 'application/problem+json' : content === undefined ? undefined : 'application/json',
          headers: Object.fromEntries(Object.entries(resolved.headers ?? {}).map(([name, header]) => {
            const resolvedHeader = resolveRef(source, header);
            return [name, { required: resolvedHeader.required === true, schema: resolvedHeader.schema }];
          })),
        }];
      }));
      return { operationId: operation.operationId, method: method.toUpperCase(), path, requestSchema: schemaName(requestBody), parameters, responses };
    }),
  );
}

function resolveRef(root, value) {
  if (value === undefined || typeof value !== 'object' || value === null || typeof value.$ref !== 'string') return value ?? {};
  const resolved = value.$ref.slice(2).split('/').reduce((current, part) => current?.[part], root);
  return { ...(resolved ?? {}), ...value };
}

function schemaName(value) {
  return typeof value?.$ref === 'string' && value.$ref.startsWith('#/components/schemas/') ? value.$ref.split('/').pop() : undefined;
}

function operationMetadata(operations) {
  return Object.fromEntries(operations.map((operation) => [operation.operationId, {
    method: operation.method,
    path: operation.path,
    requestSchema: operation.requestSchema,
    responses: operation.responses,
  }]));
}

function inputType(operation) {
  const path = operation.parameters.filter((parameter) => parameter.in === 'path');
  const query = operation.parameters.filter((parameter) => parameter.in === 'query');
  const headers = operation.parameters.filter((parameter) => parameter.in === 'header');
  const fields = [];
  if (path.length > 0) fields.push('pathParams: { ' + path.map((parameter) => parameter.name + ': string').join('; ') + ' }');
  if (query.length > 0) fields.push('query?: { ' + query.map((parameter) => JSON.stringify(parameter.name) + '?: string | number').join('; ') + ' }');
  if (headers.length > 0) fields.push('headers: Record<string, string>');
  if (operation.requestSchema !== undefined) fields.push('body: components[\'schemas\'][' + JSON.stringify(operation.requestSchema) + ']');
  return fields.length === 0 ? 'Record<never, never>' : '{ ' + fields.join('; ') + ' }';
}

function responseType(operation) {
  const responses = Object.entries(operation.responses).filter(([status]) => /^2\d\d$/.test(status)).map(([status, response]) =>
    'ContractResponse<' + (response.schema === undefined ? 'void' : 'components[\'schemas\'][' + JSON.stringify(response.schema) + ']') + ', ' + status + '>',
  );
  return responses.length === 0 ? 'never' : responses.join(' | ');
}

function errorType(operation) {
  const responses = Object.entries(operation.responses).filter(([status]) => /^[45]\d\d$/.test(status)).map(([, response]) =>
    response.schema === undefined ? 'unknown' : 'components[\'schemas\'][' + JSON.stringify(response.schema) + ']',
  );
  return responses.length === 0 ? 'never' : [...new Set(responses)].join(' | ');
}

function clientTypescript(operations) {
  const lines = [
    "import type { components } from './types.js';",
    "import type { RuntimeValidator } from './runtime-validator.js';",
    "export type ContractResponse<T, S extends number> = { readonly status: S; readonly data: T; readonly headers: Readonly<Record<string, string>> };",
    "export interface GeneratedV2ClientOptions { readonly baseUrl?: string; readonly fetch?: typeof globalThis.fetch; readonly validator: RuntimeValidator; }",
    "export const operations = " + JSON.stringify(operationMetadata(operations), null, 2) + " as const;",
    "export type OperationId = keyof typeof operations;",
    "export type OperationInputMap = {",
    ...operations.map((operation) => '  ' + JSON.stringify(operation.operationId) + ': ' + inputType(operation) + ';'),
    "};",
    "export type OperationResponseMap = {",
    ...operations.map((operation) => '  ' + JSON.stringify(operation.operationId) + ': ' + responseType(operation) + ';'),
    "};",
    "export type OperationErrorMap = {",
    ...operations.map((operation) => '  ' + JSON.stringify(operation.operationId) + ': ' + errorType(operation) + ';'),
    "};",
    "export class ApiProblemError<Id extends OperationId = OperationId> extends Error {",
    "  constructor(readonly status: number, readonly problem: OperationErrorMap[Id], readonly headers: Readonly<Record<string, string>>) { super('API request failed.'); this.name = 'ApiProblemError'; }",
    "}",
    "export class GeneratedV2Client {",
    "  private readonly baseUrl: string;",
    "  private readonly fetchImpl: typeof globalThis.fetch;",
    "  constructor(private readonly options: GeneratedV2ClientOptions) { this.baseUrl = (options.baseUrl ?? '/api/v2').replace(/\\/$/, ''); this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis); }",
    "  async call<Id extends OperationId>(operationId: Id, input: OperationInputMap[Id]): Promise<OperationResponseMap[Id]> {",
    "    const operation = operations[operationId];",
    "    const pathParams = ('pathParams' in input ? input.pathParams : {}) as Record<string, string>;",
    "    const path = operation.path.replace(/\\{([^}]+)\\}/g, (_match, name: string) => encodeURIComponent(pathParams[name] ?? (() => { throw new Error('Missing path parameter: ' + name); })()));",
    "    const absolute = /^https?:\\/\\//i.test(this.baseUrl);",
    "    const url = absolute ? new URL(this.baseUrl + path) : new URL(this.baseUrl + path, 'http://v2-contract.invalid');",
    "    for (const [key, value] of Object.entries(('query' in input ? input.query : {}) ?? {})) if (value !== undefined) url.searchParams.set(key, String(value));",
    "    const headers = new Headers({ Accept: 'application/json', ...(('headers' in input ? input.headers : undefined) as Record<string, string> | undefined) });",
    "    const body = 'body' in input ? input.body : undefined;",
    "    if (body !== undefined && !headers.has('content-type')) headers.set('content-type', 'application/json');",
    "    const response = await this.fetchImpl(absolute ? url.toString() : url.pathname + url.search, { method: operation.method, credentials: 'include', headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });",
    "    const contract = (operation.responses as Record<string, { schema?: string }>)[String(response.status)];",
    "    if (contract === undefined) throw new Error('Undeclared HTTP status ' + response.status);",
    "    const payload = await response.text().then((text) => text.length === 0 ? undefined : JSON.parse(text) as unknown);",
    "    if (contract.schema !== undefined && !this.options.validator.validate(contract.schema, payload)) throw new Error('Invalid response schema ' + contract.schema);",
    "    if (!response.ok) throw new ApiProblemError(response.status, payload as OperationErrorMap[Id], Object.fromEntries(response.headers.entries()));",
    "    return { status: response.status, data: payload as OperationResponseMap[Id], headers: Object.fromEntries(response.headers.entries()) } as unknown as OperationResponseMap[Id];",
    "  }",
    "}",
  ];
  return lines.join('\n') + '\n';
}

function clientJavascript(operations) {
  return [
    'export const operations = ' + JSON.stringify(operationMetadata(operations), null, 2) + ';',
    "export class GeneratedV2Client {",
    "  constructor(options = {}) { this.baseUrl = (options.baseUrl ?? '/api/v2').replace(/\\/$/, ''); this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis); this.validator = options.validator; }",
    "  async call(operationId, input = {}) {",
    "    const operation = operations[operationId];",
    "    if (operation === undefined) throw new Error('Unknown operation ' + operationId);",
    "    const path = operation.path.replace(/\\{([^}]+)\\}/g, (_match, name) => encodeURIComponent(input.pathParams?.[name] ?? (() => { throw new Error('Missing path parameter: ' + name); })()));",
    "    const absolute = /^https?:\\/\\//i.test(this.baseUrl);",
    "    const url = absolute ? new URL(this.baseUrl + path) : new URL(this.baseUrl + path, 'http://v2-contract.invalid');",
    "    for (const [key, value] of Object.entries(input.query ?? {})) if (value !== undefined) url.searchParams.set(key, String(value));",
    "    const headers = new Headers({ Accept: 'application/json', ...(input.headers ?? {}) });",
    "    if (input.body !== undefined && !headers.has('content-type')) headers.set('content-type', 'application/json');",
    "    const response = await this.fetchImpl(absolute ? url.toString() : url.pathname + url.search, { method: operation.method, credentials: 'include', headers, ...(input.body === undefined ? {} : { body: JSON.stringify(input.body) }) });",
    "    const contract = operation.responses[String(response.status)];",
    "    if (contract === undefined) throw new Error('Undeclared HTTP status ' + response.status);",
    "    const payload = await response.text().then((text) => text.length === 0 ? undefined : JSON.parse(text));",
    "    if (contract.schema !== undefined && !this.validator.validate(contract.schema, payload)) throw new Error('Invalid response schema ' + contract.schema);",
    "    if (!response.ok) { const error = new Error('API request failed.'); error.status = response.status; error.problem = payload; throw error; }",
    "    return { status: response.status, data: payload, headers: Object.fromEntries(response.headers.entries()) };",
    "  }",
    "}",
  ].join('\n') + '\n';
}

function runtimeValidatorTypescript() {
  return [
    "import Ajv2020Module from 'ajv/dist/2020.js';",
    "import addFormatsModule from 'ajv-formats';",
    "const Ajv2020 = Ajv2020Module as unknown as new (options?: object) => { addSchema: (schema: object, key: string) => void; compile: (schema: object) => ((value: unknown) => boolean) & { errors?: unknown[] | null }; };",
    "const addFormats = addFormatsModule as unknown as (instance: object) => void;",
    "export interface RuntimeValidator { validate(schemaName: string, value: unknown): boolean; readonly errors: unknown[] | null | undefined; }",
    "export function createV2RuntimeValidator(document: Record<string, unknown>): RuntimeValidator {",
    "  const ajv = new Ajv2020({ allErrors: true, strict: false, allowUnionTypes: true });",
    "  addFormats(ajv);",
    "  const schemas = (document.components as { schemas?: Record<string, object> }).schemas ?? {};",
    "  for (const [name, schema] of Object.entries(schemas)) ajv.addSchema(schema, '#/components/schemas/' + name);",
    "  const validators = new Map<string, ((value: unknown) => boolean) & { errors?: unknown[] | null }>();",
    "  let errors: unknown[] | null | undefined;",
    "  return { validate(schemaName, value) { let validator = validators.get(schemaName); if (validator === undefined) { const compiled = ajv.compile({ $ref: '#/components/schemas/' + schemaName }); validator = compiled; validators.set(schemaName, compiled); } const current = validator!; const valid = current(value); errors = current.errors; return valid; }, get errors() { return errors; } };",
    "}",
  ].join('\n') + '\n';
}

function runtimeValidatorJavascript() {
  return [
    "import Ajv2020 from 'ajv/dist/2020.js';",
    "import addFormats from 'ajv-formats';",
    "export function createV2RuntimeValidator(document) {",
    "  const ajv = new Ajv2020({ allErrors: true, strict: false, allowUnionTypes: true });",
    "  addFormats(ajv);",
    "  const validators = new Map(); let errors;",
    "  for (const [name, schema] of Object.entries(document.components?.schemas ?? {})) ajv.addSchema(schema, '#/components/schemas/' + name);",
    "  return { validate(schemaName, value) { let validator = validators.get(schemaName); if (validator === undefined) { validator = ajv.compile({ $ref: '#/components/schemas/' + schemaName }); validators.set(schemaName, validator); } const valid = validator(value); errors = validator.errors; return valid; }, get errors() { return errors; } };",
    "}",
  ].join('\n') + '\n';
}
