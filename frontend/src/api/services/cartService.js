import apiClient from '../axiosClient';

export async function getCartItems() {
  const response = await apiClient.get('/cart/items');
  return response.data;
}

export async function getCartTotal() {
  const response = await apiClient.get('/cart/total');
  return response.data;
}

export async function getCartTaxSettings() {
  const response = await apiClient.get('/cart/settings/tax');
  return response.data;
}

export async function updateCartTaxSettings(taxPercent) {
  const response = await apiClient.put('/cart/settings/tax', {
    tax_percent: taxPercent,
  });
  return response.data;
}

export async function addToCart(productId, quantity = 1) {
  const response = await apiClient.post('/cart/add', {
    product_id: productId,
    quantity,
  });
  return response.data;
}

export async function removeFromCart(itemId) {
  await apiClient.delete(`/cart/remove/${itemId}`);
}
