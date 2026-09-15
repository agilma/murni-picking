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
export const buildDeliveryNoteSubmitPayload = ({ deliveryNoteNo, items, pickupLater }) => {
  const payload = {
    name: deliveryNoteNo,
    items: items,
    custom_pickup_later: pickupLater
  };
  
  return payload;
};

/**
 * Update delivery note items picked quantity (Submit DN)
 * @param {string} name - Delivery Note name/ID
 * @param {Array} items - Array of picked items
 * @param {boolean} pickupLater - Whether to pickup later
 */
export const submitDeliveryNotePicking = async (name, items, pickupLater = false) => {
  const endpoint = import.meta.env.VITE_API_DELIVERY_NOTE_ENDPOINT;
  if (!endpoint) {
    throw new Error('Missing VITE_API_DELIVERY_NOTE_ENDPOINT in environment variables');
  }

  const payload = buildDeliveryNoteSubmitPayload({ deliveryNoteNo: name, items, pickupLater });

  const response = await apiClient.post(endpoint, payload);
  return response.message || null;
};
