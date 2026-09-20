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
    // 1. Try exact match first
    try {
      const docResponse = await apiClient.get(`/api/resource/Sales Order/${name}`);
      if (docResponse.data) return docResponse.data;
    } catch (e) {
      // Ignore exact match error, proceed to partial match
    }

    // 2. Try partial match using like %name%
    const listResponse = await apiClient.get('/api/resource/Sales Order', {
      filters: JSON.stringify([["Sales Order", "name", "like", `%${name}%`]]),
      limit_page_length: 1,
      order_by: 'creation desc'
    });
    
    const orders = listResponse.data || [];
    if (orders.length > 0) {
      const orderName = orders[0].name;
      const docResponse = await apiClient.get(`/api/resource/Sales Order/${orderName}`);
      return docResponse.data || null;
    }
    
    return null;
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

export const getSalesOrderItems = async (salesOrderName) => {
  const endpoint = `/api/resource/Sales Order/${encodeURIComponent(salesOrderName)}`;
  const response = await apiClient.get(endpoint);
  return response.data || null;
};

/**
 * Fetch History Sales Orders for Pickup History page
 * @param {string} searchQuery - Search by SO name
 * @param {number} page - Pagination page
 * @param {number} limit - Items per page
 * @param {string} roleProfile - User's role profile ('Picking' or 'Pickup')
 * @param {Array<string>} eventBooth - Array of allowed booths for the user
 * @returns {Promise<Array>} Array of Sales Order documents
 */
export const fetchHistorySalesOrders = async (searchQuery = '', page = 1, limit = 20, roleProfile = '', eventBooth = []) => {
  const filters = [
    ["Sales Order", "custom_picked_up", "=", 1]
  ];

  if (searchQuery) {
    filters.push(["Sales Order", "name", "like", `%${searchQuery}%`]);
  }

  if (roleProfile === 'Picking') {
    filters.push(["Sales Order", "custom_event_pickup_option", "like", "Booth%"]);
    
    // Convert string to array if needed
    let booths = Array.isArray(eventBooth) ? eventBooth : (eventBooth ? [eventBooth] : []);
    
    if (booths.length > 0) {
      filters.push(["Sales Order", "custom_event_booth", "in", booths]);
    } else {
      // If no booth permission, technically they shouldn't see anything, 
      // but if the fallback logic is needed we can pass empty array to return none
      // Using a dummy value that will match nothing.
      filters.push(["Sales Order", "custom_event_booth", "=", "NO_BOOTH_PERMISSION"]);
    }
  } else if (roleProfile === 'Pickup') {
    filters.push(["Sales Order", "custom_event_pickup_option", "in", ["Pickup Station", "Station Pickup", "Pickup Store", "Station_Pickup"]]);
  }

  const offset = (page - 1) * limit;

  try {
    const response = await apiClient.get('/api/resource/Sales Order', {
      filters: JSON.stringify(filters),
      limit_start: offset,
      limit_page_length: limit,
      order_by: 'modified desc',
      fields: JSON.stringify([
        'name', 
        'customer', 
        'customer_name', 
        'modified', 
        'custom_event_pickup_option', 
        'custom_event_booth', 
        'grand_total', 
        'status',
        'custom_picked_up'
      ])
    });

    return response.data || [];
  } catch (error) {
    console.error("Failed to fetch history sales orders:", error);
    return [];
  }
};
