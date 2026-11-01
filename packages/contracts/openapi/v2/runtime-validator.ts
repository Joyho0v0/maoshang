import Ajv2020Module from 'ajv/dist/2020.js';
import addFormatsModule from 'ajv-formats';
const Ajv2020 = Ajv2020Module as unknown as new (options?: object) => { addSchema: (schema: object, key: string) => void; compile: (schema: object) => ((value: unknown) => boolean) & { errors?: unknown[] | null }; };
const addFormats = addFormatsModule as unknown as (instance: object) => void;
export interface RuntimeValidator { validate(schemaName: string, value: unknown): boolean; validateSchema(schema: object, value: unknown): boolean; readonly errors: unknown[] | null | undefined; }
export function createV2RuntimeValidator(document: Record<string, unknown>): RuntimeValidator {
  const ajv = new Ajv2020({ allErrors: true, strict: false, allowUnionTypes: true });
  addFormats(ajv);
  const schemas = (document.components as { schemas?: Record<string, object> }).schemas ?? {};
  for (const [name, schema] of Object.entries(schemas)) ajv.addSchema(schema, '#/components/schemas/' + name);
  const validators = new Map<string, ((value: unknown) => boolean) & { errors?: unknown[] | null }>();
  let errors: unknown[] | null | undefined;
  function orderStateErrors(value: unknown): unknown[] {
    const order = value as { readonly status?: unknown; readonly stage?: unknown; readonly currency?: unknown; readonly capabilities?: unknown; readonly allowedTransitions?: unknown; readonly lines?: readonly Record<string, unknown>[] };
    const caps = Array.isArray(order?.capabilities) ? order.capabilities as string[] : []; const transitions = Array.isArray(order?.allowedTransitions) ? order.allowedTransitions as Array<Record<string, unknown>> : [];
    const terminal = order?.status === 'FULFILLED' || order?.status === 'CANCELLED' || order?.stage === 'CLOSED';
    if (terminal) { if (caps.length !== 0 || transitions.length !== 0) return [{ instancePath: '', keyword: 'x-order-state', params: {}, message: 'terminal order state must expose empty capabilities and allowedTransitions' }]; }
    else {
      const next = ({ INITIAL_CONTACT: 'QUOTING', QUOTING: 'QUOTE_FOLLOW_UP', QUOTE_FOLLOW_UP: 'DEPOSIT_PENDING', DEPOSIT_PENDING: 'DEPOSIT_CONFIRMED', DEPOSIT_CONFIRMED: 'FULFILLMENT', FULFILLMENT: 'FOB_COMPLETED', FOB_COMPLETED: 'CLOSED' } as Record<string, string>)[String(order?.stage)];
      const canUpdate = order?.status === 'DRAFT' && ['INITIAL_CONTACT', 'QUOTING', 'QUOTE_FOLLOW_UP'].includes(String(order?.stage)); const canTransition = next !== undefined;
      const allowedCaps = new Set([...(canUpdate ? ['order.update'] : []), ...(canTransition ? ['order.transition'] : [])]);
      if (caps.length !== new Set(caps).size || caps.some((cap) => !allowedCaps.has(cap))) return [{ instancePath: '', keyword: 'x-order-state', params: {}, message: 'order capabilities do not match independent permission projection' }];
      if (caps.includes('order.update') && !canUpdate) return [{ instancePath: '', keyword: 'x-order-state', params: {}, message: 'order.update is not allowed for this status/stage' }];
      if (caps.includes('order.transition') && !canTransition) return [{ instancePath: '', keyword: 'x-order-state', params: {}, message: 'order.transition is not allowed for this stage' }];
      const expectedTransitions = caps.includes('order.transition') ? [{ action: 'ADVANCE', toStage: next }, { action: 'CANCEL' }] : [];
      if (JSON.stringify(transitions) !== JSON.stringify(expectedTransitions)) return [{ instancePath: '', keyword: 'x-order-state', params: {}, message: 'allowedTransitions do not match independent transition capability' }];
    }
    for (const line of order.lines ?? []) { const snapshot = line.priceSnapshot as { sourceKind?: unknown; sourceCurrency?: unknown } | undefined; const fx = line.fxSnapshot as { baseCurrency?: unknown; quoteCurrency?: unknown } | null | undefined; const sameCurrency = snapshot?.sourceCurrency === order.currency; if (line.itemKind === 'STANDARD' && (snapshot?.sourceKind !== 'CATALOG_POLICY' || (sameCurrency ? fx !== null : fx === null || fx === undefined || fx.baseCurrency !== snapshot.sourceCurrency || fx.quoteCurrency !== order.currency))) return [{ instancePath: '/lines', keyword: 'x-order-line', params: {}, message: 'STANDARD price/FX snapshot semantics are invalid' }]; if (line.itemKind === 'NON_STANDARD' && (snapshot?.sourceKind !== 'MANUAL_QUOTE' || snapshot.sourceCurrency !== order.currency || fx !== null)) return [{ instancePath: '/lines', keyword: 'x-order-line', params: {}, message: 'NON_STANDARD price/FX snapshot semantics are invalid' }]; }
    return [];
  }
  return { validate(schemaName, value) { let validator = validators.get(schemaName); if (validator === undefined) { const compiled = ajv.compile({ $ref: '#/components/schemas/' + schemaName }); validator = compiled; validators.set(schemaName, compiled); } const current = validator!; const valid = current(value); errors = current.errors; if (!valid) return false; const stateErrors = schemaName === 'OrderV2' ? orderStateErrors(value) : schemaName === 'OrderPage' && typeof value === 'object' && value !== null && Array.isArray((value as { readonly data?: unknown[] }).data) ? (value as { readonly data: unknown[] }).data.flatMap(orderStateErrors) : []; if (stateErrors.length > 0) { errors = stateErrors; return false; } return true; }, validateSchema(schema, value) { const current = ajv.compile(schema); const valid = current(value); errors = current.errors; return valid; }, get errors() { return errors; } };
}
