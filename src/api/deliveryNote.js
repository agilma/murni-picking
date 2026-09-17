import { apiClient } from './client';

/**
 * Fetch delivery notes list from Thunder Picking API
 * @param {string} salesOrder - Optional sales order filter
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 */
export const getDeliveryNotes = async (salesOrder = '', page = 1, limit = 20) => {
  const endpoint = import.meta.env.VITE_API_SALES_ORDER_ENDPOINT;
  if (!endpoint) {
    throw new Error('Missing VITE_API_SALES_ORDER_ENDPOINT in environment variables');
  }

  const response = await apiClient.get(endpoint, {
    sales_order: salesOrder,
    page,
    limit
  });
  
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
export const buildDeliveryNoteSubmitPayload = ({ deliveryNoteNo, items, pickupLater, pickedBy }) => {
  const payload = {
    name: deliveryNoteNo,
    items: items,
    custom_pickup_later: pickupLater ? 1 : 0
  };
  
  if (pickedBy) {
    payload.custom_picked_by = pickedBy;
    payload.picked_by = pickedBy;
  }
  
  console.log('Submit Picking payload:', payload);
  
  return payload;
};

/**
 * Update delivery note items picked quantity (Submit DN)
 * @param {string} name - Delivery Note name/ID
 * @param {Array} items - Array of picked items
 * @param {boolean} pickupLater - Whether to pickup later
 * @param {string} pickedBy - Email or username of the person picking
 */
export const submitDeliveryNotePicking = async (name, items, pickupLater = false, pickedBy = null) => {
  const endpoint = import.meta.env.VITE_API_DELIVERY_NOTE_ENDPOINT;
  if (!endpoint) {
    throw new Error('Missing VITE_API_DELIVERY_NOTE_ENDPOINT in environment variables');
  }

  const payload = buildDeliveryNoteSubmitPayload({ deliveryNoteNo: name, items, pickupLater, pickedBy });

  const response = await apiClient.post(endpoint, payload);
  return response.message || null;
};

/**
 * Fetch history of submitted delivery notes for a specific user
 * @param {string} userEmail - The email of the logged in user
 * @param {number} limit - Items per page
 * @param {number} offset - Offset for pagination
 */
export const getDeliveryNoteHistory = async (userEmail, limit = 20, offset = 0) => {
  if (!userEmail) return [];
  
  const endpoint = '/api/resource/Delivery Note';
  
  const filters = [
    ["docstatus", "=", 1],
    ["custom_picked_by", "=", userEmail]
  ];
  
  const fields = [
    "name", 
    "customer", 
    "posting_date", 
    "posting_time", 
    "custom_pick_up_code"
  ];
  
  const response = await apiClient.get(endpoint, {
    fields: JSON.stringify(fields),
    filters: JSON.stringify(filters),
    limit_page_length: limit,
    limit_start: offset,
    order_by: 'modified desc'
  });
  
  return response?.data || [];
};
