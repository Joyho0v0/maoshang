import { parse } from 'yaml';
import { readFile } from 'node:fs/promises';
import { createContractValidator } from '../../packages/contracts/openapi/runtime-validator.js';

describe('runtime contract validator', () => {
  it('rejects malformed DecimalString and unknown existing enum values', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const validator = createContractValidator(document);

    expect(validator.validate('DecimalString', 'not-a-decimal')).toBe(false);
    expect(validator.validate('Customer', {
      id: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
      organizationId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
      version: 1,
      createdAt: '2026-10-28T05:00:00Z',
      updatedAt: '2026-10-28T05:00:00Z',
      status: 'NOT_A_CUSTOMER_STATE',
      capabilities: [],
    })).toBe(false);
  });

  it('validates each CommandStatus state as a discriminated runtime schema', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const validator = createContractValidator(document);
    const base = {
      commandId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
      operationId: 'reviewPayment',
      startedAt: '2026-10-28T05:00:00Z',
      expiresAt: '2026-10-29T05:00:00Z',
    };
    expect(validator.validate('CommandStatus', { ...base, state: 'IN_PROGRESS', completedAt: null, retryAfterMs: 1000, httpStatus: null, resource: null, resultHref: null, problem: null })).toBe(true);
    expect(validator.validate('CommandStatus', { ...base, state: 'RECOVERY_REQUIRED', completedAt: null, retryAfterMs: 0, httpStatus: null, resource: null, resultHref: null, problem: null })).toBe(true);
    expect(validator.validate('CommandStatus', { ...base, state: 'SUCCEEDED', completedAt: '2026-10-28T05:01:00Z', retryAfterMs: 0, httpStatus: 201, resource: { type: 'CUSTOMER', id: base.commandId, href: `/api/v1/customers/${base.commandId}` }, resultHref: null, problem: null })).toBe(true);
    expect(validator.validate('CommandStatus', { ...base, state: 'FAILED', completedAt: '2026-10-28T05:01:00Z', retryAfterMs: 0, httpStatus: 409, resource: null, resultHref: null, problem: { type: 'urn:autoflow:problem:business-rule-violation', title: 'Conflict', status: 409, code: 'BUSINESS_RULE_VIOLATION', requestId: base.commandId, retryable: false } })).toBe(true);
    expect(validator.validate('CommandStatus', { ...base, state: 'IN_PROGRESS', completedAt: null, retryAfterMs: 1000, httpStatus: null, resource: null, resultHref: null, problem: null, attemptCount: 1 })).toBe(false);
  });

  it('accepts complete response DTOs with forward-compatible fields while keeping requests strict', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const validator = createContractValidator(document);
    const ids = { id: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', organizationId: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' };
    expect(validator.validate('Customer', { ...ids, version: 1, createdAt: '2026-10-28T05:00:00Z', updatedAt: '2026-10-28T05:00:00Z', status: 'DRAFT', capabilities: [] })).toBe(true);
    expect(validator.validate('InventoryOperation', { ...ids, version: 1, createdAt: '2026-10-28T05:00:00Z', updatedAt: '2026-10-28T05:00:00Z', operationType: 'RECEIPT', status: 'POSTED', lines: [{ skuId: ids.id, locationId: ids.organizationId, quantity: '1', unit: 'PCS' }] })).toBe(true);
    expect(validator.validate('Customer', { ...ids, version: 1, createdAt: '2026-10-28T05:00:00Z', updatedAt: '2026-10-28T05:00:00Z', status: 'DRAFT', capabilities: [], displayLabel: 'future field' })).toBe(true);
    expect(validator.validate('Problem', {
      type: 'urn:autoflow:problem:business-rule-violation', title: 'Rule', status: 409,
      code: 'BUSINESS_RULE_VIOLATION', requestId: ids.id, retryable: false, supportHref: '/support',
    })).toBe(true);
    expect(validator.validate('CustomerCreateRequest', { name: 'Acme', ownerUserId: ids.id, unknownField: true })).toBe(false);
  });

  it('requires the frozen inventory, SKU, file, and document response fields', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const validator = createContractValidator(document);
    const ids = { id: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', organizationId: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' };
    const timestamps = { version: 1, createdAt: '2026-10-28T05:00:00Z', updatedAt: '2026-10-28T05:00:00Z' };
    const inventoryFields = { ...ids, ...timestamps, skuId: ids.id, locationId: ids.organizationId, onHand: '10', reserved: '2', available: '8', unit: 'PCS', belowThreshold: false };
    expect(validator.validate('InventoryBalance', inventoryFields)).toBe(true);
    expect(validator.validate('InventoryBalance', { ...inventoryFields, locationId: undefined })).toBe(false);
    expect(validator.validate('InventoryObservation', { ...ids, ...timestamps, skuId: ids.id, locationId: ids.organizationId, observedAt: timestamps.createdAt, onHand: '10', reserved: '2', available: '8', unit: 'PCS', source: 'COUNT' })).toBe(true);
    expect(validator.validate('AuditEvent', { ...ids, ...timestamps, actorUserId: ids.id, action: 'PRODUCT_UPDATED', resourceType: 'PRODUCT', resourceId: ids.id })).toBe(true);
    expect(validator.validate('Sku', { ...ids, ...timestamps, productId: ids.id, skuCode: 'SKU-1', name: 'Widget', unit: 'PCS', trackingMode: 'LOT', baseUnit: 'PCS', lowStockThreshold: '2', status: 'ACTIVE' })).toBe(true);
    expect(validator.validate('Sku', { ...ids, ...timestamps, productId: ids.id, skuCode: 'SKU-1', name: 'Widget', unit: 'PCS', status: 'ACTIVE' })).toBe(false);
    expect(validator.validate('File', { ...ids, ...timestamps, fileName: 'invoice.pdf', contentType: 'application/pdf', sizeBytes: 128, status: 'UPLOADED' })).toBe(true);
    expect(validator.validate('File', { ...ids, ...timestamps, fileName: 'invoice.pdf', contentType: 'application/pdf', sizeBytes: 128, status: 'READY' })).toBe(false);
    expect(validator.validate('Document', { ...ids, ...timestamps, title: 'Invoice', documentType: 'INVOICE', versionNo: 1, renderStatus: 'RENDERED', capabilities: ['document.read'], status: 'DRAFT' })).toBe(true);
    expect(validator.validate('Document', { ...ids, ...timestamps, title: 'Invoice', documentType: 'INVOICE', status: 'DRAFT' })).toBe(false);
  });

  it('rejects typed Problem and successful CommandStatus payloads with incomplete recovery fields', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const validator = createContractValidator(document);
    const requestId = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2';
    expect(validator.validate('Problem', {
      type: 'urn:autoflow:problem:version-conflict', title: 'Version conflict', status: 409,
      code: 'VERSION_CONFLICT', requestId, retryable: false,
    })).toBe(false);
    expect(validator.validate('CommandStatus', {
      commandId: requestId, operationId: 'createCustomer', state: 'SUCCEEDED',
      startedAt: '2026-10-28T05:00:00Z', completedAt: '2026-10-28T05:01:00Z',
      expiresAt: '2026-10-29T05:00:00Z', retryAfterMs: 0, httpStatus: 201,
      resource: {}, resultHref: null, problem: null,
    })).toBe(false);
  });
});
