/**
 * Tests del mapper de productos (API ↔ frontend).
 *
 * Qué validamos aquí:
 * - Que los precios y textos visibles (formattedPrice) sigan el formato esperado.
 * - Que colores e imágenes vengan bien parseados aunque la API mande strings JSON.
 * - Que entradas inválidas (null, no-array) no rompan la app (listas vacías, null).
 * - Que el payload hacia el backend respete el contrato (snake_case / campos clave).
 */
import { describe, expect, it } from 'vitest';

import {
  mapProductFromApi,
  mapProductsFromApi,
  mapProductToApi,
  toProductCardModel,
} from './productMapper.js';

/** Fixture mínima que imita la forma típica de un producto en la API */
const apiProduct = {
  id: 1,
  referencia: 'REF-001',
  marca: 'Samsung',
  nombre: 'Galaxy Test',
  categoria: 'gama media',
  descripcion_breve: 'Telefono de prueba',
  cantidad_stock: 5,
  precio_unitario: 1190000,
  tamano_memoria_ram: '8GB',
  rom: '128GB',
  colores_disponibles: ['Negro', 'Azul'],
  color_variants: [
    { color: 'Negro', stock: 4, image_url: 'https://example.com/negro.jpg' },
    { color: 'Azul', stock: 1, image_url: 'https://example.com/azul.jpg' },
  ],
  conectividad: '5G',
  procesador: 'Test Chip',
  dimensiones: '160x70x8',
  bateria: '5000mAh',
  resolucion_camara_principal: '50MP',
  resolucion_camara_frontal: '32MP',
  capacidad_carga_rapida: '67W',
  garantia_meses: 12,
  imagen_url: 'https://example.com/phone.jpg',
  is_active: true,
  is_featured: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: null,
};

describe('mapProductFromApi', () => {
  it('normaliza precios, colores e imagen', () => {
    const mapped = mapProductFromApi(apiProduct);

    expect(mapped.id).toBe(1);
    expect(mapped.precio).toBe(1190000);
    expect(mapped.formattedPrice).toBe('1.190.000');
    expect(mapped.colores_disponibles).toEqual(['Negro', 'Azul']);
    expect(mapped.color_variants).toHaveLength(2);
    expect(mapped.image).toBe('https://example.com/phone.jpg');
  });

  it('acepta colores como JSON serializado en string', () => {
    const mapped = mapProductFromApi({
      ...apiProduct,
      colores_disponibles: '["Rojo","Blanco"]',
      color_variants: [],
    });

    expect(mapped.colores_disponibles).toEqual(['Rojo', 'Blanco']);
  });
});

describe('mapProductsFromApi', () => {
  it('devuelve [] si la API no manda una lista (null / undefined / objeto)', () => {
    expect(mapProductsFromApi(null)).toEqual([]);
    expect(mapProductsFromApi(undefined)).toEqual([]);
    expect(mapProductsFromApi({})).toEqual([]);
  });

  it('mapea cada elemento cuando sí es un array', () => {
    expect(mapProductsFromApi([apiProduct])).toHaveLength(1);
  });
});

describe('mapProductToApi', () => {
  it('arma el payload que espera el backend (precio_unitario, colores, flags)', () => {
    const payload = mapProductToApi({
      ...apiProduct,
      precio: 950000,
      colores_disponibles: ['Negro'],
      color_variants: [{ color: 'Negro', stock: 3, image_url: 'https://example.com/negro.jpg' }],
    });

    // precio_unitario del spread sigue siendo el de apiProduct (1190000); precio solo aplica si no hay precio_unitario
    expect(payload.precio_unitario).toBe(1190000);
    expect(payload.colores_disponibles).toEqual(['Negro']);
    expect(payload.color_variants).toEqual([
      { color: 'Negro', stock: 3, image_url: 'https://example.com/negro.jpg' },
    ]);
    expect(payload.is_active).toBe(true);
  });
});

describe('mapProductFromApi JSON inválido', () => {
  it('colores_disponibles mal formado no rompe el mapper', () => {
    const mapped = mapProductFromApi({
      ...apiProduct,
      colores_disponibles: '{no-es-json',
      color_variants: [],
    });
    expect(mapped.colores_disponibles).toEqual([]);
  });

  it('color_variants mal formado no rompe el mapper', () => {
    const mapped = mapProductFromApi({
      ...apiProduct,
      colores_disponibles: [],
      color_variants: 'not-json',
    });
    expect(mapped.color_variants).toEqual([]);
  });
});

describe('toProductCardModel', () => {
  it('rellena imagen por defecto y metadatos visuales de tarjeta', () => {
    const card = toProductCardModel({ ...apiProduct, imagen_url: null });

    expect(card.image).toBe('https://placehold.co/400x400?text=Producto');
    expect(card.rating).toBe(4.7);
    expect(card.reviews).toBe(0);
  });
});
