import { apiClient } from './client';

/**
 * Fetch delivery notes list from Thunder Picking API
 * @param {string} salesOrder - Optional sales order filter
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 */
export const getDeliveryNotes = async (salesOrder = '', page = 1, limit = 20, boothName = '') => {
  const endpoint = import.meta.env.VITE_API_DELIVERY_NOTES_CL_ENDPOINT || '/api/method/thunder_erp.api.dn_picker.get_delivery_note_cl';

  const params = {
    custom_event_is_picked: 0,
    page,
    length: limit
  };

  if (boothName) {
    params.custom_event_booth = boothName;
  }

  if (salesOrder) {
    params.sales_order = salesOrder;
  }

  const response = await apiClient.get(endpoint, params);
  
  return response.message || [];
};

/**
 * Create a new Delivery Note from a Pending Sales Order
 * @param {string} salesOrder - The sales order number
 */
export const createDeliveryNoteFromSalesOrder = async (salesOrder) => {
  const endpoint = import.meta.env.VITE_API_CREATE_DELIVERY_NOTE_FROM_SO_ENDPOINT;
  if (!endpoint) {
    throw new Error('Missing VITE_API_CREATE_DELIVERY_NOTE_FROM_SO_ENDPOINT in environment variables');
  }

  const response = await apiClient.post(endpoint, {
    sales_order: salesOrder
  });
  
  return response.message || null;
};

/**
 * Submit picked items for a delivery note
 * Payload adapter preps for pickup_later if backend eventually supports it.
 */
export const buildDeliveryNoteSubmitPayload = ({ deliveryNoteNo, items, pickedBy }) => {
  const payload = {
    name: deliveryNoteNo,
    items: items
  };
  
  if (pickedBy) {
    payload.custom_picked_by = pickedBy;
  }
  

  
  return payload;
};

/**
 * Update delivery note items picked quantity (Submit DN)
 * @param {string} name - Delivery Note name/ID
 * @param {Array} items - Array of picked items
 * @param {boolean} pickupLater - Whether to pickup later
 * @param {string} pickedBy - Email or username of the person picking
 */
export const submitDeliveryNotePicking = async (name, items, pickedBy = null) => {
  const endpoint = import.meta.env.VITE_API_DELIVERY_NOTE_ENDPOINT;
  if (!endpoint) {
    throw new Error('Missing VITE_API_DELIVERY_NOTE_ENDPOINT in environment variables');
  }

  const payload = buildDeliveryNoteSubmitPayload({ deliveryNoteNo: name, items, pickedBy });

  const response = await apiClient.post(endpoint, payload);
  return response.message || null;
};

/**
 * Fetch history of submitted delivery notes for a specific user
 * @param {string} userEmail - The email of the logged in user
 * @param {number} limit - Items per page
 * @param {number} offset - Offset for pagination
 * @param {string} searchQuery - Optional search string
 * @param {string} boothName - Optional booth name
 */
export const getDeliveryNoteHistory = async (userEmail, limit = 20, offset = 0, searchQuery = '', boothName = '') => {
  if (!userEmail) return [];
  
  const endpoint = '/api/resource/Delivery Note';
  
  const filters = [
    ["docstatus", "=", 1],
    ["custom_picked_by", "=", userEmail]
  ];
  
  if (boothName) {
    filters.push(["custom_event_booth", "in", [boothName]]);
  }
  
  if (searchQuery) {
    filters.push(["name", "like", `%${searchQuery}%`]);
  }
  
  const fields = [
    "name", 
    "customer", 
    "posting_date", 
    "posting_time",
    "custom_event_booth",
    "custom_event_pickup_option",
    "custom_picked_by",
    "modified"
  ];
  
  try {
    const response = await apiClient.get(endpoint, {
      fields: JSON.stringify(fields),
      filters: JSON.stringify(filters),
      limit_page_length: limit,
      limit_start: offset,
      order_by: 'modified desc' // using modified as proxy for submitted_at
    });
    
    let dns = response?.data || [];
    
    if (dns.length > 0) {
      // Fetch child items for these DNs to get against_sales_order and qty
      const dnNames = dns.map(dn => dn.name);
      const itemsEndpoint = '/api/resource/Delivery Note Item';
      const itemsResponse = await apiClient.get(itemsEndpoint, {
        filters: JSON.stringify([['parent', 'in', dnNames]]),
        fields: JSON.stringify(['parent', 'against_sales_order', 'qty']),
        limit_page_length: limit * 5
      });
      
      const items = itemsResponse?.data || [];
      
      // Group items by parent
      const itemsByParent = items.reduce((acc, item) => {
        if (!acc[item.parent]) {
          acc[item.parent] = [];
        }
        acc[item.parent].push(item);
        return acc;
      }, {});
      
      // Merge items into DNs
      dns = dns.map(dn => {
        const dnItems = itemsByParent[dn.name] || [];
        const soNo = dnItems.length > 0 ? dnItems[0].against_sales_order : null;
        return {
          ...dn,
          items: dnItems,
          against_sales_order: soNo,
          salesOrderNo: soNo // Map to same format as Home
        };
      });
    }
    
    return dns;
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
};

/**
 * Fetch a single Delivery Note detail
 * @param {string} deliveryNoteName - The name of the Delivery Note
 */
export const getDeliveryNoteDetail = async (deliveryNoteName) => {
  if (!deliveryNoteName) return null;
  
  const endpoint = `/api/resource/Delivery Note/${encodeURIComponent(deliveryNoteName)}`;
  
  const response = await apiClient.get(endpoint);
  
  return response?.data || null;
};

export const submitDeliveryNote = async (deliveryNoteName) => {
  const endpoint = import.meta.env.VITE_API_DELIVERY_NOTE_ENDPOINT;
  if (!endpoint) {
    throw new Error('Missing VITE_API_DELIVERY_NOTE_ENDPOINT in environment variables');
  }
  
  const response = await apiClient.post(endpoint, {
    name: deliveryNoteName
  });
  
  return response;
};

/**
 * Standard Frappe submit mechanism for Delivery Note (used for batch)
 * @param {object} dn - The delivery note object
 */
export const submitFrappeDeliveryNote = async (dn) => {
  const endpoint = '/api/method/frappe.client.submit';
  
  const response = await apiClient.post(endpoint, {
    doc: dn
  });
  
  return response.message || response.data || response;
};

export const submitDeliveryNotesBatch = async (deliveryNoteNames) => {
  // Try to use endpoint from env, or default to the provided endpoint
  const endpoint = import.meta.env.VITE_API_DELIVERY_NOTES_BATCH_ENDPOINT || '/api/method/thunder_erp.api.dn_picker.delivery_note_submit_batch';
  
  const response = await apiClient.post(endpoint, {
    names: deliveryNoteNames
  });
  
  return response;
};

/**
 * Find Delivery Notes by Sales Order
 * @param {string} salesOrderName 
 */
export const findDeliveryNotesBySalesOrder = async (salesOrderName) => {
  if (!salesOrderName) return [];
  
  const endpoint = '/api/method/thunder_erp.api.dn_picker.get_delivery_note';
  
  const response = await apiClient.get(endpoint, {
    sales_order: salesOrderName,
    include_items: 1
  });
  
  const list = response?.message || [];
  return Array.isArray(list) ? list : [];
};

/**
 * Find Submitted Delivery Notes by Sales Order using Frappe Standard API
 * @param {string} salesOrderName 
 */
export const findSubmittedDeliveryNotesBySalesOrder = async (salesOrderName) => {
  if (!salesOrderName) return [];
  
  try {
    // 1. Cari Delivery Note Item yang memiliki against_sales_order = salesOrderName
    const dnItemsEndpoint = '/api/resource/Delivery Note Item';
    const dnItemsResponse = await apiClient.get(dnItemsEndpoint, {
      filters: JSON.stringify([['against_sales_order', '=', salesOrderName]]),
      fields: JSON.stringify(['parent']),
      limit_page_length: 100
    });
    
    const items = dnItemsResponse?.data || [];
    if (items.length === 0) return [];
    
    // Extrak nama Delivery Note (parent) yang unik
    const dnNames = [...new Set(items.map(item => item.parent))];
    
    // 2. Fetch parent Delivery Note untuk mengecek docstatus dan custom_event_is_picked
    const dnEndpoint = '/api/resource/Delivery Note';
    const dnResponse = await apiClient.get(dnEndpoint, {
      filters: JSON.stringify([
        ['name', 'in', dnNames]
      ]),
      fields: JSON.stringify(['name', 'docstatus', 'custom_event_is_picked', 'custom_pick_up_code', 'customer', 'customer_name', 'total_qty', 'grand_total', 'custom_event_pickup_option', 'custom_picked_by']),
      limit_page_length: 100
    });
    
    return dnResponse?.data || [];
  } catch (error) {
    console.error("Error finding submitted delivery notes:", error);
    return [];
  }
};
