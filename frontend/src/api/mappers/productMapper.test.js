import { describe, expect, it, vi } from 'vitest';

import {
    mapProductFromApi,
    mapProductsFromApi,
    mapProductToApi,
    toProductCardModel,
} from './productMapper.js';

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

describe('productMapper', () => {
  it('mapProductFromApi normaliza precios, colores e imagen', () => {
    const mapped = mapProductFromApi(apiProduct);

    expect(mapped.id).toBe(1);
    expect(mapped.precio).toBe(1190000);
    expect(mapped.formattedPrice).toBe('1.190.000');
    expect(mapped.colores_disponibles).toEqual(['Negro', 'Azul']);
    expect(mapped.color_variants).toHaveLength(2);
    expect(mapped.image).toBe('https://example.com/phone.jpg');
  });

  it('mapProductFromApi retorna null cuando no recibe producto', () => {
    expect(mapProductFromApi(null)).toBeNull();
  });

  it('mapProductFromApi acepta colores como JSON serializado', () => {
    const mapped = mapProductFromApi({
      ...apiProduct,
      colores_disponibles: '["Rojo","Blanco"]',
      color_variants: [],
    });

    expect(mapped.colores_disponibles).toEqual(['Rojo', 'Blanco']);
  });

  it('mapProductFromApi acepta color_variants como JSON serializado y limpia valores', () => {
    const mapped = mapProductFromApi({
      ...apiProduct,
      color_variants: '[{"color":" Verde ","stock":"2","image_url":" https://example.com/v.jpg "}]',
      colores_disponibles: [],
    });

    expect(mapped.color_variants).toEqual([
      { color: 'Verde', stock: 2, image_url: 'https://example.com/v.jpg' },
    ]);
    expect(mapped.colores_disponibles).toEqual(['Verde']);
  });

  it('mapProductFromApi maneja JSON invalido en colores y variantes', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mapped = mapProductFromApi({
      ...apiProduct,
      colores_disponibles: '{bad-json}',
      color_variants: '{bad-json}',
    });

    expect(mapped.colores_disponibles).toEqual([]);
    expect(mapped.color_variants).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('mapProductFromApi prioriza color_variants validos sobre colores_disponibles', () => {
    const mapped = mapProductFromApi({
      ...apiProduct,
      colores_disponibles: ['Rojo', 'Blanco'],
      color_variants: [
        { color: 'Verde', stock: 1, image_url: null },
        { color: '   ', stock: 99 },
      ],
    });

    expect(mapped.color_variants).toEqual([
      { color: 'Verde', image_url: null, stock: 1 },
    ]);
    expect(mapped.colores_disponibles).toEqual(['Verde']);
  });

  it('mapProductsFromApi protege contra entradas no lista', () => {
    expect(mapProductsFromApi(null)).toEqual([]);
    expect(mapProductsFromApi([apiProduct])).toHaveLength(1);
  });

  it('mapProductToApi transforma el modelo frontend al contrato del backend', () => {
    const payload = mapProductToApi({
      ...apiProduct,
      precio: 950000,
      colores_disponibles: ['Negro'],
      color_variants: [{ color: 'Negro', stock: 3, image_url: 'https://example.com/negro.jpg' }],
    });

    expect(payload.precio_unitario).toBe(1190000);
    expect(payload.colores_disponibles).toEqual(['Negro']);
    expect(payload.color_variants).toEqual([{ color: 'Negro', stock: 3, image_url: 'https://example.com/negro.jpg' }]);
    expect(payload.is_active).toBe(true);
  });

  it('mapProductToApi toma precio cuando precio_unitario no existe', () => {
    const payload = mapProductToApi({
      ...apiProduct,
      precio_unitario: undefined,
      precio: 950000,
      color_variants: [],
    });

    expect(payload.precio_unitario).toBe(950000);
  });

  it('mapProductToApi sanea variantes con image_url vacio y stock no numerico', () => {
    const payload = mapProductToApi({
      ...apiProduct,
      color_variants: [{ color: ' Azul ', image_url: '', stock: 'no-num' }],
    });

    expect(payload.color_variants).toEqual([
      { color: 'Azul', image_url: null, stock: Number.NaN },
    ]);
    expect(payload.colores_disponibles).toEqual(['Azul']);
  });

  it('mapProductToApi usa fallback de colores_disponibles cuando no hay variantes validas', () => {
    const payload = mapProductToApi({
      ...apiProduct,
      color_variants: [{ color: '   ', stock: 3, image_url: null }],
      colores_disponibles: ['Gris'],
      is_active: undefined,
      is_featured: false,
    });

    expect(payload.color_variants).toEqual([]);
    expect(payload.colores_disponibles).toEqual(['Gris']);
    expect(payload.is_active).toBe(true);
    expect(payload.is_featured).toBe(false);
  });

  it('toProductCardModel agrega valores visuales por defecto', () => {
    const card = toProductCardModel({ ...apiProduct, imagen_url: null });

    expect(card.image).toBe('https://placehold.co/400x400?text=Producto');
    expect(card.rating).toBe(4.7);
    expect(card.reviews).toBe(0);
  });

  it('toProductCardModel prioriza imagen_url y luego image', () => {
    const withImagenUrl = toProductCardModel({ ...apiProduct, imagen_url: 'https://cdn.com/1.jpg', image: 'https://cdn.com/2.jpg' });
    const withImageOnly = toProductCardModel({ ...apiProduct, imagen_url: '', image: 'https://cdn.com/2.jpg' });

    expect(withImagenUrl.image).toBe('https://cdn.com/1.jpg');
    expect(withImageOnly.image).toBe('https://placehold.co/400x400?text=Producto');
  });

  it('toProductCardModel retorna null en entrada vacia', () => {
    expect(toProductCardModel(null)).toBeNull();
  });
});
