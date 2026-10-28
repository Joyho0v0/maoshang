import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';

const source = await readFile(new URL('./openapi.yaml', import.meta.url), 'utf8');
const document = parse(source) as Record<string, unknown>;
if (document.openapi !== '3.1.0') throw new Error('OpenAPI must be 3.1.0.');
const paths = document.paths as Record<string, Record<string, unknown>>;
const pathItems = (document['x-operationTemplates'] ?? {}) as Record<string, Record<string, unknown>>;
const seen = new Set<string>();
let operationCount = 0;
for (const [path, methods] of Object.entries(paths)) {
  for (const [method, rawOperation] of Object.entries(methods)) {
    if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
    const operation = resolve(rawOperation, pathItems);
    const operationId = operation.operationId;
    if (typeof operationId !== 'string' || operationId.length === 0) throw new Error(`${method.toUpperCase()} ${path} has no operationId.`);
    if (seen.has(operationId)) throw new Error(`Duplicate operationId: ${operationId}.`);
    seen.add(operationId);
    operationCount += 1;
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const safety = operation['x-safety'] as Record<string, unknown> | undefined;
      if (safety?.csrf !== 'required') throw new Error(`${operationId} must require CSRF.`);
      const parameters = Array.isArray(operation.parameters) ? operation.parameters : [];
      const refs = parameters.map((parameter) => typeof parameter === 'object' && parameter !== null && '$ref' in parameter ? String((parameter as Record<string, unknown>).$ref) : '');
      if (!refs.includes('#/components/parameters/CsrfHeader')) throw new Error(`${operationId} must declare X-CSRF-Token.`);
      if (safety.idempotency === 'required' && !refs.includes('#/components/parameters/IdempotencyHeader')) throw new Error(`${operationId} must declare Idempotency-Key.`);
      if (safety.ifMatch === 'required' && !refs.includes('#/components/parameters/IfMatchHeader')) throw new Error(`${operationId} must declare If-Match.`);
      const responses = operation.responses as Record<string, unknown> | undefined;
      if (responses?.['403'] === undefined || responses?.['428'] === undefined) throw new Error(`${operationId} must describe 403 and 428.`);
    }
  }
}
process.stdout.write(`OpenAPI lint passed: ${operationCount} operations, ${seen.size} unique operationIds, corrected CSRF/428 matrix verified.\n`);

function resolve(raw: unknown, items: Record<string, Record<string, unknown>>): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null) throw new Error('Operation must be an object.');
  const reference = (raw as Record<string, unknown>).$ref;
  if (typeof reference !== 'string') return raw as Record<string, unknown>;
  const prefix = '#/x-operationTemplates/';
  const base = reference.startsWith(prefix) ? items[reference.slice(prefix.length)] : undefined;
  if (base === undefined) throw new Error(`Unresolved path item ${reference}.`);
  const resolvedBase = typeof base.$ref === 'string' ? resolve(base, items) : base;
  return { ...resolvedBase, ...(raw as Record<string, unknown>) };
}
