/**
 * Contrato del carrito contra el cliente HTTP: métodos, URLs y payloads.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../axiosClient.js', () => ({
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
} from './cartService.js';

describe('cartService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getCartItems y getCartTotal usan GET en rutas /cart/...', async () => {
    apiClientMock.get.mockResolvedValue({ data: {} });

    await getCartItems();
    expect(apiClientMock.get).toHaveBeenCalledWith('/cart/items');

    await getCartTotal();
    expect(apiClientMock.get).toHaveBeenCalledWith('/cart/total');
  });

  it('getCartTaxSettings y updateCartTaxSettings', async () => {
    apiClientMock.get.mockResolvedValue({ data: { tax_percent: 19 } });
    apiClientMock.put.mockResolvedValue({ data: { ok: true } });

    await getCartTaxSettings();
    expect(apiClientMock.get).toHaveBeenCalledWith('/cart/settings/tax');

    await updateCartTaxSettings(19);
    expect(apiClientMock.put).toHaveBeenCalledWith('/cart/settings/tax', {
      tax_percent: 19,
    });
  });

  it('addToCart envía product_id, quantity y color_selected', async () => {
    apiClientMock.post.mockResolvedValue({ data: { id: 1 } });

    await addToCart(5, 2, 'Negro');

    expect(apiClientMock.post).toHaveBeenCalledWith('/cart/add', {
      product_id: 5,
      quantity: 2,
      color_selected: 'Negro',
    });
  });

  it('removeFromCart DELETE con id en la URL', async () => {
    apiClientMock.delete.mockResolvedValue({ data: {} });

    await removeFromCart(42);

    expect(apiClientMock.delete).toHaveBeenCalledWith('/cart/remove/42');
  });

  it('mergeCart POST con lista items', async () => {
    apiClientMock.post.mockResolvedValue({ data: { merged: true } });
    const items = [{ product_id: 1, quantity: 1 }];

    const res = await mergeCart(items);

    expect(apiClientMock.post).toHaveBeenCalledWith('/cart/merge', { items });
    expect(res.merged).toBe(true);
  });
});
