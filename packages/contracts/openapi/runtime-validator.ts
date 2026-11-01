import AjvModule, { type ErrorObject } from 'ajv';
import addFormatsModule from 'ajv-formats';

type Schema = Record<string, unknown>;

export interface ContractValidator {
  validate(schemaName: string, value: unknown): boolean;
  validateSchema(schema: Schema, value: unknown): boolean;
  errors: ErrorObject[] | null | undefined;
}

export interface ContractValidatorOptions {
  readonly now?: () => Date;
}

export function createContractValidator(document: Record<string, unknown>, options: ContractValidatorOptions = {}): ContractValidator {
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

  const validators = new Map<string, ((value: unknown) => boolean) & { errors?: ErrorObject[] | null }>();
  let errors: ErrorObject[] | null | undefined;
  return {
    validate(schemaName: string, value: unknown): boolean {
      let validate = validators.get(schemaName);
      if (validate === undefined) {
        validate = ajv.compile({ $ref: `#/components/schemas/${schemaName}` });
        validators.set(schemaName, validate);
      }
      const valid = validate(value)
        && (schemaName === 'UploadIntent' || schemaName === 'DownloadIntent' ? validateIntentPayload(value, options.now, schemaName) : true)
        && (schemaName === 'Session' ? validateSessionOrganizationIdentity(value) : true);
      errors = validate.errors;
      return valid;
    },
    validateSchema(schema: Schema, value: unknown): boolean {
      const validate = ajv.compile(schema);
      const valid = validate(value);
      errors = validate.errors;
      return valid;
    },
    get errors() {
      return errors;
    },
  };
}

function validateSessionOrganizationIdentity(value: unknown): boolean {
  if (!isRecord(value) || typeof value.organizationId !== 'string') return false;
  return allOrganizationIdentifiersMatch(value, value.organizationId, new WeakSet<object>());
}

function allOrganizationIdentifiersMatch(value: unknown, expected: string, seen: WeakSet<object>): boolean {
  if (typeof value !== 'object' || value === null) return true;
  if (seen.has(value)) return true;
  seen.add(value);
  if (Array.isArray(value)) return value.every((nested) => allOrganizationIdentifiersMatch(nested, expected, seen));
  for (const [key, nested] of Object.entries(value)) {
    if (key === 'organizationId' && (typeof nested !== 'string' || nested !== expected)) return false;
    if (!allOrganizationIdentifiersMatch(nested, expected, seen)) return false;
  }
  return true;
}

export function validateIntentPayload(value: unknown, now: () => Date = () => new Date(), intentKind?: 'UploadIntent' | 'DownloadIntent'): boolean {
  if (!isRecord(value) || !isRecord(value.file) || typeof value.file.id !== 'string' || typeof value.href !== 'string' || value.href !== `/api/v1/files/${value.file.id}` || !isRecord(value.transfer)) return false;
  const transfer = value.transfer;
  const expectedKind = intentKind ?? (transfer.kind === 'HTTP_GET' ? 'DownloadIntent' : 'UploadIntent');
  const canonicalHref = `/api/v1/files/${value.file.id}`;
  if (typeof value.file.href !== 'undefined' && value.file.href !== canonicalHref) return false;
  if (expectedKind === 'UploadIntent' && value.file.href !== canonicalHref) return false;
  if (expectedKind === 'DownloadIntent' && value.file.status !== 'AVAILABLE') return false;
  if (expectedKind === 'UploadIntent' && transfer.kind !== 'HTTP_PUT' && transfer.kind !== 'HTTP_MULTIPART_POST') return false;
  if (expectedKind === 'DownloadIntent' && transfer.kind !== 'HTTP_GET') return false;
  if (typeof transfer.locator !== 'string' || !isFutureDate(transfer.expiresAt, now) || !isHttpsLocator(transfer.locator) || !validTransferHeaders(transfer.headers)) return false;
  const forbidden = forbiddenHeader(transfer.headers, transfer.kind);
  if (forbidden !== undefined) return false;
  if (transfer.kind === 'HTTP_PUT' && transfer.method === 'PUT') {
    if (transfer.formFields !== undefined || transfer.fileField !== undefined) return false;
    const contentType = headerValue(transfer.headers, 'content-type');
    return contentType === value.file.contentType;
  }
  if (transfer.kind === 'HTTP_MULTIPART_POST' && transfer.method === 'POST') {
    return isRecord(transfer.formFields) && Object.keys(transfer.formFields).length > 0 && typeof transfer.fileField === 'string' && transfer.fileField.length > 0;
  }
  if (transfer.kind === 'HTTP_GET' && transfer.method === 'GET') return transfer.formFields === undefined && transfer.fileField === undefined;
  return false;
}

export function assertIntentPayload(value: unknown, now: () => Date = () => new Date()): asserts value is Record<string, unknown> {
  if (!validateIntentPayload(value, now)) throw new Error('Invalid transfer intent descriptor.');
}

function isFutureDate(value: unknown, now: () => Date): boolean {
  if (typeof value !== 'string') return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed > now().getTime();
}

function isHttpsLocator(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.length > 0;
  } catch {
    return false;
  }
}

function validTransferHeaders(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && Object.values(value).every((header) => typeof header === 'string');
}

function forbiddenHeader(headers: Record<string, unknown>, transferKind?: unknown): string | undefined {
  const forbidden = new Set(['cookie', 'authorization', 'x-csrf-token', 'idempotency-key', 'if-match']);
  if (transferKind === 'HTTP_MULTIPART_POST') forbidden.add('content-type');
  return Object.keys(headers).find((name) => forbidden.has(name.toLowerCase()));
}

function headerValue(headers: Record<string, unknown>, expected: string): string | undefined {
  const name = Object.keys(headers).find((candidate) => candidate.toLowerCase() === expected);
  const value = name === undefined ? undefined : headers[name];
  return typeof value === 'string' ? value : undefined;
}

function isRecord(value: unknown): value is Schema {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
