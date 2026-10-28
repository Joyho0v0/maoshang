import { assertNoBreakingChanges } from '../../packages/contracts/openapi/breaking-gate.js';

describe('OpenAPI compatibility gate', () => {
  it('allows additive optional response fields', () => {
    expect(() => assertNoBreakingChanges(
      { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
      { type: 'object', required: ['id'], properties: { id: { type: 'string' }, label: { type: 'string' } } },
    )).not.toThrow();
  });

  it('rejects removed required fields and narrowed enums', () => {
    expect(() => assertNoBreakingChanges(
      { type: 'object', required: ['id', 'status'], properties: { id: { type: 'string' }, status: { enum: ['A', 'B'] } } },
      { type: 'object', required: ['id'], properties: { id: { type: 'string' }, status: { enum: ['A'] } } },
    )).toThrow();
    expect(() => assertNoBreakingChanges(
      { type: 'object', properties: { id: { type: 'string' } } },
      { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
    )).toThrow(/became required/);
  });

  it('rejects removal of an existing optional field and entire operation', () => {
    expect(() => assertNoBreakingChanges(
      { type: 'object', properties: { id: { type: 'string' }, label: { type: 'string' } } },
      { type: 'object', properties: { id: { type: 'string' } } },
    )).toThrow(/label/);

    expect(() => assertNoBreakingChanges(
      { openapi: '3.1.0', paths: { '/customers': { get: { operationId: 'listCustomers', responses: { '200': {} } } } } },
      { openapi: '3.1.0', paths: {} },
    )).toThrow(/operation|path/i);
  });

  it('rejects response, request, header, security, and format narrowing', () => {
    expect(() => assertNoBreakingChanges(
      { parameters: [{ name: 'If-Match', in: 'header', required: false }], responses: { '200': { content: { 'application/json': { schema: { type: 'string', format: 'uuid' } } } } }, security: [{ CookieSession: [] }] },
      { parameters: [{ name: 'If-Match', in: 'header', required: true }], responses: { '200': { content: { 'application/json': { schema: { type: 'string', format: 'uuid' } } } } }, security: [] },
    )).toThrow();
  });

  it('rejects removed allOf branches and an implicit-to-closed additional property change', () => {
    expect(() => assertNoBreakingChanges(
      { allOf: [{ oneOf: [{ const: 'A' }, { const: 'B' }] }] },
      { allOf: [{ oneOf: [{ const: 'A' }] }] },
    )).toThrow(/allOf|oneOf/);
    expect(() => assertNoBreakingChanges(
      { type: 'object', properties: { id: { type: 'string' } } },
      { type: 'object', additionalProperties: false, properties: { id: { type: 'string' } } },
    )).toThrow(/additional properties/);
  });

  it('treats an equivalent allOf required constraint and flattened schema as compatible', () => {
    expect(() => assertNoBreakingChanges(
      { allOf: [{ type: 'object', required: ['id'], properties: { id: { type: 'string' } } }] },
      { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
    )).not.toThrow();
  });

  it('rejects a required field added while flattening an allOf schema', () => {
    expect(() => assertNoBreakingChanges(
      { allOf: [{ type: 'object', required: ['id'], properties: { id: { type: 'string' } } }] },
      { type: 'object', required: ['id', 'name'], properties: { id: { type: 'string' }, name: { type: 'string' } } },
    )).toThrow(/became required/);
  });

  it('rejects a candidate-only composition that narrows an existing option', () => {
    expect(() => assertNoBreakingChanges(
      { oneOf: [{ type: 'object', required: ['id'], properties: { id: { type: 'string' } } }] },
      { oneOf: [{ type: 'object', required: ['id'], properties: { id: { type: 'string' } }, anyOf: [{ required: ['a'] }, { required: ['b'] }] }] },
    )).toThrow(/composition|required|oneOf|anyOf/);
    expect(() => assertNoBreakingChanges(
      { oneOf: [{ type: 'object', required: ['id'], properties: { id: { type: 'string' } } }] },
      { oneOf: [{ type: 'object', required: ['id'], properties: { id: { type: 'string' } }, allOf: [{ required: ['tenantId'] }] }] },
    )).toThrow(/composition|required|oneOf|allOf/);
    expect(() => assertNoBreakingChanges(
      { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
      { type: 'object', required: ['id'], properties: { id: { type: 'string' } }, oneOf: [{ required: ['tenantId'] }] },
    )).toThrow(/candidate-only composition|oneOf|tenantId/);
  });

  it('rejects const narrowing while preserving an equivalent additive composition option', () => {
    expect(() => assertNoBreakingChanges(
      { oneOf: [{ type: 'string', const: 'A' }] },
      { oneOf: [{ type: 'string', const: 'B' }] },
    )).toThrow(/const|composition|oneOf/);
    expect(() => assertNoBreakingChanges(
      { oneOf: [{ type: 'object', required: ['id'], properties: { id: { type: 'string' } } }] },
      { oneOf: [{ type: 'object', required: ['id'], properties: { id: { type: 'string' }, label: { type: 'string' } } }] },
    )).not.toThrow();
  });
});
