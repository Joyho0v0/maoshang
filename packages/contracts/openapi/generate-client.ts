import { readFile, writeFile } from 'node:fs/promises';
import openapiTS, { astToString, type OpenAPI3, type OperationObject } from 'openapi-typescript';
import { parse } from 'yaml';

const source = parse(await readFile(new URL('./openapi.yaml', import.meta.url), 'utf8')) as OpenAPI3 & {
  'x-operationTemplates'?: Record<string, OperationObject & { $ref?: string }>;
};
const templates = source['x-operationTemplates'] ?? {};

for (const pathItem of Object.values(source.paths ?? {})) {
  if ('$ref' in pathItem) continue;
  for (const method of ['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace'] as const) {
    const operation = pathItem[method];
    if (operation === undefined || !('$ref' in operation)) continue;
    const resolved = resolve(operation, templates);
    const { $ref: _ref, ...overrides } = operation;
    void _ref;
    pathItem[method] = { ...resolved, ...overrides };
  }
}
delete source['x-operationTemplates'];

const ast = await openapiTS(source);
await writeFile(new URL('./generated.ts', import.meta.url), astToString(ast), 'utf8');
const operationDefinitions = Object.entries(source.paths ?? {}).flatMap(([path, pathItem]) =>
  Object.entries(pathItem)
    .filter(([method]) => ['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace'].includes(method))
    .map(([method, operation]) => ({ operationId: (operation as OperationObject).operationId, method: method.toUpperCase(), path, operation: operation as OperationObject, contract: operationContract(source as unknown as AnyRecord, operation as OperationObject) })),
).filter((operation): operation is { operationId: string; method: string; path: string; operation: OperationObject; contract: AnyRecord } => typeof operation.operationId === 'string');
const operations = operationDefinitions.map(({ operationId, method, path, contract }) => ({ operationId, method, path, contract }));
const inputTypes = operationDefinitions.map(({ operationId, operation }) => `  ${JSON.stringify(operationId)}: ${operationInputType(source as unknown as AnyRecord, operation)};`).join('\n');
const responseTypes = operationDefinitions.map(({ operationId, operation }) => `  ${JSON.stringify(operationId)}: ${operationResponseType(source as unknown as AnyRecord, operation)};`).join('\n');
await writeFile(new URL('./generated-client.ts', import.meta.url), `import { ContractApiClient, type ContractApiClientOptions, type ContractResponse, type GeneratedOperation } from './client.js';
import type { components } from './generated.js';

export const operations = ${JSON.stringify(Object.fromEntries(operations.map(({ operationId, method, path, contract }) => [operationId, { method, path, ...contract }])), null, 2)} as const satisfies Record<string, GeneratedOperation>;
export type OperationId = keyof typeof operations;
export type OperationInputMap = {
${inputTypes}
};
export type OperationResponseMap = {
${responseTypes}
};

export class GeneratedApiClient extends ContractApiClient {
  constructor(options: ContractApiClientOptions = {}) {
    super(options);
  }

  call<Id extends OperationId>(operationId: Id, input: OperationInputMap[Id]): Promise<OperationResponseMap[Id]> {
    return super.execute(operations[operationId], input);
  }
}
`, 'utf8');
process.stdout.write('Generated client/types from expanded Joint Contract artifact.\n');

function resolve(operation: OperationObject & { $ref?: string }, available: Record<string, OperationObject & { $ref?: string }>): OperationObject {
  if (operation.$ref === undefined) return operation;
  const reference = '#/x-operationTemplates/';
  const template = available[operation.$ref.slice(reference.length)];
  if (template === undefined) throw new Error(`Unknown operation template ${operation.$ref}.`);
  const { $ref: _templateRef, ...templateOverrides } = template;
  void _templateRef;
  const base = template.$ref === undefined ? template : resolve(template, available);
  return { ...base, ...templateOverrides };
}

type AnyRecord = Record<string, unknown>;

function operationContract(document: AnyRecord, operation: OperationObject): AnyRecord {
  const parameters = (operation.parameters ?? []).map((parameter) => resolveRef(document, parameter as unknown as AnyRecord));
  const requestBody = operation.requestBody === undefined ? undefined : resolveRef(document, operation.requestBody as unknown as AnyRecord);
  const responses = Object.fromEntries(Object.entries(operation.responses ?? {}).map(([status, response]) => {
    const resolved = resolveRef(document, response as unknown as AnyRecord);
    const contentMap = isRecord(resolved.content) ? resolved.content : undefined;
    const mediaType = contentMap?.['application/json'] !== undefined ? 'application/json' : contentMap?.['application/problem+json'] !== undefined ? 'application/problem+json' : undefined;
    const content = mediaType === undefined || contentMap === undefined ? undefined : contentMap[mediaType];
    const schema = isRecord(content) && isRecord(content.schema) ? schemaName(content.schema) : undefined;
    const headers = isRecord(resolved.headers) ? Object.fromEntries(Object.entries(resolved.headers).map(([name, header]) => {
      const resolvedHeader = resolveRef(document, header as unknown as AnyRecord);
      const headerSchema = isRecord(resolvedHeader.schema) ? resolvedHeader.schema : undefined;
      return [name, {
        required: resolvedHeader['x-required'] === true,
        ...(headerSchema === undefined ? {} : { schema: schemaName(headerSchema) ?? headerSchema }),
      }];
    })) : {};
    return [status, {
      ...(schema === undefined ? {} : { schema }),
      ...(mediaType === undefined ? {} : { contentType: mediaType }),
      headers,
      requiredHeaders: Object.entries(headers).filter(([, header]) => isRecord(header) && header.required === true).map(([name]) => name),
    }];
  }));
  const bodyContent = isRecord(requestBody?.content) ? requestBody.content['application/json'] : undefined;
  const bodySchema = isRecord(bodyContent) && isRecord(bodyContent.schema) ? schemaName(bodyContent.schema) : undefined;
  return {
    pathParams: Object.fromEntries(parameters.filter((parameter) => parameter.in === 'path').map((parameter) => [parameter.name, parameterContract(parameter)])),
    queryParams: Object.fromEntries(parameters.filter((parameter) => parameter.in === 'query').map((parameter) => [parameter.name, parameterContract(parameter)])),
    headers: Object.fromEntries(parameters.filter((parameter) => parameter.in === 'header').map((parameter) => [parameter.name, parameterContract(parameter)])),
    ...(bodySchema === undefined ? {} : { requestSchema: bodySchema }),
    responses,
  };
}

function operationInputType(document: AnyRecord, operation: OperationObject): string {
  const parameters = (operation.parameters ?? []).map((parameter) => resolveRef(document, parameter as unknown as AnyRecord));
  const fields: string[] = [];
  const pathParams = parameters.filter((parameter) => parameter.in === 'path');
  if (pathParams.length > 0) fields.push(`pathParams: { ${pathParams.map((parameter) => `${JSON.stringify(parameter.name)}: ${parameterType(parameter)}`).join('; ')} }`);
  const queryParams = parameters.filter((parameter) => parameter.in === 'query');
  if (queryParams.length > 0) fields.push(`query?: { ${queryParams.map((parameter) => `${JSON.stringify(parameter.name)}?: ${parameterType(parameter)}`).join('; ')} }`);
  const headers = parameters.filter((parameter) => parameter.in === 'header');
  if (headers.length > 0) {
    const required = headers.filter((parameter) => parameter.required === true);
    fields.push(required.length > 0
      ? `headers: Record<string, string> & { ${required.map((parameter) => `${JSON.stringify(parameter.name)}: string`).join('; ')} }`
      : 'headers?: Record<string, string>');
  }
  if (operation.requestBody !== undefined) {
    const requestBody = resolveRef(document, operation.requestBody as unknown as AnyRecord);
    const content = isRecord(requestBody.content) ? requestBody.content['application/json'] : undefined;
    const schema = isRecord(content) && isRecord(content.schema) ? schemaName(content.schema) : undefined;
    fields.push(`body: ${schema === undefined ? 'unknown' : schemaType(schema)}`);
  }
  return fields.length === 0 ? 'Record<never, never>' : `{ ${fields.join('; ')} }`;
}

function operationResponseType(document: AnyRecord, operation: OperationObject): string {
  const responseTypes = Object.entries(operation.responses ?? {})
    .filter(([status]) => /^2\d\d$/.test(status))
    .map(([status, response]) => {
      const resolved = resolveRef(document, response as unknown as AnyRecord);
      const contentMap = isRecord(resolved.content) ? resolved.content : undefined;
      const content = contentMap?.['application/json'] ?? contentMap?.['application/problem+json'];
      const schema = isRecord(content) && isRecord(content.schema) ? schemaName(content.schema) : undefined;
      return `ContractResponse<${schema === undefined ? 'void' : schemaType(schema)}, ${responseHeaderType(document, resolved)}, ${status}>`;
    });
  return [...new Set(responseTypes)].join(' | ') || 'never';
}

function parameterType(parameter: AnyRecord): string {
  const schema = isRecord(parameter.schema) ? parameter.schema : undefined;
  if (schema?.type === 'integer' || schema?.type === 'number') return 'number';
  if (schema?.type === 'boolean') return 'boolean';
  if (schema?.type === 'array') return 'string[]';
  return 'string';
}

function responseHeaderType(document: AnyRecord, response: AnyRecord): string {
  const headers = isRecord(response.headers) ? response.headers : {};
  const fields = Object.entries(headers).map(([name, value]) => {
    const header = resolveRef(document, value as AnyRecord);
    const schema = isRecord(header.schema) ? header.schema : undefined;
    const optional = header['x-required'] === true ? '' : '?';
    return `${JSON.stringify(name)}${optional}: ${inlineType(schema)}`;
  });
  return fields.length === 0 ? 'Record<never, never>' : `{ ${fields.join('; ')} }`;
}

function inlineType(schema: AnyRecord | undefined): string {
  if (schema === undefined) return 'string';
  if (schema.const !== undefined) return JSON.stringify(schema.const);
  if (Array.isArray(schema.enum)) return schema.enum.map((value) => JSON.stringify(value)).join(' | ');
  if (schema.type === 'integer' || schema.type === 'number') return 'number';
  if (schema.type === 'boolean') return 'boolean';
  return 'string';
}

function schemaType(name: string | undefined): string {
  return name === undefined ? 'unknown' : `components["schemas"][${JSON.stringify(name)}]`;
}

function parameterContract(parameter: AnyRecord): AnyRecord {
  const schema = isRecord(parameter.schema) ? parameter.schema : undefined;
  return {
    required: parameter.required === true,
    ...(schema === undefined ? {} : { schema: schemaName(schema) ?? schema }),
    ...(typeof schema?.type === 'string' ? { type: schema.type } : {}),
  };
}

function resolveRef(document: AnyRecord, value: AnyRecord): AnyRecord {
  if (typeof value.$ref !== 'string' || !value.$ref.startsWith('#/')) return value;
  const resolved = value.$ref.slice(2).split('/').reduce<unknown>((current, part) => isRecord(current) ? current[part] : undefined, document);
  return isRecord(resolved) ? { ...resolved, ...value } : value;
}

function schemaName(value: AnyRecord | undefined): string | undefined {
  if (typeof value?.$ref !== 'string') return undefined;
  const prefix = '#/components/schemas/';
  return value.$ref.startsWith(prefix) ? value.$ref.slice(prefix.length) : undefined;
}

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
