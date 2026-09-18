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
  
  let orders = [];
  
  try {
    // 1. Try by pickup code first
    const listResponse = await apiClient.get('/api/resource/Sales Order', {
      filters: JSON.stringify([["Sales Order", "custom_pick_up_code", "=", code]]),
      limit_page_length: 1
    });
    orders = listResponse.data || [];
  } catch (e) {
    console.warn("Failed to fetch by pickup code", e);
  }
  
  // 2. If not found, try by name (Sales Order ID)
  if (orders.length === 0) {
    try {
      const listResponse = await apiClient.get('/api/resource/Sales Order', {
        filters: JSON.stringify([["Sales Order", "name", "=", code]]),
        limit_page_length: 1
      });
      orders = listResponse.data || [];
    } catch (e) {
      console.warn("Failed to fetch by name", e);
    }
  }

  if (orders.length === 0) {
    return null;
  }

  // 3. Fetch the full document to get child table (items)
  const orderName = orders[0].name;
  const docResponse = await apiClient.get(`/api/resource/Sales Order/${orderName}`);
  return docResponse.data;
};

/**
 * Get a specific sales order by name
 * @param {string} name - Sales Order Name
 * @returns {Promise<Object|null>} Resolves with the sales order document or null if not found
 */
export const getSalesOrderByName = async (name) => {
  if (!name) throw new Error('Sales Order name is required');
  
  try {
    const docResponse = await apiClient.get(`/api/resource/Sales Order/${name}`);
    return docResponse.data || null;
  } catch (e) {
    console.warn(`Failed to fetch Sales Order by name: ${name}`, e);
    return null;
  }
};

/**
 * Update Sales Order
 * @param {string} salesOrderName 
 * @param {Object} payload 
 */
export const updateSalesOrder = async (salesOrderName, payload) => {
  if (!salesOrderName) throw new Error('Sales Order name is required');
  
  const endpoint = `/api/resource/Sales Order/${salesOrderName}`;
  const response = await apiClient.put(endpoint, payload);
  return response.data;
};
