import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../axiosClient', () => ({
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
} from './productsService';

describe('productsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normaliza payloads posibles de listado', async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: [{ id: 1 }] });
    await expect(getProducts()).resolves.toEqual([{ id: 1 }]);

    apiClientMock.get.mockResolvedValueOnce({ data: { items: [{ id: 2 }] } });
    await expect(getProducts()).resolves.toEqual([{ id: 2 }]);

    apiClientMock.get.mockResolvedValueOnce({ data: { products: [{ id: 3 }] } });
    await expect(getProducts()).resolves.toEqual([{ id: 3 }]);
  });

  it('retorna arreglo vacio para payload no soportado', async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: { unexpected: true } });
    await expect(getProducts()).resolves.toEqual([]);
  });

  it('delegan operaciones CRUD al cliente HTTP', async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: { id: 9 } });
    apiClientMock.post.mockResolvedValueOnce({ data: { id: 10 } });
    apiClientMock.patch.mockResolvedValueOnce({ data: { id: 11 } });

    await expect(getProductById(9)).resolves.toEqual({ id: 9 });
    await expect(createProduct({ nombre: 'Nuevo' })).resolves.toEqual({ id: 10 });
    await expect(updateProduct(11, { nombre: 'Editado' })).resolves.toEqual({ id: 11 });

    await deleteProduct(12);

    expect(apiClientMock.get).toHaveBeenCalledWith('/products/9');
    expect(apiClientMock.post).toHaveBeenCalledWith('/products', { nombre: 'Nuevo' });
    expect(apiClientMock.patch).toHaveBeenCalledWith('/products/11', { nombre: 'Editado' });
    expect(apiClientMock.delete).toHaveBeenCalledWith('/products/12');
  });

  it('actualiza estado y sube imagen con multipart', async () => {
    apiClientMock.patch.mockResolvedValueOnce({ data: { ok: true } });
    apiClientMock.post.mockResolvedValueOnce({ data: { url: 'x' } });

    await expect(toggleProductStatus(4, false)).resolves.toEqual({ ok: true });

    const file = new File(['image'], 'photo.png', { type: 'image/png' });
    await expect(uploadProductImage(file)).resolves.toEqual({ url: 'x' });

    expect(apiClientMock.patch).toHaveBeenCalledWith('/products/4/status', null, {
      params: { is_active: false },
    });

    const [, formData, config] = apiClientMock.post.mock.calls[0];
    expect(formData).toBeInstanceOf(FormData);
    expect(config.headers['Content-Type']).toContain('multipart/form-data');
  });
});
