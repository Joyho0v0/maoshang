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
const operations = operationDefinitions(source);
const document = await SwaggerParser.dereference(source);
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
      return { operationId: operation.operationId, method: method.toUpperCase(), path, requestSchema: schemaName(requestBody), parameters, responses, cursorBinding: operation['x-cursor-binding'] };
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

function schemaType(value) {
  const name = schemaName(value);
  if (name !== undefined) return `components['schemas'][${JSON.stringify(name)}]`;
  if (value?.const !== undefined) return JSON.stringify(value.const);
  if (Array.isArray(value?.enum)) return value.enum.map((item) => JSON.stringify(item)).join(' | ');
  if (value?.type === 'integer' || value?.type === 'number') return 'number';
  if (value?.type === 'boolean') return 'boolean';
  if (value?.type === 'array') return `ReadonlyArray<${schemaType(value.items ?? {})}>`;
  if (Array.isArray(value?.anyOf)) return value.anyOf.map((item) => schemaType(item)).join(' | ');
  return 'string';
}

function headerTypeName(operationId) {
  return `${operationId[0].toUpperCase()}${operationId.slice(1)}Headers`;
}

function headerType(headers) {
  const entries = Object.entries(headers ?? {});
  if (entries.length === 0) return 'Record<never, never>';
  return `{ ${entries.map(([name, header]) => `${JSON.stringify(name)}${header.required ? '' : '?'}: ${schemaType(header.schema)}`).join('; ')} }`;
}

function operationMetadata(operations) {
  return Object.fromEntries(operations.map((operation) => [operation.operationId, {
    operationId: operation.operationId,
    method: operation.method,
    path: operation.path,
    requestSchema: operation.requestSchema,
    parameters: operation.parameters,
    responses: operation.responses,
    cursorBinding: operation.cursorBinding,
  }]));
}

function inputType(operation) {
  const path = operation.parameters.filter((parameter) => parameter.in === 'path');
  const query = operation.parameters.filter((parameter) => parameter.in === 'query');
  const headers = operation.parameters.filter((parameter) => parameter.in === 'header');
  const fields = [];
  if (path.length > 0) fields.push('pathParams: { ' + path.map((parameter) => JSON.stringify(parameter.name) + ': ' + schemaType(parameter.schema)).join('; ') + ' }');
  if (query.length > 0) fields.push('query?: { ' + query.map((parameter) => JSON.stringify(parameter.name) + (parameter.required ? '' : '?') + ': ' + schemaType(parameter.schema)).join('; ') + ' }');
  if (headers.length > 0) fields.push('headers: ' + headerTypeName(operation.operationId));
  if (operation.requestSchema !== undefined) fields.push('body: components[\'schemas\'][' + JSON.stringify(operation.requestSchema) + ']');
  return fields.length === 0 ? 'Record<never, never>' : '{ ' + fields.join('; ') + ' }';
}

function responseType(operation) {
  const responses = Object.entries(operation.responses).filter(([status]) => /^2\d\d$/.test(status)).map(([status, response]) =>
    'ContractResponse<' + (response.schema === undefined ? 'void' : 'components[\'schemas\'][' + JSON.stringify(response.schema) + ']') + ', ' + status + ', ' + headerType(response.headers) + '>',
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
    "export type ContractResponse<T, S extends number, H extends Record<string, unknown> = Record<string, string>> = { readonly status: S; readonly data: T; readonly headers: Readonly<H> };",
    "export interface GeneratedV2ClientOptions { readonly baseUrl?: string; readonly fetch?: typeof globalThis.fetch; readonly validator: RuntimeValidator; }",
    "export const operations = " + JSON.stringify(operationMetadata(operations), null, 2) + " as const;",
    "export type OperationId = keyof typeof operations;",
    ...operations.filter((operation) => operation.parameters.some((parameter) => parameter.in === 'header')).map((operation) => 'export type ' + headerTypeName(operation.operationId) + ' = ' + headerType(Object.fromEntries(operation.parameters.filter((parameter) => parameter.in === 'header').map((parameter) => [parameter.name, { required: parameter.required === true, schema: parameter.schema }]))) + ';'),
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
    "    validateOperationInput(operation, input as Record<string, unknown>, this.options.validator);",
    "    const pathParams = ('pathParams' in input ? input.pathParams : {}) as Record<string, string>;",
    "    const path = operation.path.replace(/\\{([^}]+)\\}/g, (_match, name: string) => encodeURIComponent(pathParams[name] ?? (() => { throw new Error('Missing path parameter: ' + name); })()));",
    "    const absolute = /^https?:\\/\\//i.test(this.baseUrl);",
    "    const url = absolute ? new URL(this.baseUrl + path) : new URL(this.baseUrl + path, 'http://v2-contract.invalid');",
    "    for (const [key, value] of Object.entries(('query' in input ? input.query : {}) ?? {})) if (value !== undefined) url.searchParams.set(key, String(value));",
    "    const headers = new Headers({ Accept: 'application/json', ...(('headers' in input ? input.headers : undefined) as Record<string, string> | undefined) });",
    "    const body = 'body' in input ? input.body : undefined;",
    "    if (body !== undefined && !headers.has('content-type')) headers.set('content-type', 'application/json');",
    "    const response = await this.fetchImpl(absolute ? url.toString() : url.pathname + url.search, { method: operation.method, credentials: 'include', headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });",
    "    const contract = (operation.responses as Record<string, { schema?: string; headers?: Record<string, { required: boolean; schema?: object }> }>)[String(response.status)];",
    "    if (contract === undefined) throw new Error('Undeclared HTTP status ' + response.status);",
    "    const payload = await response.text().then((text) => text.length === 0 ? undefined : JSON.parse(text) as unknown);",
    "    const responseHeaders: Record<string, string> = {}; for (const [name, header] of Object.entries(contract.headers ?? {})) { const value = response.headers.get(name); if (value === null && header.required) throw new Error('Missing required response header ' + name); if (value !== null && header.schema !== undefined && !this.options.validator.validateSchema(header.schema, value)) throw new Error('Invalid response header ' + name); if (value !== null) responseHeaders[name] = value; }",
    "    for (const name of ['X-Request-ID', 'ETag', 'Location', 'Content-Location', 'Cache-Control', 'Retry-After', 'Idempotent-Replay']) if (!(name in (contract.headers ?? {})) && response.headers.get(name) !== null) throw new Error('Forbidden response header ' + name);",
    "    validateResponseSemantics(operation, response.status, payload, responseHeaders);",
    "    if (contract.schema !== undefined && !this.options.validator.validate(contract.schema, payload)) throw new Error('Invalid response schema ' + contract.schema);",
    "    if (!response.ok) throw new ApiProblemError(response.status, payload as OperationErrorMap[Id], responseHeaders);",
    "    return { status: response.status, data: payload as OperationResponseMap[Id], headers: responseHeaders } as unknown as OperationResponseMap[Id];",
    "  }",
    "}",
    "function findHeader(headers: Record<string, unknown> | undefined, name: string): unknown { const key = Object.keys(headers ?? {}).find((candidate) => candidate.toLowerCase() === name.toLowerCase()); return key === undefined ? undefined : headers?.[key]; }",
    "function validateOperationInput(operation: { readonly operationId: string; readonly parameters?: readonly { readonly name: string; readonly in: string; readonly required?: boolean; readonly schema?: object }[]; readonly requestSchema?: string; readonly cursorBinding?: { readonly resource?: string; readonly defaultSort?: string } }, input: Record<string, unknown>, validator: RuntimeValidator): void {",
    "  const containers: Record<string, Record<string, unknown> | undefined> = { path: (input.pathParams as Record<string, unknown> | undefined), query: (input.query as Record<string, unknown> | undefined), header: (input.headers as Record<string, unknown> | undefined) };",
    "  const declaredHeaders = new Set((operation.parameters ?? []).filter((parameter) => parameter.in === 'header').map((parameter) => parameter.name.toLowerCase()));",
    "  for (const parameter of operation.parameters ?? []) { const value = parameter.in === 'header' ? findHeader(containers.header, parameter.name) : containers[parameter.in]?.[parameter.name]; if (value === undefined) { if (parameter.required) throw new Error('Missing required ' + parameter.in + ' parameter: ' + parameter.name); continue; } if (parameter.in === 'header' && typeof value !== 'string') throw new Error('Invalid header: ' + parameter.name); if (parameter.schema !== undefined && !validator.validateSchema(parameter.schema, value)) throw new Error('Invalid ' + parameter.in + ' parameter: ' + parameter.name); }",
    "  for (const name of Object.keys(containers.header ?? {})) if (!declaredHeaders.has(name.toLowerCase())) throw new Error('Unknown header: ' + name);",
    "  if (operation.requestSchema !== undefined) { if (!Object.hasOwn(input, 'body') || !validator.validate(operation.requestSchema, input.body)) throw new Error('Invalid ' + operation.requestSchema + ' request body.'); } else if (Object.hasOwn(input, 'body')) throw new Error('Operation does not accept a request body.');",
    "  validateSemanticInput(operation, input, validator);",
    "}",
    "function validateSemanticInput(operation: { readonly operationId: string; readonly cursorBinding?: { readonly resource?: string; readonly defaultSort?: string } }, input: Record<string, unknown>, validator: RuntimeValidator): void {",
    "  const query = input.query as Record<string, unknown> | undefined; if (operation.cursorBinding && query?.['page[after]'] !== undefined) validateCursorBinding(operation, query);",
    "  const body = input.body as Record<string, unknown> | undefined; if (operation.operationId === 'updateOrderV2' && body?.lines !== undefined) { const ids = new Set<string>(); const images = new Set<string>(); for (const line of body.lines as Array<Record<string, unknown>>) { if (line.lineId !== null && ids.has(String(line.lineId))) throw new Error('Duplicate replacement lineId'); if (line.lineId !== null) ids.add(String(line.lineId)); if (line.imageFileId !== null && images.has(String(line.imageFileId))) throw new Error('An image file cannot be reused by multiple lines'); if (line.imageFileId !== null) images.add(String(line.imageFileId)); } }",
    "}",
    "function validateCursorBinding(operation: { readonly operationId: string; readonly cursorBinding?: { readonly resource?: string; readonly defaultSort?: string } }, query: Record<string, unknown>): void {",
    "  const raw = String(query['page[after]']); const parts = raw.split('.'); if (parts.length !== 3) throw new Error('Invalid cursor binding'); let payload: Record<string, unknown>; try { payload = JSON.parse(decodeURIComponent(escape(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - parts[1].length % 4) % 4))))); } catch { throw new Error('Invalid cursor binding'); } const expectedSort = query.sort === undefined ? operation.cursorBinding?.defaultSort : String(query.sort); if (payload.version !== 2 || payload.operation !== operation.operationId || payload.resource !== operation.cursorBinding?.resource || typeof payload.organization !== 'string' || typeof payload.scopeFingerprint !== 'string' || typeof payload.authzVersion !== 'string' || payload.sort !== expectedSort || payload.pageSize !== Number(query['page[size]'] ?? 20) || payload.filters !== canonicalFilters(query)) throw new Error('Invalid cursor binding'); if (!Array.isArray(payload.lastTuple) || payload.lastTuple.length < 2) throw new Error('Invalid cursor binding');",
    "}",
    "function canonicalFilters(query: Record<string, unknown>): string { return JSON.stringify(Object.fromEntries(Object.entries(query).filter(([key]) => key.startsWith('filter[')).sort(([a], [b]) => a.localeCompare(b)))); }",
    "function validateResponseSemantics(operation: { readonly operationId: string }, status: number, payload: unknown, headers: Record<string, string>): void { const state = (payload as { state?: string } | undefined)?.state; const retry = headers['Retry-After']; if (operation.operationId === 'getCommandStatusV2' && state === 'IN_PROGRESS' && retry === undefined) throw new Error('IN_PROGRESS command status requires Retry-After'); if (operation.operationId === 'getCommandStatusV2' && state !== 'IN_PROGRESS' && retry !== undefined) throw new Error('terminal command status forbids Retry-After'); if (status === 202 && operation.operationId !== 'getCommandStatusV2' && retry === undefined) throw new Error('202 command response requires Retry-After'); for (const name of ['Location', 'Content-Location']) { const value = headers[name]; if (value !== undefined && (!/^\\/api\\/v2\\//.test(value) || /[?#]/.test(value))) throw new Error('Invalid canonical href header ' + name); } if (status === 202 && headers['Content-Location'] !== '/api/v2/commands/status') throw new Error('202 Content-Location must be the command status resource'); if (status === 201 && headers.Location !== undefined && !new RegExp('^/api/v2/(products|skus|orders)/[0-9a-f-]+$').test(headers.Location)) throw new Error('201 Location must identify a v2 resource'); }",
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
    "    validateOperationInput(operation, input, this.validator);",
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
    "    const responseHeaders = {}; for (const [name, header] of Object.entries(contract.headers ?? {})) { const value = response.headers.get(name); if (value === null && header.required) throw new Error('Missing required response header ' + name); if (value !== null && header.schema !== undefined && !this.validator.validateSchema(header.schema, value)) throw new Error('Invalid response header ' + name); if (value !== null) responseHeaders[name] = value; }",
    "    for (const name of ['X-Request-ID', 'ETag', 'Location', 'Content-Location', 'Cache-Control', 'Retry-After', 'Idempotent-Replay']) if (!(name in (contract.headers ?? {})) && response.headers.get(name) !== null) throw new Error('Forbidden response header ' + name);",
    "    validateResponseSemantics(operation, response.status, payload, responseHeaders);",
    "    if (contract.schema !== undefined && !this.validator.validate(contract.schema, payload)) throw new Error('Invalid response schema ' + contract.schema);",
    "    if (!response.ok) { const error = new Error('API request failed.'); error.status = response.status; error.problem = payload; error.headers = responseHeaders; throw error; }",
    "    return { status: response.status, data: payload, headers: responseHeaders };",
    "  }",
    "}",
    "function findHeader(headers, name) { const key = Object.keys(headers ?? {}).find((candidate) => candidate.toLowerCase() === name.toLowerCase()); return key === undefined ? undefined : headers?.[key]; }",
    "function validateOperationInput(operation, input, validator) {",
    "  if (validator === undefined) throw new Error('A runtime validator is required before sending a request.');",
    "  const containers = { path: input.pathParams, query: input.query, header: input.headers };",
    "  const declaredHeaders = new Set((operation.parameters ?? []).filter((parameter) => parameter.in === 'header').map((parameter) => parameter.name.toLowerCase()));",
    "  for (const parameter of operation.parameters ?? []) { const value = parameter.in === 'header' ? findHeader(containers.header, parameter.name) : containers[parameter.in]?.[parameter.name]; if (value === undefined) { if (parameter.required) throw new Error('Missing required ' + parameter.in + ' parameter: ' + parameter.name); continue; } if (parameter.in === 'header' && typeof value !== 'string') throw new Error('Invalid header: ' + parameter.name); if (parameter.schema !== undefined && !validator.validateSchema(parameter.schema, value)) throw new Error('Invalid ' + parameter.in + ' parameter: ' + parameter.name); }",
    "  for (const name of Object.keys(containers.header ?? {})) if (!declaredHeaders.has(name.toLowerCase())) throw new Error('Unknown header: ' + name);",
    "  if (operation.requestSchema !== undefined) { if (!Object.hasOwn(input, 'body') || !validator.validate(operation.requestSchema, input.body)) throw new Error('Invalid ' + operation.requestSchema + ' request body.'); } else if (Object.hasOwn(input, 'body')) throw new Error('Operation does not accept a request body.');",
    "  validateSemanticInput(operation, input);",
    "}",
    "function validateSemanticInput(operation, input) { const query = input.query; if (operation.cursorBinding && query?.['page[after]'] !== undefined) validateCursorBinding(operation, query); const body = input.body; if (operation.operationId === 'updateOrderV2' && body?.lines !== undefined) { const ids = new Set(); const images = new Set(); for (const line of body.lines) { if (line.lineId !== null && ids.has(String(line.lineId))) throw new Error('Duplicate replacement lineId'); if (line.lineId !== null) ids.add(String(line.lineId)); if (line.imageFileId !== null && images.has(String(line.imageFileId))) throw new Error('An image file cannot be reused by multiple lines'); if (line.imageFileId !== null) images.add(String(line.imageFileId)); } } }",
    "function validateCursorBinding(operation, query) { const raw = String(query['page[after]']); const parts = raw.split('.'); if (parts.length !== 3) throw new Error('Invalid cursor binding'); let payload; try { payload = JSON.parse(decodeURIComponent(escape(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - parts[1].length % 4) % 4))))); } catch { throw new Error('Invalid cursor binding'); } const expectedSort = query.sort === undefined ? operation.cursorBinding?.defaultSort : String(query.sort); if (payload.version !== 2 || payload.operation !== operation.operationId || payload.resource !== operation.cursorBinding?.resource || typeof payload.organization !== 'string' || typeof payload.scopeFingerprint !== 'string' || typeof payload.authzVersion !== 'string' || payload.sort !== expectedSort || payload.pageSize !== Number(query['page[size]'] ?? 20) || payload.filters !== canonicalFilters(query)) throw new Error('Invalid cursor binding'); if (!Array.isArray(payload.lastTuple) || payload.lastTuple.length < 2) throw new Error('Invalid cursor binding'); }",
    "function canonicalFilters(query) { return JSON.stringify(Object.fromEntries(Object.entries(query).filter(([key]) => key.startsWith('filter[')).sort(([a], [b]) => a.localeCompare(b)))); }",
    "function validateResponseSemantics(operation, status, payload, headers) { const state = payload?.state; const retry = headers['Retry-After']; if (operation.operationId === 'getCommandStatusV2' && state === 'IN_PROGRESS' && retry === undefined) throw new Error('IN_PROGRESS command status requires Retry-After'); if (operation.operationId === 'getCommandStatusV2' && state !== 'IN_PROGRESS' && retry !== undefined) throw new Error('terminal command status forbids Retry-After'); if (status === 202 && operation.operationId !== 'getCommandStatusV2' && retry === undefined) throw new Error('202 command response requires Retry-After'); for (const name of ['Location', 'Content-Location']) { const value = headers[name]; if (value !== undefined && (!/^\\/api\\/v2\\//.test(value) || /[?#]/.test(value))) throw new Error('Invalid canonical href header ' + name); } if (status === 202 && headers['Content-Location'] !== '/api/v2/commands/status') throw new Error('202 Content-Location must be the command status resource'); if (status === 201 && headers.Location !== undefined && !new RegExp('^/api/v2/(products|skus|orders)/[0-9a-f-]+$').test(headers.Location)) throw new Error('201 Location must identify a v2 resource'); }",
  ].join('\n') + '\n';
}

function runtimeValidatorTypescript() {
  return [
    "import Ajv2020Module from 'ajv/dist/2020.js';",
    "import addFormatsModule from 'ajv-formats';",
    "const Ajv2020 = Ajv2020Module as unknown as new (options?: object) => { addSchema: (schema: object, key: string) => void; compile: (schema: object) => ((value: unknown) => boolean) & { errors?: unknown[] | null }; };",
    "const addFormats = addFormatsModule as unknown as (instance: object) => void;",
    "export interface RuntimeValidator { validate(schemaName: string, value: unknown): boolean; validateSchema(schema: object, value: unknown): boolean; readonly errors: unknown[] | null | undefined; }",
    "export function createV2RuntimeValidator(document: Record<string, unknown>): RuntimeValidator {",
    "  const ajv = new Ajv2020({ allErrors: true, strict: false, allowUnionTypes: true });",
    "  addFormats(ajv);",
    "  const schemas = (document.components as { schemas?: Record<string, object> }).schemas ?? {};",
    "  for (const [name, schema] of Object.entries(schemas)) ajv.addSchema(schema, '#/components/schemas/' + name);",
    "  const validators = new Map<string, ((value: unknown) => boolean) & { errors?: unknown[] | null }>();",
    "  let errors: unknown[] | null | undefined;",
    "  return { validate(schemaName, value) { let validator = validators.get(schemaName); if (validator === undefined) { const compiled = ajv.compile({ $ref: '#/components/schemas/' + schemaName }); validator = compiled; validators.set(schemaName, compiled); } const current = validator!; const valid = current(value); errors = current.errors; return valid; }, validateSchema(schema, value) { const current = ajv.compile(schema); const valid = current(value); errors = current.errors; return valid; }, get errors() { return errors; } };",
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
    "  return { validate(schemaName, value) { let validator = validators.get(schemaName); if (validator === undefined) { validator = ajv.compile({ $ref: '#/components/schemas/' + schemaName }); validators.set(schemaName, validator); } const valid = validator(value); errors = validator.errors; return valid; }, validateSchema(schema, value) { const validator = ajv.compile(schema); const valid = validator(value); errors = validator.errors; return valid; }, get errors() { return errors; } };",
    "}",
  ].join('\n') + '\n';
}
