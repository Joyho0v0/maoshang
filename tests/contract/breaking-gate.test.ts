import { assertNoBreakingChanges, collectBreakingChanges } from '../../packages/contracts/openapi/breaking-gate.js';
import { normalizeDocument } from '../../packages/contracts/openapi/breaking-inventory.js';

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

  it('rejects 2020-12 sibling constraints added beside a nested union wrapper', () => {
    expect(() => assertNoBreakingChanges(
      { oneOf: [{ type: 'number' }] },
      { oneOf: [{ oneOf: [{ type: 'number' }], exclusiveMinimum: 0 }] },
    )).toThrow(/exclusiveMinimum|removed|composition/);
    expect(() => assertNoBreakingChanges(
      { oneOf: [{ type: 'object' }] },
      { oneOf: [{ oneOf: [{ type: 'object' }], unevaluatedProperties: false }] },
    )).toThrow(/unevaluatedProperties|removed|composition/);
  });

  it('fails closed for unsupported 2020-12 narrowing keywords', () => {
    const candidates: Array<[Record<string, unknown>, Record<string, unknown>]> = [
      [
        { oneOf: [{ type: 'string' }] },
        { oneOf: [{ oneOf: [{ type: 'string' }], not: { const: 'A' } }] },
      ],
      [
        { oneOf: [{ type: 'array' }] },
        { oneOf: [{ oneOf: [{ type: 'array' }], minContains: 1, contains: { const: 'A' } }] },
      ],
      [
        { oneOf: [{ type: 'object' }] },
        { oneOf: [{ oneOf: [{ type: 'object' }], minProperties: 1 }] },
      ],
    ];

    for (const [previous, candidate] of candidates) {
      expect(() => assertNoBreakingChanges(previous, candidate)).toThrow();
      expect(collectBreakingChanges(previous, candidate).length).toBeGreaterThan(0);
    }

    expect(() => assertNoBreakingChanges(
      { type: 'string' },
      { type: 'string', not: { const: 'A' } },
    )).toThrow(/not/);

    const unsupportedCandidates: Array<[Record<string, unknown>, Record<string, unknown>]> = [
      [
        { type: 'array' },
        { allOf: [{ type: 'array' }, { prefixItems: [{ const: 'A' }] }] },
      ],
      [
        { type: 'object' },
        { allOf: [{ type: 'object' }, { dependentSchemas: { a: { required: ['b'] } } }] },
      ],
      [
        { type: 'object' },
        { allOf: [{ type: 'object' }, { patternProperties: { '^x': { type: 'string' } } }] },
      ],
      [
        { type: 'object' },
        { allOf: [{ type: 'object' }, { additionalProperties: { type: 'string' } }] },
      ],
    ];
    for (const [previous, candidate] of unsupportedCandidates) {
      expect(() => assertNoBreakingChanges(previous, candidate)).toThrow();
      expect(collectBreakingChanges(previous, candidate).length).toBeGreaterThan(0);
    }
  });

  it('fails closed for ordinary schema vocabulary and markerless component schemas', async () => {
    for (const [previous, candidate] of [
      [{ type: 'array' }, { type: 'array', items: { type: 'string' } }],
      [{ type: 'array' }, { type: 'array', uniqueItems: true }],
      [{ type: 'number' }, { type: 'number', multipleOf: 2 }],
    ] as const) {
      expect(() => assertNoBreakingChanges(previous, candidate)).toThrow();
      expect(collectBreakingChanges(previous, candidate)).not.toEqual([]);
    }

    const baseline = {
      openapi: '3.1.0',
      info: { title: 'markerless schema test', version: '1.0.0' },
      components: { schemas: { FreeForm: {} } },
      paths: {},
    };
    const candidate = structuredClone(baseline);
    (candidate.components.schemas.FreeForm as Record<string, unknown>).futureAssertion = { limit: 1 };
    const [normalizedBaseline, normalizedCandidate] = await Promise.all([
      normalizeDocument(baseline),
      normalizeDocument(candidate),
    ]);
    expect(() => assertNoBreakingChanges(normalizedBaseline, normalizedCandidate)).toThrow();
    expect(collectBreakingChanges(normalizedBaseline, normalizedCandidate)).not.toEqual([]);
  });

  it('propagates schema context through every known Schema Object entry point', async () => {
    const makeDocument = (kind: 'parameter' | 'header' | 'additionalProperties' | 'oneOf' | 'contentSchema', schema: Record<string, unknown>) => {
      const document: Record<string, unknown> = {
        openapi: '3.1.0',
        info: { title: `schema context ${kind}`, version: '1.0.0' },
        paths: {},
        components: { schemas: { FreeForm: {} } },
      };

      if (kind === 'parameter') {
        document.paths = {
          '/probe': {
            get: {
              operationId: 'probeParameterSchema',
              parameters: [{ name: 'filter', in: 'query', schema }],
              responses: { '200': { description: 'ok' } },
            },
          },
        };
      } else if (kind === 'header') {
        document.paths = {
          '/probe': {
            get: {
              operationId: 'probeHeaderSchema',
              responses: { '200': { description: 'ok', headers: { 'X-Probe': { schema } } } },
            },
          },
        };
      } else if (kind === 'additionalProperties') {
        (document.components as Record<string, unknown>).schemas = { FreeForm: { additionalProperties: schema } };
      } else if (kind === 'oneOf') {
        (document.components as Record<string, unknown>).schemas = { FreeForm: { oneOf: [schema] } };
      } else {
        (document.components as Record<string, unknown>).schemas = { FreeForm: { contentSchema: schema } };
      }

      return document;
    };

    const probes: Array<{ name: 'parameter' | 'header' | 'additionalProperties' | 'oneOf' | 'contentSchema'; previous: Record<string, unknown>; candidate: Record<string, unknown> }> = [
      {
        name: 'parameter',
        previous: makeDocument('parameter', {}),
        candidate: makeDocument('parameter', { futureAssertion: { limit: 1 } }),
      },
      {
        name: 'header',
        previous: makeDocument('header', { type: 'string' }),
        candidate: makeDocument('header', { type: 'string', maxLength: 5 }),
      },
      {
        name: 'additionalProperties',
        previous: makeDocument('additionalProperties', {}),
        candidate: makeDocument('additionalProperties', { futureAssertion: { limit: 1 } }),
      },
      {
        name: 'oneOf',
        previous: makeDocument('oneOf', {}),
        candidate: makeDocument('oneOf', { futureAssertion: { limit: 1 } }),
      },
      {
        name: 'contentSchema',
        previous: makeDocument('contentSchema', {}),
        candidate: makeDocument('contentSchema', { futureAssertion: { limit: 1 } }),
      },
    ];

    for (const probe of probes) {
      const [normalizedPrevious, normalizedCandidate] = await Promise.all([
        normalizeDocument(probe.previous),
        normalizeDocument(probe.candidate),
      ]);
      expect(() => assertNoBreakingChanges(normalizedPrevious, normalizedCandidate), probe.name).toThrow();
      expect(collectBreakingChanges(normalizedPrevious, normalizedCandidate), probe.name).not.toEqual([]);
    }
  });

  it('routes every OpenAPI Schema Object entry point through the schema-aware collectors', async () => {
    type ProbeName =
      | 'reusable parameter schema'
      | 'reusable header schema'
      | 'operation parameter content schema'
      | 'response header content schema'
      | 'path item parameter schema'
      | 'reusable request body schema'
      | 'reusable response schema';
    type DocumentBuilder = (schema: Record<string, unknown>) => Record<string, unknown>;

    const base = (components: Record<string, unknown> = {}, paths: Record<string, unknown> = {}): Record<string, unknown> => ({
      openapi: '3.1.0',
      info: { title: 'schema entry routing test', version: '1.0.0' },
      paths,
      components,
    });
    const okResponse = { description: 'ok' };
    const content = (schema: Record<string, unknown>) => ({ 'application/json': { schema } });
    const parameter = (schema: Record<string, unknown>) => ({ name: 'probe', in: 'query', schema });
    const header = (schema: Record<string, unknown>) => ({ description: 'probe', schema });

    const probes: Array<{ name: ProbeName; build: DocumentBuilder }> = [
      {
        name: 'reusable parameter schema',
        build: (schema) => base({ parameters: { Probe: parameter(schema) } }),
      },
      {
        name: 'reusable header schema',
        build: (schema) => base({ headers: { Probe: header(schema) } }),
      },
      {
        name: 'operation parameter content schema',
        build: (schema) => base({}, {
          '/probe': {
            get: {
              operationId: 'probeParameterContent',
              parameters: [{ name: 'probe', in: 'query', content: content(schema) }],
              responses: { '200': okResponse },
            },
          },
        }),
      },
      {
        name: 'response header content schema',
        build: (schema) => base({}, {
          '/probe': {
            get: {
              operationId: 'probeHeaderContent',
              responses: { '200': { description: 'ok', headers: { Probe: { content: content(schema) } } } },
            },
          },
        }),
      },
      {
        name: 'path item parameter schema',
        build: (schema) => base({}, {
          '/probe': {
            parameters: [parameter(schema)],
            get: { operationId: 'probePathParameter', responses: { '200': okResponse } },
          },
        }),
      },
      {
        name: 'reusable request body schema',
        build: (schema) => base({ requestBodies: { Probe: { content: content(schema) } } }),
      },
      {
        name: 'reusable response schema',
        build: (schema) => base({ responses: { Probe: { description: 'ok', content: content(schema) } } }),
      },
    ];

    for (const probe of probes) {
      const previous = probe.build({});
      const candidate = probe.build({ futureAssertion: { limit: 1 } });
      const [normalizedPrevious, normalizedCandidate] = await Promise.all([
        normalizeDocument(previous),
        normalizeDocument(candidate),
      ]);
      expect(() => assertNoBreakingChanges(normalizedPrevious, normalizedCandidate), probe.name).toThrow();
      expect(collectBreakingChanges(normalizedPrevious, normalizedCandidate), probe.name).not.toEqual([]);
    }
  });

  it('treats direct allOf merge and split as equivalent in both directions', () => {
    const merged = {
      type: 'object',
      properties: { id: { type: 'string', minLength: 5 } },
    };
    const split = {
      allOf: [
        { type: 'object', properties: { id: { type: 'string' } } },
        { type: 'object', properties: { id: { minLength: 5 } } },
      ],
    };

    expect(() => assertNoBreakingChanges(merged, split)).not.toThrow();
    expect(() => assertNoBreakingChanges(split, merged)).not.toThrow();
    expect(collectBreakingChanges(merged, split)).toEqual([]);
    expect(collectBreakingChanges(split, merged)).toEqual([]);
  });

  it('does not collapse repeated composition occurrences of one dereferenced object', () => {
    const shared = { const: 'A' };
    const changes = collectBreakingChanges(
      { oneOf: [shared, shared] },
      { oneOf: [] },
    ).filter((change) => change.reason.includes('option was removed'));

    expect(changes).toHaveLength(2);
    expect(new Set(changes.map((change) => change.stableIdentity)).size).toBe(2);
    expect(new Set(changes.map((change) => change.sourceIdentity)).size).toBe(2);
    expect(changes.map((change) => change.sourceIdentity).some((identity) => identity.includes('~1'))).toBe(true);
  });

  it('indexes recursive dereferenced occurrences without overflowing the stack', async () => {
    const baseline = {
      openapi: '3.1.0',
      info: { title: 'recursive occurrence test', version: '1.0.0' },
      components: {
        schemas: {
          Shared: {
            type: 'object',
            properties: { self: { $ref: '#/components/schemas/Shared' } },
          },
          Wrapper: {
            oneOf: [
              { $ref: '#/components/schemas/Shared' },
              { $ref: '#/components/schemas/Shared' },
            ],
          },
        },
      },
      paths: {},
    };
    const candidate = structuredClone(baseline);
    candidate.components.schemas.Wrapper.oneOf = [];
    const [normalizedBaseline, normalizedCandidate] = await Promise.all([
      normalizeDocument(baseline),
      normalizeDocument(candidate),
    ]);

    const first = collectBreakingChanges(normalizedBaseline, normalizedCandidate)
      .filter((change) => change.reason.includes('option was removed'));
    const second = collectBreakingChanges(normalizedBaseline, normalizedCandidate)
      .filter((change) => change.reason.includes('option was removed'));
    expect(first).toHaveLength(2);
    expect(new Set(first.map((change) => change.sourceIdentity)).size).toBe(2);
    expect(first.map((change) => change.stableIdentity)).toEqual(second.map((change) => change.stableIdentity));
  });

  it('handles a recursive dereferenced composition back-edge with stable duplicate occurrences', async () => {
    const baseline = {
      openapi: '3.1.0',
      info: { title: 'recursive composition occurrence test', version: '1.0.0' },
      components: {
        schemas: {
          Shared: {
            oneOf: [{ type: 'object', properties: { next: { $ref: '#/components/schemas/Shared' } } }],
          },
          Wrapper: {
            oneOf: [
              { $ref: '#/components/schemas/Shared' },
              { $ref: '#/components/schemas/Shared' },
            ],
          },
        },
      },
      paths: {},
    };
    const candidate = structuredClone(baseline);
    candidate.components.schemas.Wrapper.oneOf = [];
    const [normalizedBaseline, normalizedCandidate] = await Promise.all([
      normalizeDocument(baseline),
      normalizeDocument(candidate),
    ]);

    const first = collectBreakingChanges(normalizedBaseline, normalizedCandidate)
      .filter((change) => change.reason.includes('option was removed'));
    const second = collectBreakingChanges(normalizedBaseline, normalizedCandidate)
      .filter((change) => change.reason.includes('option was removed'));
    expect(first).toHaveLength(2);
    expect(new Set(first.map((change) => change.sourceIdentity)).size).toBe(2);
    expect(first.map((change) => change.stableIdentity)).toEqual(second.map((change) => change.stableIdentity));
  });

  it('treats equivalent allOf property splits as compatible and added constraints as narrowing', () => {
    const oldSchema = {
      oneOf: [{ type: 'object', properties: { id: { type: 'string' } } }],
    };
    const narrowed = {
      oneOf: [{ allOf: [
        { type: 'object', properties: { id: { minLength: 5 } } },
        { type: 'object', properties: { id: { type: 'string' } } },
      ] }],
    };
    expect(() => assertNoBreakingChanges(oldSchema, narrowed)).toThrow(/minLength|removed|narrowed|composition/);

    const oldConstrained = {
      oneOf: [{ type: 'object', properties: { id: { type: 'string', minLength: 5 } } }],
    };
    const equivalentSplit = {
      oneOf: [{ allOf: [
        { type: 'object', properties: { id: { minLength: 5 } } },
        { type: 'object', properties: { id: { type: 'string' } } },
      ] }],
    };
    expect(() => assertNoBreakingChanges(oldConstrained, equivalentSplit)).not.toThrow();
    expect(() => assertNoBreakingChanges(equivalentSplit, oldConstrained)).not.toThrow();
  });

  it.each(['oneOf', 'anyOf', 'allOf'] as const)('keeps candidate-only %s identity stable across equivalent option reordering', (key) => {
    const first = collectBreakingChanges({}, { [key]: [{ type: 'string' }, { type: 'null' }] })[0];
    const reordered = collectBreakingChanges({}, { [key]: [{ type: 'null' }, { type: 'string' }] })[0];

    expect(first).toBeDefined();
    expect(reordered).toBeDefined();
    expect(first?.sourceIdentity).not.toMatch(/^unindexed-/);
    expect(reordered?.sourceIdentity).toBe(first?.sourceIdentity);
    expect(reordered?.logicalIdentity).toBe(first?.logicalIdentity);
    expect(reordered?.stableIdentity).toBe(first?.stableIdentity);
    expect(reordered?.affectedPaths).toEqual(first?.affectedPaths);
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
