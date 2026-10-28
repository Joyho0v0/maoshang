export function assertNoBreakingChanges(previous: unknown, next: unknown, path = 'root'): void {
  if (!isRecord(previous) || !isRecord(next)) return;

  if (Array.isArray(previous.required)) {
    const nextRequired = new Set(Array.isArray(next.required) ? next.required.filter(isString) : []);
    for (const field of previous.required.filter(isString)) {
      if (!nextRequired.has(field)) throw new Error(`Breaking change at ${path}: required field ${field} was removed.`);
    }
  }

  if (Array.isArray(previous.enum)) {
    const previousEnum = previous.enum.filter(isScalar);
    const nextEnum = new Set(Array.isArray(next.enum) ? next.enum.filter(isScalar).map((value) => JSON.stringify(value)) : []);
    for (const value of previousEnum) {
      if (!nextEnum.has(JSON.stringify(value))) throw new Error(`Breaking change at ${path}: enum value ${String(value)} was removed.`);
    }
  }

  const previousProperties = isRecord(previous.properties) ? previous.properties : {};
  const nextProperties = isRecord(next.properties) ? next.properties : {};
  for (const [property, previousSchema] of Object.entries(previousProperties)) {
    const nextSchema = nextProperties[property];
    if (nextSchema === undefined) {
      if (Array.isArray(previous.required) && previous.required.includes(property)) throw new Error(`Breaking change at ${path}: property ${property} was removed.`);
      continue;
    }
    assertNoBreakingChanges(previousSchema, nextSchema, `${path}.${property}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isString(value: unknown): value is string { return typeof value === 'string'; }
function isScalar(value: unknown): boolean { return value === null || ['string', 'number', 'boolean'].includes(typeof value); }
