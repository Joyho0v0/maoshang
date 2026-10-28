import AjvModule from 'ajv';
import addFormatsModule from 'ajv-formats';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';

describe('contract response schemas', () => {
  it('accepts CommandStatus discriminated states and rejects malformed states', async () => {
    const source = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as {
      components: { schemas: Record<string, object> };
    };
    const Ajv = AjvModule as unknown as new (options?: object) => { addSchema: (schema: object, key: string) => void; compile: (schema: object) => (data: unknown) => boolean };
    const addFormats = addFormatsModule as unknown as (instance: object) => void;
    const ajv = new Ajv({ strict: false });
    addFormats(ajv);
    for (const [name, schema] of Object.entries(source.components.schemas)) {
      ajv.addSchema(schema, `#/components/schemas/${name}`);
    }
    const validate = ajv.compile({ $ref: '#/components/schemas/CommandStatus' });

    expect(validate({
      commandId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
      operationId: 'reviewPayment',
      state: 'IN_PROGRESS',
      startedAt: '2026-10-28T05:00:00Z',
      completedAt: null,
      expiresAt: '2026-10-29T05:00:00Z',
      retryAfterMs: 1000,
      httpStatus: null,
      resource: null,
      resultHref: null,
      problem: null,
    })).toBe(true);

    expect(validate({
      commandId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
      operationId: 'reviewPayment',
      state: 'IN_PROGRESS',
      retryAfterMs: 0,
      completedAt: '2026-10-28T05:00:00Z',
    })).toBe(false);
  });
});
