import { apiClient } from '../api/client';
import { getSalesInvoicesByPickupCode, updateSalesInvoicePickedUp } from '../api/salesInvoice';
import { isFrappeChecked } from '../utils/frappeUtils';

export const parsePickupQr = (rawCode) => {
  if (!rawCode || typeof rawCode !== 'string') return null;
  const trimmed = rawCode.trim();
  
  // Try to parse as URL
  try {
    const url = new URL(trimmed);
    const code = url.searchParams.get('code');
    if (code) {
      return code;
    }
  } catch (e) {
    // Not a valid URL, fallback to parsing it as the raw code
  }
  
  // If it's the old format for backward compatibility or testing, extract it
  const parts = trimmed.split(':');
  if (parts.length === 2 && parts[0] === 'MURNI-PICKUP') {
    return parts[1];
  }
  
  return trimmed;
};

export const validatePickupQr = async (code) => {
  const pickupCode = parsePickupQr(code);
  if (!pickupCode) {
    return { status: 'invalid' };
  }

  try {
    // Look up Delivery Note by pickup code
    const endpoint = '/api/resource/Delivery Note';
    const filters = [
      ["custom_pick_up_code", "=", pickupCode]
    ];
    const fields = ["name", "customer", "customer_name", "total_qty", "grand_total", "docstatus", "custom_event_is_picked", "custom_pick_up_code", "custom_event_pickup_option"];
    
    const response = await apiClient.get(endpoint, {
      filters: JSON.stringify(filters),
      fields: JSON.stringify(fields)
    });
    
    if (!response?.data || response.data.length === 0) {
      return { status: 'invalid' };
    }
    
    const dn = response.data[0];
    
    // We need to resolve the flow
    const flow = dn.custom_event_pickup_option || 'BOOTH';
    
    // Ensure Picking is complete
    if (!isFrappeChecked(dn.custom_event_is_picked)) {
      return { status: 'invalid' };
    }
    
    // Both BOOTH and STATION_PICKUP require docstatus === 1 for Customer Pickup
    if (dn.docstatus !== 1) {
      // Return invalid because it hasn't been submitted by Receive Picking yet
      return { status: 'invalid' };
    }
    
    // Fetch items for display
    const detailResponse = await apiClient.get(`/api/resource/Delivery Note/${encodeURIComponent(dn.name)}`);
    const dnDetail = detailResponse?.data;
    
    // Let's check Sales Invoice to see if already picked up
    try {
      const invoices = await getSalesInvoicesByPickupCode(pickupCode);
      if (invoices.length > 0 && isFrappeChecked(invoices[0].custom_picked_up)) {
         return { 
           status: 'already-picked-up',
           order: { orderId: dn.name }
         };
      }
    } catch (e) {
      // Ignore
    }
    
    return {
      status: 'success',
      order: {
        orderId: dn.name, // The Delivery Note ID
        pickupCode: dn.custom_pick_up_code || pickupCode,
        customerName: dn.customer_name || dn.customer,
        custom_event_pickup_option: dn.custom_event_pickup_option,
        items: (dnDetail?.items || []).map(item => ({
          name: item.item_name,
          quantity: item.qty,
          price: item.rate
        })),
        totalQty: dn.total_qty,
        total: dn.grand_total,
        status: 'ready'
      }
    };
  } catch (err) {
    console.error("Pickup validation error:", err);
    return { status: 'invalid' };
  }
};

export const confirmPickup = async (pickupCode) => {
  if (!pickupCode) {
    return { success: false, error: 'Kode pickup tidak valid.', status: 'api_error' };
  }

  try {
    // Look up the Delivery Note
    const endpoint = '/api/resource/Delivery Note';
    const filters = [
      ["custom_pick_up_code", "=", pickupCode]
    ];
    const response = await apiClient.get(endpoint, {
      filters: JSON.stringify(filters),
      fields: JSON.stringify(["name", "docstatus", "custom_event_is_picked", "custom_event_pickup_option"])
    });
    
    if (!response?.data || response.data.length === 0) {
      return { success: false, error: 'Delivery Note tidak ditemukan.', status: 'dn_not_found' };
    }
    
    const { resolvePickupFlow } = await import('../utils/pickupFlow');
    
    // Check if already picked up by checking Sales Invoice
    try {
      const invoices = await getSalesInvoicesByPickupCode(pickupCode);
      if (invoices.length > 0 && isFrappeChecked(invoices[0].custom_picked_up)) {
        return { success: false, error: 'Pesanan ini sudah diambil oleh customer.', status: 'already-picked-up' };
      }
    } catch (e) {
      console.warn('Failed to check sales invoice status', e);
    }
    
    // Note: We DO NOT submit Delivery Note here. Receive Picking handles Submit DN.
    // If we reached here, dn.docstatus must be 1. We just update Sales Invoice.
    
    try {
      const invoices = await getSalesInvoicesByPickupCode(pickupCode);
      if (invoices.length > 0) {
        await updateSalesInvoicePickedUp(invoices[0].name);
      }
    } catch (legacyErr) {
      console.warn("Failed to update legacy Sales Invoice custom_picked_up flag", legacyErr);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Pickup confirmation error:", error);
    return { success: false, error: error.message || 'Terjadi kesalahan saat memproses pickup', status: 'api_error' };
  }
};
