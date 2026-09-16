import { getSalesInvoice, updateSalesInvoicePickedUp } from '../api/salesInvoice';

export const parsePickupQr = (rawCode) => {
  if (!rawCode || typeof rawCode !== 'string') return null;
  const parts = rawCode.split(':');
  if (parts.length === 2 && parts[0] === 'MURNI-PICKUP') {
    return parts[1];
  }
  return rawCode;
};

export const validatePickupQr = async (code) => {
  const invoiceName = parsePickupQr(code);
  if (!invoiceName) {
    return { status: 'invalid' };
  }

  try {
    const invoice = await getSalesInvoice(invoiceName);
    
    if (!invoice) {
      return { status: 'invalid' };
    }

    if (invoice.custom_picked_up === 1 || invoice.custom_picked_up === true) {
      return { 
        status: 'already-picked-up',
        order: {
          orderId: invoice.name
        }
      };
    }

    return {
      status: 'success',
      order: {
        orderId: invoice.name,
        customerName: invoice.customer_name || invoice.customer,
        items: (invoice.items || []).map(item => ({
          name: item.item_name,
          quantity: item.qty,
          price: item.rate
        })),
        total: invoice.grand_total,
        status: 'ready'
      }
    };
  } catch {
    return { status: 'invalid' };
  }
};

export const confirmPickup = async (orderId) => {
  if (!orderId) {
    return { success: false, error: 'Sales Invoice name missing' };
  }

  try {
    await updateSalesInvoicePickedUp(orderId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || 'Terjadi kesalahan saat memproses pickup' };
  }
};

