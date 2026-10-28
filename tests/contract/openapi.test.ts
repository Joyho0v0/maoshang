import { readFile } from 'node:fs/promises';
import SwaggerParser from '@apidevtools/swagger-parser';
import { parse } from 'yaml';

const artifactPath = new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url);
type Operation = {
  operationId?: string;
  parameters?: Array<{ name: string; in: string; required?: boolean }>;
  responses?: Record<string, unknown>;
  $ref?: string;
  'x-safety'?: { idempotency?: string };
};

describe('machine-readable Joint Contract v1 artifact', () => {
  it('is a valid OpenAPI 3.1 document with an explicit unsafe operation matrix', async () => {
    const source = await readFile(artifactPath, 'utf8');
    const document = parse(source) as {
      openapi: string;
      paths: Record<string, Record<string, Operation>>;
      'x-operationTemplates': Record<string, Operation>;
    };

    expect(document.openapi).toBe('3.1.0');
    await expect(SwaggerParser.validate(document as never)).resolves.toBeTruthy();

    const unsafe = Object.entries(document.paths).flatMap(([path, methods]) =>
      Object.entries(methods)
        .filter(([method]) => ['post', 'put', 'patch', 'delete'].includes(method))
        .map(([method, operation]) => ({ path, method, operation: resolveOperation(operation, document['x-operationTemplates']) })),
    );

    expect(unsafe.length).toBeGreaterThan(20);
    for (const { operation } of unsafe) {
      expect(operation.operationId).toBeTruthy();
      const headers = new Map((operation.parameters ?? [])
        .filter((parameter) => parameter.in === 'header')
        .map((parameter) => [parameter.name, parameter]));
      expect(headers.get('X-CSRF-Token')?.required).toBe(true);
      const safety = operation['x-safety'] as { idempotency?: string } | undefined;
      if (safety?.idempotency === 'required') {
        expect(headers.get('Idempotency-Key')?.required).toBe(true);
      }
    }
  });

  it('uses the corrected CSRF error semantics', async () => {
    const source = await readFile(artifactPath, 'utf8');
    const document = parse(source) as { paths: Record<string, Record<string, Operation>>; 'x-operationTemplates': Record<string, Operation> };
    const unsafe = Object.values(document.paths).flatMap((methods) =>
      Object.entries(methods)
        .filter(([method]) => ['post', 'put', 'patch', 'delete'].includes(method))
        .map(([, operation]) => resolveOperation(operation, document['x-operationTemplates'])),
    );

    for (const operation of unsafe) {
      expect(operation.responses?.['403']).toBeDefined();
      expect(operation.responses?.['428']).toBeDefined();
    }
  });
});

function resolveOperation(operation: Operation, templates: Record<string, Operation>): Operation {
  if (operation.$ref === undefined) return operation;
  const prefix = '#/x-operationTemplates/';
  const template = templates[operation.$ref.slice(prefix.length)];
  const resolved = template?.$ref === undefined ? template : resolveOperation(template, templates);
  return { ...(resolved ?? {}), ...operation };
}
