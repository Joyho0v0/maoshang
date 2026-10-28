import { assertNoBreakingChanges, collectBreakingChanges } from '../../packages/contracts/openapi/breaking-gate.js';

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

  it('treats equivalent allOf merge and split shapes as compatible composition options', () => {
    const merged = { oneOf: [{ type: 'object', required: ['id', 'tenantId'], properties: { id: { type: 'string' }, tenantId: { type: 'string' } } }] };
    const split = { oneOf: [{ allOf: [{ type: 'object', required: ['id'], properties: { id: { type: 'string' } } }, { type: 'object', required: ['tenantId'], properties: { tenantId: { type: 'string' } } }] }] };

    expect(() => assertNoBreakingChanges(merged, split)).not.toThrow();
    expect(() => assertNoBreakingChanges(split, merged)).not.toThrow();
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

  it('rejects candidate-only value constraints that narrow an unconstrained schema', () => {
    expect(() => assertNoBreakingChanges({}, { const: 'A' })).toThrow(/constraint const/);
    expect(() => assertNoBreakingChanges({}, { enum: ['A', 'B'] })).toThrow(/enum/);
    expect(() => assertNoBreakingChanges({}, { pattern: '^A' })).toThrow(/constraint pattern/);
    expect(() => assertNoBreakingChanges({}, { type: 'string' })).toThrow(/constraint type/);
    expect(() => assertNoBreakingChanges({}, { format: 'uuid' })).toThrow(/constraint format/);
    expect(() => assertNoBreakingChanges({}, { minLength: 1 })).toThrow(/constraint minLength/);
    expect(() => assertNoBreakingChanges({}, { minimum: 1 })).toThrow(/constraint minimum/);
  });

  it('rejects a newly overlapping oneOf branch instead of treating it as additive', () => {
    expect(() => assertNoBreakingChanges(
      { oneOf: [{ type: 'string' }] },
      { oneOf: [{ type: 'string' }, { const: 'A' }] },
    )).toThrow(/oneOf|overlap|option/);
  });

  it('uses the same compatible composition matching for the gate and inventory', () => {
    const previous = { oneOf: [{ const: 'A' }, { const: 'B' }] };
    const reordered = { oneOf: [{ const: 'B' }, { const: 'A' }] };

    expect(() => assertNoBreakingChanges(previous, reordered)).not.toThrow();
    expect(collectBreakingChanges(previous, reordered)).toEqual([]);
  });

  it('accepts a nested union wrapper that contains every previous option', () => {
    const previous = { oneOf: [{ const: 'A' }, { const: 'B' }, { const: 'C' }] };
    const wrapped = { oneOf: [{ oneOf: [{ const: 'A' }, { const: 'B' }, { const: 'C' }] }, { type: 'null' }] };

    expect(() => assertNoBreakingChanges(previous, wrapped)).not.toThrow();
    expect(collectBreakingChanges(previous, wrapped)).toEqual([]);
  });

  it('rejects narrowing constraints added beside a nested union wrapper', () => {
    const previous = { oneOf: [{ type: 'string' }] };
    const candidate = { oneOf: [{ oneOf: [{ type: 'string' }], minLength: 5 }] };

    expect(() => assertNoBreakingChanges(previous, candidate)).toThrow();
    expect(collectBreakingChanges(previous, candidate).length).toBeGreaterThan(0);
  });

  it('reports the removed middle composition option rather than its successor', () => {
    const previous = { oneOf: [{ const: 'A' }, { const: 'B' }, { const: 'C' }] };
    const candidate = { oneOf: [{ const: 'A' }, { const: 'C' }] };

    const changes = collectBreakingChanges(previous, candidate);
    expect(changes.filter((change) => change.reason.includes('option was removed'))).toEqual([
      expect.objectContaining({ oldValue: { const: 'B' } }),
    ]);
  });

  it('keeps removed-option identity stable across branch reordering', () => {
    const first = collectBreakingChanges(
      { oneOf: [{ const: 'A' }, { const: 'B' }, { const: 'C' }] },
      { oneOf: [{ const: 'A' }, { const: 'C' }] },
    ).find((change) => change.reason.includes('option was removed'));
    const reordered = collectBreakingChanges(
      { oneOf: [{ const: 'C' }, { const: 'A' }, { const: 'B' }] },
      { oneOf: [{ const: 'C' }, { const: 'A' }] },
    ).find((change) => change.reason.includes('option was removed'));

    expect(first?.oldValue).toEqual({ const: 'B' });
    expect(reordered?.oldValue).toEqual({ const: 'B' });
    expect(reordered?.stableIdentity).toBe(first?.stableIdentity);
    expect(reordered?.logicalIdentity).toBe(first?.logicalIdentity);
  });

  it('keeps identity stable when schema object key order changes', () => {
    const first = collectBreakingChanges(
      { type: 'object', properties: { id: { type: 'string' } }, required: [] },
      { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
    )[0];
    const reordered = collectBreakingChanges(
      { required: [], properties: { id: { type: 'string' } }, type: 'object' },
      { properties: { id: { type: 'string' } }, type: 'object', required: ['id'] },
    )[0];

    expect(first?.stableIdentity).toBe(reordered?.stableIdentity);
    expect(first?.logicalIdentity).toBe(reordered?.logicalIdentity);
  });

  it('makes the fail-fast error the first structured event with identical values', () => {
    const previous = { type: 'object', required: ['id'], properties: { id: { type: 'string' } } };
    const next = { type: 'object', required: [], properties: { id: { type: 'string' } } };
    const [first] = collectBreakingChanges(previous, next);
    let error: unknown;
    try {
      assertNoBreakingChanges(previous, next);
    } catch (caught) {
      error = caught;
    }

    expect(first).toBeDefined();
    if (first === undefined) throw new Error('expected a structured breaking event');
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(first.jsonPath);
    expect((error as Error).message).toContain(first.reason);
    expect((error as Error).message).toContain(JSON.stringify(first.oldValue));
    expect((error as Error).message).toContain(JSON.stringify(first.newValue));
  });

  it('collects every nested breaking path instead of stopping at the first operation failure', () => {
    const previous = {
      openapi: '3.1.0',
      paths: {
        '/records': {
          post: {
            parameters: [{ name: 'If-Match', in: 'header', required: false, schema: { type: 'string' } }],
            requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } } } } },
            responses: {
              '201': {
                headers: { Location: { required: true, schema: { type: 'string' } } },
                content: { 'application/json': { schema: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } } } },
              },
              '400': { content: { 'application/problem+json': { schema: { oneOf: [{ required: ['type'] }, { required: ['code'] }] } } } },
            },
          },
        },
      },
    };
    const next = {
      openapi: '3.1.0',
      paths: {
        '/records': {
          post: {
            parameters: [{ name: 'If-Match', in: 'header', required: true, schema: { type: 'string' } }],
            requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: {} } } } },
            responses: {
              '201': {
                headers: {},
                content: { 'application/json': { schema: { type: 'object', required: ['id', 'version'], properties: { id: { type: 'string' }, version: { type: 'integer' } } } } },
              },
              '400': { content: { 'application/problem+json': { schema: { oneOf: [{ required: ['type'] }] } } } },
            },
          },
        },
      },
    };

    const changes = collectBreakingChanges(previous, next);
    const paths = changes.map((change) => change.jsonPath);
    expect(paths).toEqual(expect.arrayContaining([
      'root.paths./records.post.parameters[name=If-Match, in=header].required',
      'root.paths./records.post.requestBody.content.application/json.schema.name',
      'root.paths./records.post.responses.201.headers.Location',
      'root.paths./records.post.responses.201.content.application/json.schema.version.required',
      'root.paths./records.post.responses.400.content.application/problem+json.schema.oneOf[1]',
    ]));
    expect(changes.every((change) => change.affectedPaths.length > 0)).toBe(true);
    expect(changes.find((change) => change.jsonPath.includes('If-Match'))?.oldValue).toEqual(false);
    expect(changes.find((change) => change.jsonPath.includes('If-Match'))?.newValue).toEqual(true);
  });
});
