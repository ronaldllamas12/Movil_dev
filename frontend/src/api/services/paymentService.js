import apiClient from '../axiosClient';

export const createPayPalOrder = async (payload) => {
  const response = await apiClient.post('/payments/paypal/create-order', payload, {
    timeout: 30000,
  });
  return response.data;
};

export const capturePayPalOrder = async (token, dbOrderId) => {
  const response = await apiClient.post('/payments/paypal/capture-order', null, {
    timeout: 30000,
    params: { token, db_order_id: dbOrderId || undefined },
  });
  return response.data;
};

export const createEpaycoSession = async (payload) => {
  const response = await apiClient.post('/payments/epayco/create-session', payload, {
    timeout: 30000,
  });
  return response.data;
};
