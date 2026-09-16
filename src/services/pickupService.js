import { getSalesInvoicesByPickupCode, updateSalesInvoicePickedUp } from '../api/salesInvoice';
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
  const pickupCode = parsePickupQr(code);
  if (!pickupCode) {
    return { status: 'invalid' };
  }

  try {
    // Look up Sales Order first
    const salesOrder = await getSalesOrderByPickupCode(pickupCode);
    
    if (!salesOrder) {
      return { status: 'invalid' };
    }

    return {
      status: 'success',
      order: {
        orderId: salesOrder.name,
        pickupCode: salesOrder.custom_pick_up_code || pickupCode,
        customerName: salesOrder.customer_name || salesOrder.customer,
        items: (salesOrder.items || []).map(item => ({
          name: item.item_name,
          quantity: item.qty,
          price: item.rate
        })),
        totalQty: salesOrder.total_qty,
        total: salesOrder.grand_total,
        status: 'ready'
      }
    };
  } catch {
    return { status: 'invalid' };
  }
};

export const confirmPickup = async (pickupCode) => {
  if (!pickupCode) {
    return { success: false, error: 'Kode pickup tidak valid.', status: 'api_error' };
  }

  try {
    // Find Sales Invoice using the pickup code
    const invoices = await getSalesInvoicesByPickupCode(pickupCode);

    if (invoices.length === 0) {
      return { success: false, error: 'Invoice pesanan tidak ditemukan. Silakan hubungi petugas.', status: 'invoice_not_found' };
    }

    if (invoices.length > 1) {
      return { success: false, error: 'Kode pickup tidak valid. Silakan hubungi petugas.', status: 'api_error' }; // SALES_INVOICE_NOT_UNIQUE
    }

    const invoice = invoices[0];

    // Check if already picked up
    if (Number(invoice.custom_picked_up) === 1) {
      return { success: false, error: 'Pesanan ini sudah diambil.', status: 'already-picked-up' };
    }

    // Process pickup
    await updateSalesInvoicePickedUp(invoice.name);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || 'Terjadi kesalahan saat memproses pickup', status: 'api_error' };
  }
};

