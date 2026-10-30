import {
  asDecimalString,
  formatMoney,
  formatQuantity,
  isDecimalString,
} from './formatters';

describe('DecimalString formatters', () => {
  it('accepts contract decimals without converting them to floating point', () => {
    expect(isDecimalString('0.10')).toBe(true);
    expect(isDecimalString('-12.500')).toBe(true);
    expect(asDecimalString('9007199254740993.10')).toBe('9007199254740993.10');
  });

  it('rejects values outside the frozen DecimalString shape', () => {
    expect(isDecimalString('')).toBe(false);
    expect(isDecimalString('1e3')).toBe(false);
    expect(isDecimalString('1.2.3')).toBe(false);
    expect(() => asDecimalString(1.2)).toThrow('DecimalString');
  });

  it('formats money using the exact decimal text', () => {
    expect(formatMoney(asDecimalString('9007199254740993.10'), 'USD')).toBe(
      'USD 9,007,199,254,740,993.10',
    );
  });

  it('formats quantities without arithmetic', () => {
    expect(formatQuantity(asDecimalString('12.500'), 'kg')).toBe('12.500 kg');
  });
});
