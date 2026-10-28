import AjvModule, { type ErrorObject } from 'ajv';
import addFormatsModule from 'ajv-formats';

type Schema = Record<string, unknown>;

export interface ContractValidator {
  validate(schemaName: string, value: unknown): boolean;
  errors: ErrorObject[] | null | undefined;
}

export function createContractValidator(document: Record<string, unknown>): ContractValidator {
  const Ajv = AjvModule as unknown as new (options?: object) => {
    addSchema: (schema: Schema, key: string) => void;
    compile: (schema: Schema) => ((value: unknown) => boolean) & { errors?: ErrorObject[] | null };
  };
  const addFormats = addFormatsModule as unknown as (instance: object) => void;
  const ajv = new Ajv({ strict: false, allErrors: true, allowUnionTypes: true });
  addFormats(ajv);
  const schemas = isRecord(document.components) && isRecord(document.components.schemas) ? document.components.schemas : {};
  for (const [name, schema] of Object.entries(schemas)) {
    if (isRecord(schema)) ajv.addSchema(schema, `#/components/schemas/${name}`);
  }

  let errors: ErrorObject[] | null | undefined;
  return {
    validate(schemaName: string, value: unknown): boolean {
      const validate = ajv.compile({ $ref: `#/components/schemas/${schemaName}` });
      const valid = validate(value);
      errors = validate.errors;
      return valid;
    },
    get errors() {
      return errors;
    },
  };
}

function isRecord(value: unknown): value is Schema {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
