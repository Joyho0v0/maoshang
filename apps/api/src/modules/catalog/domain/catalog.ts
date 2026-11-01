const DECIMAL_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

export type CatalogStatus = 'ACTIVE' | 'INACTIVE';
export type TrackingMode = 'NONE' | 'LOT' | 'SERIAL';

export class DecimalStringError extends Error {
  constructor(readonly code: 'INVALID_DECIMAL' | 'DECIMAL_SCALE_EXCEEDED' | 'DECIMAL_MUST_BE_POSITIVE' | 'DECIMAL_MUST_BE_NON_NEGATIVE') {
    super(code);
    this.name = 'DecimalStringError';
  }
}

export function isDecimalStringError(error: unknown): error is DecimalStringError {
  return error instanceof DecimalStringError;
}

export function parseDecimalString(value: string, options: { maxScale?: number; positive?: boolean; nonNegative?: boolean } = {}): { coefficient: bigint; scale: number; normalized: string } {
  if (typeof value !== 'string' || !DECIMAL_PATTERN.test(value)) throw new DecimalStringError('INVALID_DECIMAL');
  const negative = value.startsWith('-');
  if (options.positive === true && (negative || /^-?0(?:\.0+)?$/.test(value))) throw new DecimalStringError('DECIMAL_MUST_BE_POSITIVE');
  if (options.nonNegative === true && negative) throw new DecimalStringError('DECIMAL_MUST_BE_NON_NEGATIVE');
  const unsigned = negative ? value.slice(1) : value;
  const [integer, fraction = ''] = unsigned.split('.');
  if (options.maxScale !== undefined && fraction.length > options.maxScale) throw new DecimalStringError('DECIMAL_SCALE_EXCEEDED');
  const scale = fraction.length;
  const coefficient = BigInt(`${negative ? '-' : ''}${integer}${fraction}`);
  return { coefficient, scale, normalized: formatDecimal(coefficient, scale) };
}

export function addDecimalStrings(left: string, right: string): string {
  const a = parseDecimalString(left);
  const b = parseDecimalString(right);
  const scale = Math.max(a.scale, b.scale);
  return formatDecimal(scaleCoefficient(a.coefficient, a.scale, scale) + scaleCoefficient(b.coefficient, b.scale, scale), scale);
}

export function multiplyDecimalStrings(left: string, right: string): string {
  const a = parseDecimalString(left);
  const b = parseDecimalString(right);
  return formatDecimal(a.coefficient * b.coefficient, a.scale + b.scale);
}

export function assertDecimal(value: string, maxScale: number, positive = false, nonNegative = false): string {
  return parseDecimalString(value, { maxScale, positive, nonNegative }).normalized;
}

function scaleCoefficient(coefficient: bigint, fromScale: number, toScale: number): bigint {
  return coefficient * (10n ** BigInt(toScale - fromScale));
}

function formatDecimal(coefficient: bigint, scale: number): string {
  const negative = coefficient < 0n;
  const absolute = (negative ? -coefficient : coefficient).toString().padStart(scale + 1, '0');
  if (scale === 0) return `${negative ? '-' : ''}${absolute}`;
  const integer = absolute.slice(0, -scale) || '0';
  const fraction = absolute.slice(-scale);
  return `${negative ? '-' : ''}${integer}.${fraction}`;
}
