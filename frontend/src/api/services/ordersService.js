import axiosClient from '../axiosClient.js';

export const getAllOrders = async () => {
  const response = await axiosClient.get('/orders/admin/');
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await axiosClient.put(`/orders/admin/${orderId}/status`, { status });
  return response.data;
};

export const getOrderItems = async (orderId) => {
  const response = await axiosClient.get(`/orders/admin/${orderId}/items`);
  return response.data;
};