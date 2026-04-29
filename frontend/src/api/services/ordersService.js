import axiosClient from '../axiosClient.js';

export const getAllOrders = async () => {
  const response = await axiosClient.get('/orders/admin/');
  return response.data;
};

export const updateOrderStatus = async (orderId, status, reason) => {
  const response = await axiosClient.put(`/orders/admin/${orderId}/status`, {
    status,
    reason: reason || undefined,
  });
  return response.data;
};

export const getSalesReport = async ({ startDate, endDate } = {}) => {
  const response = await axiosClient.get('/orders/admin/sales-report', {
    params: {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
  });
  return response.data;
};