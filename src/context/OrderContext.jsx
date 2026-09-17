import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDeliveryNotes as apiGetDeliveryNotes, createDeliveryNoteFromSalesOrder, submitDeliveryNotePicking } from '../api/deliveryNote';
import { getPendingSalesOrders } from '../api/salesOrder';
import { parseApiError } from '../utils/errorHandler';
import { useAuth } from './AuthContext';

const OrderContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useOrders = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState([]); // Pending SOs
  const [deliveryNotes, setDeliveryNotes] = useState([]); // DNs
  const [activeOrder, setActiveOrder] = useState(null); // Selected DN for picking
  const [loading, setLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [dnError, setDnError] = useState(null);
  const [activeOrderError, setActiveOrderError] = useState(null);
  const [toast, setToast] = useState(null);
  const [lastPickedOrder, setLastPickedOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('lastPickedOrder');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrders = async () => {
    setLoading(true);
    setOrdersError(null);
    try {
      const data = await getPendingSalesOrders();
      if (data) {
        const mappedOrders = data.map(item => ({
          orderNumber: item.name,
          customerInfo: { name: item.customer },
          transactionDate: item.transaction_date,
          totalItems: item.total_items,
          itemsSummary: item.items_summary
        }));
        setOrders(mappedOrders);
      }
    } catch (err) {
      setOrdersError(parseApiError(err, 'Data Sales Order tidak dapat dimuat.'));
      setOrders([]); 
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryNotes = async () => {
    setLoading(true);
    setDnError(null);
    try {
      const data = await apiGetDeliveryNotes('', 1, 20); // List general
      if (data) {
        const mappedDNs = data.map(item => ({
          deliveryNoteNo: item.name,
          salesOrderNo: item.against_sales_order,
          customer: item.customer,
          postingDate: item.posting_date,
          status: item.status,
          poNo: item.po_no,
          customPickupLater: item.custom_pickup_later,
          customPickUpCode: item.custom_pick_up_code,
          items: item.items ? item.items.map(i => ({
            itemCode: i.item_code,
            itemName: i.item_name,
            qty: i.qty,
            warehouse: i.warehouse,
            // Add state tracking for picking
            orderedQty: i.qty,
            pickedQty: 0
          })) : []
        }));
        setDeliveryNotes(mappedDNs);
      }
    } catch (err) {
      setDnError(parseApiError(err, 'Data Delivery Note tidak dapat dimuat.'));
      setDeliveryNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      fetchDeliveryNotes();
    } else {
      setOrders([]);
      setDeliveryNotes([]);
      setOrdersError(null);
      setDnError(null);
    }
  }, [isAuthenticated]);

  const createDN = async (orderNumber) => {
    setLoading(true);
    try {
      const res = await createDeliveryNoteFromSalesOrder(orderNumber);
      if (res && res.status === 'success') {
        showToast(`Berhasil membuat DN: ${res.dn_name}`, 'success');
        // Refresh DN list and SO list
        await fetchDeliveryNotes();
        await fetchOrders();
        return true;
      }
    } catch (err) {
      showToast('Delivery Note belum berhasil dibuat. Silakan coba lagi.', 'error');
    } finally {
      setLoading(false);
    }
    return false;
  };

  const selectDeliveryNote = (dnObject) => {
    setActiveOrder(dnObject);
    setActiveOrderError(null);
  };

  const selectOrder = async (orderNumber) => {
    // Deprecated for directly opening Picking, used only if needed
    setActiveOrderError('Gunakan Create DN terlebih dahulu.');
  };

  const clearActiveOrder = () => {
    setActiveOrder(null);
    setActiveOrderError(null);
  };

  const updateQuantity = (itemCode, delta) => {
    if (!activeOrder) return;
    
    setActiveOrder(prev => {
      const newItems = prev.items.map(item => {
        if (item.itemCode === itemCode) {
          const newQty = item.pickedQty + delta;
          if (newQty < 0) return item;
          if (newQty > item.orderedQty) {
            showToast('Produk melebihi pesanan. Kembalikan ke rak.', 'error');
            return item;
          }
          return { ...item, pickedQty: newQty };
        }
        return item;
      });
      return { ...prev, items: newItems };
    });
  };

  const scanProduct = (barcode) => {
    if (!activeOrder) return;
    
    const orderItemIndex = activeOrder.items.findIndex(i => i.itemCode === barcode);
    if (orderItemIndex === -1) {
      showToast('Produk tidak ada di pesanan.', 'error');
      return;
    }

    updateQuantity(activeOrder.items[orderItemIndex].itemCode, 1);
  };

  const completeOrder = async (pickupLater = false) => {
    if (!activeOrder) return false;
    
    // Validation for logged-in user
    const loggedInUserEmail = user?.username;
    if (!loggedInUserEmail || loggedInUserEmail.toLowerCase() === 'guest') {
      showToast('User login email is required for picking submission', 'error');
      return false;
    }
    
    const isFullyPicked = activeOrder.items.every(i => i.pickedQty === i.orderedQty);
    if (!isFullyPicked) {
      showToast('Masih ada produk yang belum diambil.', 'error');
      return false;
    }

    setLoading(true);
    try {
      // Map back to ERPNext format for submission
      const updatedItems = activeOrder.items.map(item => ({
        item_code: item.itemCode,
        qty: item.pickedQty
      }));
      
      const submitRes = await submitDeliveryNotePicking(activeOrder.deliveryNoteNo, updatedItems, pickupLater, loggedInUserEmail);
      
      const newLastPicked = {
        name: activeOrder.deliveryNoteNo,
        customer: activeOrder.customer,
        customPickupLater: pickupLater ? 1 : 0,
        customPickUpCode: submitRes?.custom_pick_up_code || activeOrder.customPickUpCode || null
      };
      
      setLastPickedOrder(newLastPicked);
      localStorage.setItem('lastPickedOrder', JSON.stringify(newLastPicked));
      
      showToast('Picking selesai.', 'success');
      fetchDeliveryNotes(); // Refresh list
      return newLastPicked;
    } catch {
      showToast('Data picking belum berhasil dikirim ke server. Silakan coba lagi.', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <OrderContext.Provider value={{
      orders,
      deliveryNotes,
      activeOrder,
      loading,
      ordersError,
      dnError,
      activeOrderError,
      selectOrder,
      createDN,
      selectDeliveryNote,
      clearActiveOrder,
      updateQuantity,
      scanProduct,
      completeOrder,
      fetchOrders,
      fetchDeliveryNotes,
      toast,
      lastPickedOrder,
      setLastPickedOrder
    }}>
      {children}
    </OrderContext.Provider>
  );
};
