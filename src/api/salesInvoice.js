import { mockPickupService } from '../services/mockService';

/**
 * Get a specific sales invoice by name (Mocked)
 * @param {string} name - Sales Invoice name/ID
 * @returns {Promise} Resolves with the sales invoice document
 */
export const getSalesInvoice = async (name) => {
  const response = await mockPickupService.getSalesInvoice(name);
  return response.data;
};

/**
 * Mark sales invoice as picked up (Mocked)
 * @param {string} name - Sales Invoice name/ID
 * @returns {Promise} Resolves with the updated document
 */
export const markSalesInvoicePickedUp = async (name) => {
  const response = await mockPickupService.markSalesInvoicePickedUp(name);
  return response.data;
};
