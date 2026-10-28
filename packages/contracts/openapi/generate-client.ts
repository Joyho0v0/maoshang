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
const operations = Object.entries(source.paths ?? {}).flatMap(([path, pathItem]) =>
  Object.entries(pathItem)
    .filter(([method]) => ['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace'].includes(method))
    .map(([method, operation]) => ({ operationId: (operation as OperationObject).operationId, method: method.toUpperCase(), path })),
).filter((operation): operation is { operationId: string; method: string; path: string } => typeof operation.operationId === 'string');
await writeFile(new URL('./generated-client.ts', import.meta.url), `import { ContractApiClient, type ClientCallInput, type ContractApiClientOptions } from './client.js';

export const operations = ${JSON.stringify(Object.fromEntries(operations.map(({ operationId, method, path }) => [operationId, { method, path }])), null, 2)} as const;
export type OperationId = keyof typeof operations;

export class GeneratedApiClient extends ContractApiClient {
  constructor(options: ContractApiClientOptions = {}) {
    super(options);
  }

  call<TResponse>(operationId: OperationId, input: ClientCallInput = {}): Promise<TResponse> {
    return super.execute<TResponse>(operations[operationId], input);
  }
}
`, 'utf8');
process.stdout.write('Generated client/types from expanded Joint Contract artifact.\n');

function resolve(operation: OperationObject & { $ref?: string }, available: Record<string, OperationObject & { $ref?: string }>): OperationObject {
  if (operation.$ref === undefined) return operation;
  const reference = '#/x-operationTemplates/';
  const template = available[operation.$ref.slice(reference.length)];
  if (template === undefined) throw new Error(`Unknown operation template ${operation.$ref}.`);
  return template.$ref === undefined ? template : resolve(template, available);
}
