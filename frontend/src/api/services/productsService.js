import apiClient from '../axiosClient';

export async function getProducts(params = {}) {
  const response = await apiClient.get('/products', { params });
  const payload = response.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.products)) return payload.products;

  return [];
}

export async function getProductById(productId) {
  const response = await apiClient.get(`/products/${productId}`);
  return response.data;
}

export async function createProduct(payload) {
  const response = await apiClient.post('/products', payload);
  return response.data;
}

export async function updateProduct(productId, payload) {
  const response = await apiClient.patch(`/products/${productId}`, payload);
  return response.data;
}

export async function deleteProduct(productId) {
  await apiClient.delete(`/products/${productId}`);
}

export async function toggleProductStatus(productId, isActive) {
  const response = await apiClient.patch(`/products/${productId}/status`, null, {
    params: { is_active: isActive },
  });
  return response.data;
}

export async function uploadProductImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/products/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}
