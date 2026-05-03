import axiosClient from '../axiosClient.js';

export const getAllOrders = async () => {
  const response = await axiosClient.get('/orders/admin/');
  return response.data;
};

export const updateOrderStatus = async (
  orderId,
  status,
  reason = '',
  shippingCompany = null,
  trackingNumber = null,
) => {
  const response = await axiosClient.put(`/orders/admin/${orderId}/status`, {
    status,
    reason: reason || null,
    shipping_company: shippingCompany || null,
    tracking_number: trackingNumber || null,
  });
  return response.data;
};

export const downloadOrderInvoice = async (orderId) => {
  const response = await axiosClient.get(`/orders/admin/${orderId}/invoice`, {
    responseType: 'blob',
  });
  const blobUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
