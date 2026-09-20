import { apiClient } from '../api/client';
import { isFrappeChecked } from '../utils/frappeUtils';
import { getSalesOrderByPickupCode } from '../api/salesOrder';

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
  const searchVal = parsePickupQr(code);
  if (!searchVal) {
    return { status: 'invalid' };
  }

  try {
    let pickupCodeToSearch = searchVal;
    
    // 1. Dapatkan Sales Order dari Pickup Code
    const so = await getSalesOrderByPickupCode(searchVal);
    
    if (!so) {
      return { status: 'invalid' };
    }
    
    if (so.custom_pick_up_code) {
      pickupCodeToSearch = so.custom_pick_up_code;
    }
    
    // 3. Cek custom_picked_up dari Sales Order
    if (isFrappeChecked(so.custom_picked_up)) {
       return { 
         status: 'already-picked-up',
         order: { orderId: so.name }
       };
    }
    
    // 4. Map items DARI SALES ORDER (karena diminta menampilkan data sales order-nya)
    let aggregatedItems = [];
    let totalQty = 0;
    
    const items = so.items || [];
    items.forEach(item => {
      aggregatedItems.push({
        name: item.item_name,
        quantity: item.qty,
        price: item.rate
      });
      totalQty += (item.qty || 0);
    });
    
    return {
      status: 'success',
      order: {
        orderId: so.name, // Use SO name as orderId for UI consistency if preferred
        pickupCode: pickupCodeToSearch,
        salesOrderName: so.name,
        salesInvoiceName: so.name,
        customerName: so.customer_name || so.customer,
        custom_event_pickup_option: so.custom_event_pickup_option,
        custom_event_booth: so.custom_event_booth,
        items: aggregatedItems,
        totalQty: totalQty,
        total: so.grand_total,
        status: 'ready'
      }
    };
  } catch (err) {
    console.error("Pickup validation error:", err);
    return { status: 'invalid' };
  }
};

export const confirmPickup = async (salesOrderName) => {
  if (!salesOrderName) {
    return { success: false, error: 'Sales Order tidak valid.', status: 'api_error' };
  }

  try {
    const { updateSalesOrder } = await import('../api/salesOrder');
    
    // Update Sales Order
    try {
      await updateSalesOrder(salesOrderName, { custom_picked_up: 1 });
    } catch (legacyErr) {
      console.warn("Failed to update Sales Order custom_picked_up flag", legacyErr);
      throw new Error("Gagal melakukan update pada Sales Order. " + legacyErr.message);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Pickup confirmation error:", error);
    return { success: false, error: error.message || 'Terjadi kesalahan saat memproses pickup', status: 'api_error' };
  }
};
