/**
 * Tests de utilidades puras de formato (sin DOM ni React).
 * Son baratas de mantener y detectan regresiones en cómo se muestra el dinero al usuario.
 */
import { describe, expect, it } from 'vitest';

import { formatCurrency } from './formatters.js';

describe('formatCurrency', () => {
  it('formatea números en COP con locale es-CO', () => {
    expect(formatCurrency(1190000)).toMatch(/1/);
    expect(formatCurrency(1190000)).toMatch(/190/);
    expect(formatCurrency(1190000)).toContain('$');
  });

  it('trata null/undefined/string vacío como 0', () => {
    expect(formatCurrency(null)).toContain('0');
    expect(formatCurrency(undefined)).toContain('0');
    expect(formatCurrency('')).toContain('0');
  });
});
