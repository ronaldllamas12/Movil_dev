/**
 * getProducts normaliza distintas formas de respuesta del backend (array plano, items, products).
 * El resto de funciones delegan en verbos HTTP coherentes.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../axiosClient.js', () => ({
  default: apiClientMock,
}));

import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  toggleProductStatus,
  updateProduct,
  uploadProductImage,
} from './productsService.js';

describe('productsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getProducts devuelve array si el payload ya es lista', async () => {
    apiClientMock.get.mockResolvedValue({ data: [{ id: 1 }] });

    const list = await getProducts({ categoria: 'x' });

    expect(apiClientMock.get).toHaveBeenCalledWith('/products', { params: { categoria: 'x' } });
    expect(list).toEqual([{ id: 1 }]);
  });

  it('getProducts extrae items o products si vienen envueltos', async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: { items: [{ id: 2 }] } });
    expect(await getProducts()).toEqual([{ id: 2 }]);

    apiClientMock.get.mockResolvedValueOnce({ data: { products: [{ id: 3 }] } });
    expect(await getProducts()).toEqual([{ id: 3 }]);
  });

  it('getProducts devuelve [] si no reconoce la forma', async () => {
    apiClientMock.get.mockResolvedValue({ data: { foo: 'bar' } });

    expect(await getProducts()).toEqual([]);
  });

  it('getProductById, createProduct, updateProduct y deleteProduct', async () => {
    apiClientMock.get.mockResolvedValue({ data: { id: 9 } });
    expect(await getProductById(9)).toEqual({ id: 9 });
    expect(apiClientMock.get).toHaveBeenCalledWith('/products/9');

    apiClientMock.post.mockResolvedValue({ data: { id: 1 } });
    await createProduct({ nombre: 'N' });
    expect(apiClientMock.post).toHaveBeenCalledWith('/products', { nombre: 'N' });

    apiClientMock.patch.mockResolvedValue({ data: { ok: 1 } });
    await updateProduct(3, { precio_unitario: 1 });
    expect(apiClientMock.patch).toHaveBeenCalledWith('/products/3', { precio_unitario: 1 });

    apiClientMock.delete.mockResolvedValue({});
    await deleteProduct(3);
    expect(apiClientMock.delete).toHaveBeenCalledWith('/products/3');
  });

  it('toggleProductStatus envía is_active como query param', async () => {
    apiClientMock.patch.mockResolvedValue({ data: { active: true } });

    await toggleProductStatus(7, false);

    expect(apiClientMock.patch).toHaveBeenCalledWith('/products/7/status', null, {
      params: { is_active: false },
    });
  });

  it('uploadProductImage POST multipart', async () => {
    apiClientMock.post.mockResolvedValue({ data: { path: '/img.png' } });
    const file = new File(['b'], 'p.jpg', { type: 'image/jpeg' });

    const res = await uploadProductImage(file);

    expect(res.path).toBe('/img.png');
    expect(apiClientMock.post).toHaveBeenCalledWith(
      '/products/upload-image',
      expect.any(FormData),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  });
});
