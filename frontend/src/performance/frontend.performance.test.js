import { describe, expect, it } from 'vitest';
import { mapProductFromApi } from '../api/mappers/productMapper';
import { formatCurrency } from '../utils/formatters';

describe('frontend performance smoke checks', () => {
  it('mapea lotes de productos sin degradacion severa', () => {
    const base = {
      id: 1,
      referencia: 'REF',
      marca: 'Marca',
      nombre: 'Telefono',
      categoria: 'premium',
      cantidad_stock: 12,
      precio_unitario: 3500000,
      color_variants: [{ color: 'Negro', stock: 10 }],
    };

    const start = performance.now();
    for (let i = 0; i < 5000; i += 1) {
      mapProductFromApi({ ...base, id: i, referencia: `REF-${i}` });
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(1500);
  });

  it('formatea moneda de forma estable en lote', () => {
    const start = performance.now();
    for (let i = 0; i < 20000; i += 1) {
      formatCurrency(i * 1234.56);
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(4500);
  });
});
