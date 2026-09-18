
import { apiClient } from './client';

/**
 * Get a specific sales invoice by name (Real API Call)
 * @param {string} name - Sales Invoice name/ID
 * @returns {Promise} Resolves with the sales invoice document
 */
export const getSalesInvoice = async (name) => {
  if (!name) throw new Error('Sales Invoice name is required');
  const response = await apiClient.get(`/api/resource/Sales Invoice/${name}`);
  return response.data;
};

/**
 * Mark sales invoice as picked up (Real API Call)
 * @param {string} name - Sales Invoice name/ID
 * @returns {Promise} Resolves with the updated document
 */
export const updateSalesInvoicePickedUp = async (name) => {
  if (!name) throw new Error('Sales Invoice name is required');
  const response = await apiClient.put(`/api/resource/Sales Invoice/${name}`, {
    custom_picked_up: 1
  });
  return response.data;
};

/**
 * Get sales invoices by custom_pick_up_code
 * @param {string} code - Pickup code
 * @returns {Promise<Array>} Resolves with array of matching sales invoices
 */
export const getSalesInvoicesByPickupCode = async (code) => {
  if (!code) throw new Error('Pickup code is required');
  const response = await apiClient.get('/api/resource/Sales Invoice', {
    filters: JSON.stringify([["Sales Invoice", "custom_pick_up_code", "=", code]]),
    fields: JSON.stringify(["name", "custom_picked_up"]),
    limit_page_length: 10 // Get up to 10 to check for duplicates
  });
  return response.data || [];
};


