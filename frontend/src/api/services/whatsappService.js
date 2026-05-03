import apiClient from '../axiosClient';

export const getWhatsAppStatus = () =>
  apiClient.get('/admin/whatsapp/status').then((r) => r.data);

export const getWhatsAppQR = () =>
  apiClient.get('/admin/whatsapp/qr').then((r) => r.data);

export const connectWhatsApp = () =>
  apiClient.post('/admin/whatsapp/connect').then((r) => r.data);

export const disconnectWhatsApp = () =>
  apiClient.post('/admin/whatsapp/disconnect').then((r) => r.data);
