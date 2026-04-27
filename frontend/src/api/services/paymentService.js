import apiClient from '../axiosClient';

export const createPayPalOrder = async (payload) => {
  const response = await apiClient.post('/payments/paypal/create-order', payload);
  return response.data;
};

export const capturePayPalOrder = async (token) => {
  const response = await apiClient.post('/payments/paypal/capture-order', null, {
    params: { token },
  });
  return response.data;
};

export const createEpaycoSession = async (payload) => {
  const response = await apiClient.post('/payments/epayco/create-session', payload);
  return response.data;
};
