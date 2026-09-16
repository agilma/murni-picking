
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
