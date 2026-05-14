import { describe, expect, it } from 'vitest';
import { formatCurrency } from './formatters';

describe('formatCurrency', () => {
  it('formatea numeros en COP sin decimales', () => {
    expect(formatCurrency(1234567).replace(/\s+/g, ' ')).toBe('$ 1.234.567');
  });

  it('acepta string numerico', () => {
    expect(formatCurrency('5000').replace(/\s+/g, ' ')).toBe('$ 5.000');
  });

  it('retorna 0 cuando el valor no existe', () => {
    expect(formatCurrency(undefined).replace(/\s+/g, ' ')).toBe('$ 0');
  });
});
