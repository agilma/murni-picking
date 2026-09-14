import { apiClient } from './client';

/**
 * Fetch pending sales orders from Thunder Picking API
 * @returns {Promise<any>} Raw API response containing pending sales orders
 */
export const getPendingSalesOrders = async () => {
  const endpoint = import.meta.env.VITE_API_PENDING_SALES_ORDERS_ENDPOINT;
  if (!endpoint) {
    throw new Error('Missing VITE_API_PENDING_SALES_ORDERS_ENDPOINT in environment variables');
  }

  const response = await apiClient.get(endpoint);
  return response.message || [];
};
