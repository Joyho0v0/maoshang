import { readFile } from 'node:fs/promises';
import SwaggerParser from '@apidevtools/swagger-parser';
import { parse } from 'yaml';
import { EXPECTED_CONTRACT_SHAPES, EXPECTED_OPERATION_MANIFEST, assertOperationManifest } from '../../packages/contracts/openapi/contract-manifest.js';
import { operations } from '../../packages/contracts/openapi/generated-client.js';

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
      const safety = operation['x-safety'] as { idempotency?: string; ifMatch?: string } | undefined;
      if (safety?.idempotency === 'required' || safety?.ifMatch === 'required') expect(operation.responses?.['428']).toBeDefined();
      else expect(operation.responses?.['428']).toBeUndefined();
    }
  });

  it('matches the independent frozen operation and safety manifest exactly', async () => {
    const document = parse(await readFile(artifactPath, 'utf8')) as Record<string, unknown>;
    expect(EXPECTED_OPERATION_MANIFEST).toHaveLength(72);
    expect(Object.keys(EXPECTED_CONTRACT_SHAPES)).toHaveLength(72);
    expect(() => assertOperationManifest(document)).not.toThrow();
  });

  it('keeps document creation bound to its order aggregate and typed DTOs', async () => {
    const document = parse(await readFile(artifactPath, 'utf8')) as Record<string, unknown>;
    const templates = document['x-operationTemplates'] as Record<string, Record<string, unknown>>;
    const createDocument = templates.createDocument;
    expect(createDocument).toMatchObject({
      operationId: 'createDocument',
      'x-safety': { csrf: 'required', idempotency: 'required', ifMatch: 'required' },
    });
    expect(JSON.stringify(createDocument)).toContain('orderId');
    expect(JSON.stringify(createDocument)).toContain('IfMatchHeader');
    expect(JSON.stringify(createDocument)).toContain('DocumentCreateRequest');
    expect(JSON.stringify(document)).not.toContain('requestBody: { $ref: \'#/components/requestBodies/JsonObject\' }');
  });

  it('freezes typed public 403/429 responses and endpoint filter allowlists', () => {
    const listOperationIds = ['listCustomers', 'listProducts', 'listSkus', 'listOrders', 'listInventoryBalances', 'listInventoryMovements', 'listInventoryReservations', 'listInventoryObservations', 'listPayments', 'listDocuments', 'listTasks', 'listAuditEvents'];
    const csrfOperationIds = new Set(['createSession', 'deleteCurrentSession', 'createUser', 'updateUserRoleBindings', 'updateUserDataScopeGrants', 'disableUser', 'createCustomer', 'updateCustomer', 'reverseInventoryOperation', 'createDownloadIntent']);
    for (const [operationId, operation] of Object.entries(operations)) {
      const responses = operation.responses as Readonly<Record<string, { schema?: string; headers: Readonly<Record<string, { required: boolean }>> }>>;
      const forbidden = responses['403'];
      if (forbidden !== undefined) expect(forbidden.schema).toBe(csrfOperationIds.has(operationId) ? 'CsrfFailedProblem' : 'Problem');
      const rateLimited = responses['429'];
      expect(rateLimited?.schema).toBe('Problem');
      expect(rateLimited?.headers['Retry-After']).toMatchObject({ required: true });
      expect(rateLimited?.headers['X-Request-ID']).toMatchObject({ required: true });
      if (listOperationIds.includes(operationId)) {
        const queryNames = Object.keys(operation.queryParams);
        expect(queryNames).not.toContain('filter');
        expect(queryNames.some((name) => name.startsWith('filter['))).toBe(true);
      }
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
