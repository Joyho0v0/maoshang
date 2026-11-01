/** The contract's DecimalString is text, never a JavaScript number. */
export type DecimalString = string & { readonly __decimalString: unique symbol };

const DECIMAL_STRING_PATTERN = /^-?\d+(?:\.\d+)?$/;

export function isDecimalString(value: unknown): value is DecimalString {
  return typeof value === 'string' && DECIMAL_STRING_PATTERN.test(value);
}

export function asDecimalString(value: unknown): DecimalString {
  if (!isDecimalString(value)) {
    throw new TypeError('Value must be a contract DecimalString.');
  }
  return value;
}

export function formatMoney(value: DecimalString, currency: string): string {
  const code = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) throw new TypeError('Currency must be a three-letter code.');
  return `${code} ${groupDecimal(value)}`;
}

export function formatQuantity(value: DecimalString, unit: string): string {
  const normalizedUnit = unit.trim();
  return normalizedUnit.length === 0 ? groupDecimal(value) : `${groupDecimal(value)} ${normalizedUnit}`;
}

function groupDecimal(value: DecimalString): string {
  const negative = value.startsWith('-');
  const unsigned = negative ? value.slice(1) : value;
  const [integer = '', fraction] = unsigned.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}${grouped}${fraction === undefined ? '' : `.${fraction}`}`;
}
