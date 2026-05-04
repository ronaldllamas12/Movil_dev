import assert from 'node:assert/strict';
import test from 'node:test';

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

test('mapProductFromApi normaliza precios, colores e imagen', () => {
  const mapped = mapProductFromApi(apiProduct);

  assert.equal(mapped.id, 1);
  assert.equal(mapped.precio, 1190000);
  assert.equal(mapped.formattedPrice, '1.190.000');
  assert.deepEqual(mapped.colores_disponibles, ['Negro', 'Azul']);
  assert.equal(mapped.color_variants.length, 2);
  assert.equal(mapped.image, 'https://example.com/phone.jpg');
});

test('mapProductFromApi acepta colores como JSON serializado', () => {
  const mapped = mapProductFromApi({
    ...apiProduct,
    colores_disponibles: '["Rojo","Blanco"]',
    color_variants: [],
  });

  assert.deepEqual(mapped.colores_disponibles, ['Rojo', 'Blanco']);
});

test('mapProductsFromApi protege contra entradas no lista', () => {
  assert.deepEqual(mapProductsFromApi(null), []);
  assert.equal(mapProductsFromApi([apiProduct]).length, 1);
});

test('mapProductToApi transforma el modelo frontend al contrato del backend', () => {
  const payload = mapProductToApi({
    ...apiProduct,
    precio: 950000,
    colores_disponibles: ['Negro'],
    color_variants: [{ color: 'Negro', stock: 3, image_url: 'https://example.com/negro.jpg' }],
  });

  assert.equal(payload.precio_unitario, 1190000);
  assert.deepEqual(payload.colores_disponibles, ['Negro']);
  assert.deepEqual(payload.color_variants, [{ color: 'Negro', stock: 3, image_url: 'https://example.com/negro.jpg' }]);
  assert.equal(payload.is_active, true);
});

test('toProductCardModel agrega valores visuales por defecto', () => {
  const card = toProductCardModel({ ...apiProduct, imagen_url: null });

  assert.equal(card.image, 'https://placehold.co/400x400?text=Producto');
  assert.equal(card.rating, 4.7);
  assert.equal(card.reviews, 0);
});
