import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../axiosClient', () => ({
  default: apiClientMock,
}));

import {
    addToCart,
    getCartItems,
    getCartTaxSettings,
    getCartTotal,
    mergeCart,
    removeFromCart,
    updateCartTaxSettings,
} from './cartService';

describe('cartService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('obtiene items y total', async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: [{ id: 1 }] });
    apiClientMock.get.mockResolvedValueOnce({ data: { total: 121 } });

    await expect(getCartItems()).resolves.toEqual([{ id: 1 }]);
    await expect(getCartTotal()).resolves.toEqual({ total: 121 });

    expect(apiClientMock.get).toHaveBeenNthCalledWith(1, '/cart/items');
    expect(apiClientMock.get).toHaveBeenNthCalledWith(2, '/cart/total');
  });

  it('consulta y actualiza impuesto', async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: { tax_percent: 19 } });
    apiClientMock.put.mockResolvedValueOnce({ data: { tax_percent: 21 } });

    await expect(getCartTaxSettings()).resolves.toEqual({ tax_percent: 19 });
    await expect(updateCartTaxSettings(21)).resolves.toEqual({ tax_percent: 21 });

    expect(apiClientMock.put).toHaveBeenCalledWith('/cart/settings/tax', { tax_percent: 21 });
  });

  it('agrega, elimina y fusiona carrito', async () => {
    apiClientMock.post.mockResolvedValueOnce({ data: { ok: true } });
    apiClientMock.post.mockResolvedValueOnce({ data: { merged: true } });

    await expect(addToCart(10, 2, 'Azul')).resolves.toEqual({ ok: true });
    await removeFromCart(99);
    await expect(mergeCart([{ product_id: 10, quantity: 2 }])).resolves.toEqual({ merged: true });

    expect(apiClientMock.post).toHaveBeenNthCalledWith(1, '/cart/add', {
      product_id: 10,
      quantity: 2,
      color_selected: 'Azul',
    });
    expect(apiClientMock.delete).toHaveBeenCalledWith('/cart/remove/99');
    expect(apiClientMock.post).toHaveBeenNthCalledWith(2, '/cart/merge', {
      items: [{ product_id: 10, quantity: 2 }],
    });
  });
});
