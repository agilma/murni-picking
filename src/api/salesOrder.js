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

/**
 * Get a specific sales order by custom_pick_up_code (Real API Call)
 * Uses a two-step approach: fetch list to find name, then fetch doc for full details (items).
 * @param {string} code - Pickup code
 * @returns {Promise<Object|null>} Resolves with the sales order document or null if not found
 */
export const getSalesOrderByPickupCode = async (code) => {
  if (!code) throw new Error('Pickup code is required');
  
  // 1. Find the Sales Order name using the pickup code filter
  const listResponse = await apiClient.get('/api/resource/Sales Order', {
    filters: JSON.stringify([["Sales Order", "custom_pick_up_code", "=", code]]),
    limit_page_length: 1
  });

  const orders = listResponse.data || [];
  if (orders.length === 0) {
    return null;
  }

  // 2. Fetch the full document to get child table (items)
  const orderName = orders[0].name;
  const docResponse = await apiClient.get(`/api/resource/Sales Order/${orderName}`);
  return docResponse.data;
};
