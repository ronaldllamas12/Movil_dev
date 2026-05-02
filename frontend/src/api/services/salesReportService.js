import axiosClient from '../axiosClient.js';

export const getSalesReport = async () => {
  const response = await axiosClient.get('/orders/admin/reports/sales');
  return response.data;
};
