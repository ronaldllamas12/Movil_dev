import axiosClient from '../axiosClient.js';

export const getAllOrders = async () => {
  const response = await axiosClient.get('/orders/admin/');
  return response.data;
};

export const updateOrderStatus = async (orderId, status, reason = '') => {
  const response = await axiosClient.put(`/orders/admin/${orderId}/status`, {
    status,
    reason: reason || null,
  });
  return response.data;
};

export const downloadOrderInvoice = async (orderId) => {
  const viewer = window.open('', '_blank', 'noopener,noreferrer');
  const response = await axiosClient.get(`/orders/admin/${orderId}/invoice`, {
    responseType: 'blob',
  });
  const blobUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  if (viewer) {
    viewer.location.href = blobUrl;
  } else {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  }
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
};

export const sendOrderInvoice = async (orderId) => {
  const response = await axiosClient.post(`/orders/admin/${orderId}/invoice/send`);
  return response.data;
};

export const refundOrder = async (orderId, payload) => {
  const response = await axiosClient.post(`/orders/admin/${orderId}/refund`, payload);
  return response.data;
};

export const markEpaycoOrderPaid = async (orderId) => {
  const response = await axiosClient.post(`/orders/epayco/mark-paid/${orderId}`);
  return response.data;
};
