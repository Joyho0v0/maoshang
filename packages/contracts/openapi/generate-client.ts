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
process.stdout.write('Generated client/types from expanded Joint Contract artifact.\n');

function resolve(operation: OperationObject & { $ref?: string }, available: Record<string, OperationObject & { $ref?: string }>): OperationObject {
  if (operation.$ref === undefined) return operation;
  const reference = '#/x-operationTemplates/';
  const template = available[operation.$ref.slice(reference.length)];
  if (template === undefined) throw new Error(`Unknown operation template ${operation.$ref}.`);
  return template.$ref === undefined ? template : resolve(template, available);
}
