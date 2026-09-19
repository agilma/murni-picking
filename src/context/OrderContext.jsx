import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getPendingSalesOrders } from '../api/salesOrder';
import { 
  fetchDeliveryNotes as apiFetchDeliveryNotes,
  fetchActiveDeliveryNotes as apiFetchActiveDeliveryNotes,
  getDeliveryNoteWithItems,
  claimDeliveryNote, 
  updateDeliveryNoteItemPicked, 
  completeDeliveryNotePicking 
} from '../api/picking';
import { parseApiError } from '../utils/errorHandler';
import { useAuth } from './AuthContext';
import { isFrappeChecked } from '../utils/frappeUtils';

const OrderContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useOrders = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState([]); // Pending SOs
  const [deliveryNotes, setDeliveryNotes] = useState([]); // DNs available
  const [activeDeliveryNotes, setActiveDeliveryNotes] = useState([]); // DNs active
  const [activeOrder, setActiveOrder] = useState(null); // Selected DN for picking
  const [loading, setLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [dnError, setDnError] = useState(null);
  const [activeOrderError, setActiveOrderError] = useState(null);
  const [toast, setToast] = useState(null);
  
  const [activePickingId, setActivePickingId] = useState(() => {
    return localStorage.getItem('murni_active_picking') || null;
  });

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

  const getCurrentUserIdentifier = () => {
    return user?.email || user?.name || user?.username;
  };

  useEffect(() => {
    if (user) {
      console.log('[AUTH] Current user:', user);
      console.log('[AUTH] User identifier:', getCurrentUserIdentifier());
    }
  }, [user]);

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

  const fetchDeliveryNotes = useCallback(async (searchQuery = '', isAutoRefresh = false) => {
    if (!isAutoRefresh) setLoading(true);
    setDnError(null);
    try {
      const [availableData, activeData] = await Promise.all([
        apiFetchDeliveryNotes(searchQuery, 1, 100, user?.eventBooth),
        apiFetchActiveDeliveryNotes(searchQuery, 1, 100, user?.eventBooth, getCurrentUserIdentifier())
      ]);  

      const mapDNs = (data) => data.map(item => ({
        deliveryNoteNo: item.name,
        customer: item.customer,
        postingDate: item.posting_date,
        postingTime: item.posting_time,
        status: item.status,
        docstatus: item.status === 'Draft' ? 0 : 1,
        isPicked: isFrappeChecked(item.custom_event_is_picked),
        pickedBy: item.custom_picked_by,
        pickupCode: item.pickup_code,
        salesOrderNo: item.against_sales_order,
        custom_event_pickup_option: item.custom_event_pickup_option,
        custom_event_booth: item.custom_event_booth,
        items: (item.items || []).map(i => ({
          name: i.name ?? null,
          itemCode: i.item_code ?? '',
          itemName: i.item_name ?? '',
          qty: Number(i.qty ?? 0),
          warehouse: i.warehouse ?? '',
          isPicked: isFrappeChecked(i.is_picked)
        }))
      }));

      if (availableData) {
        setDeliveryNotes(mapDNs(availableData));
      }
      
      if (activeData) {
        setActiveDeliveryNotes(mapDNs(activeData));
      }
    } catch (err) {
      setDnError(parseApiError(err, 'Data Delivery Note tidak dapat dimuat.'));
      setDeliveryNotes([]);
      setActiveDeliveryNotes([]);
    } finally {
      if (!isAutoRefresh) setLoading(false);
    }
  }, [user?.eventBooth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      fetchDeliveryNotes();
    } else {
      setOrders([]);
      setDeliveryNotes([]);
      setActiveDeliveryNotes([]);
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

  // Load details without claiming (when card is clicked)
  const loadDeliveryNoteDetail = async (dnName) => {
    try {
      console.log('[PICKING] Loading Delivery Note detail', dnName);
      const dnDetail = await getDeliveryNoteWithItems(dnName);
      console.log('[PICKING] Delivery Note detail loaded', dnDetail);
      
      return {
        docstatus: dnDetail?.docstatus,
        isPicked: isFrappeChecked(dnDetail?.custom_event_is_picked),
        pickupCode: dnDetail?.pickup_code,
        custom_event_pickup_option: dnDetail?.custom_event_pickup_option,
        items: dnDetail?.items || [],
      };
    } catch (err) {
      console.error('Failed to load DN detail:', err);
      return null;
    }
  };

  const selectDeliveryNote = async (dnObject) => {
    setActiveOrderError(null);
    setLoading(true);
    try {
      const currentUser = getCurrentUserIdentifier();
      if (!currentUser) {
        showToast('Claim gagal: current ERPNext user tidak tersedia.', 'error');
        setActiveOrderError('Claim gagal: user tidak tersedia.');
        setLoading(false);
        return;
      }

      if (dnObject.pickedBy && dnObject.pickedBy !== currentUser) {
        showToast('Claim ditolak: Delivery Note sedang digunakan oleh user lain.', 'error');
        setActiveOrderError('Delivery Note sedang digunakan.');
        setLoading(false);
        return;
      }
      
      // If already claimed by current user, skip the API call
      if (dnObject.pickedBy !== currentUser) {
        const response = await claimDeliveryNote(dnObject.deliveryNoteNo, currentUser);
        console.log('[PICKING] Claim response', response);
      } else {
        console.log('[PICKING] DN already claimed by current user, skipping API call');
      }

      setActiveOrder({
        ...dnObject,
        pickedBy: currentUser,
        items: (dnObject.items || []).map(i => ({
          ...i,
          pickedQty: 0,
          isPicked: false
        }))
      });
      
      localStorage.setItem('murni_active_picking', dnObject.deliveryNoteNo);
      setActivePickingId(dnObject.deliveryNoteNo);

      // We don't refresh all delivery notes immediately to avoid jitter, 
      // but it will be updated next time Home mounts
      return true;
    } catch (err) {
      console.error('[PICKING] Claim failed', err);
      showToast('Gagal memproses Delivery Note atau sudah diambil orang lain.', 'error');
      setActiveOrderError('Gagal claim Delivery Note.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const selectOrder = async (orderNumber) => {
    // Deprecated for directly opening Picking, used only if needed
    setActiveOrderError('Gunakan Create DN terlebih dahulu.');
  };

  const clearActiveOrder = () => {
    setActiveOrder(null);
    setActiveOrderError(null);
    // TODO:
    // Future feature: release/cancel picking claim
    // so another user can claim this Delivery Note.
  };

  const resumePicking = async (dnName) => {
    setLoading(true);
    try {
      const currentUser = getCurrentUserIdentifier();
      if (!currentUser) {
        showToast('Current user tidak tersedia', 'error');
        return false;
      }

      let dnDetail;
      try {
        dnDetail = await getDeliveryNoteWithItems(dnName);
      } catch (fetchError) {
        console.error('[Resume Picking Error]', fetchError);
        showToast('Gagal mengambil data picking. Silakan coba lagi.', 'error');
        return false; // Network or API error, do NOT clear localStorage
      }
      
      console.log('[Resume Picking]', {
        dnName,
        currentUser,
        foundDn: dnDetail?.name,
        pickedBy: dnDetail?.custom_picked_by,
        isPicked: dnDetail?.custom_event_is_picked
      });

      if (!dnDetail) {
        localStorage.removeItem('murni_active_picking');
        setActivePickingId(null);
        showToast('Delivery Note tidak ditemukan', 'error');
        return false;
      }

      if (isFrappeChecked(dnDetail.custom_event_is_picked)) {
        localStorage.removeItem('murni_active_picking');
        setActivePickingId(null);
        showToast('Delivery Note sudah selesai', 'error');
        return false;
      }

      if (dnDetail.custom_picked_by !== currentUser) {
        localStorage.removeItem('murni_active_picking');
        setActivePickingId(null);
        showToast('Picking ini tidak lagi menjadi milik user Anda.', 'error');
        return false;
      }

      setActiveOrder({
        ...dnDetail,
        pickedBy: currentUser, // Set standard property for consistency in UI
        items: dnDetail.items.map(i => ({
          ...i,
          pickedQty: 0,
          isPicked: false
        }))
      });
      return true;
    } catch (err) {
      console.error('[Resume Picking Error]', err);
      showToast('Gagal me-resume picking. Silakan coba lagi.', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const incrementPickedQty = async (barcode) => {
    if (!activeOrder) return;
    
    // Find item matching the barcode
    const itemIndex = activeOrder.items.findIndex(i => 
      (i.barcode && i.barcode === barcode) || 
      i.itemCode === barcode
    );
    
    if (itemIndex === -1) {
      showToast('Barcode tidak ditemukan pada Delivery Note.', 'error');
      return false;
    }

    const itemToPick = activeOrder.items[itemIndex];
    const currentQty = itemToPick.pickedQty || 0;
    const maxQty = itemToPick.qty || 0;

    if (currentQty >= maxQty) {
      showToast('Qty sudah terpenuhi.', 'error');
      return false;
    }

    // Update frontend state only
    setActiveOrder(prev => {
      const newItems = [...prev.items];
      const newQty = Math.min(currentQty + 1, maxQty);
      newItems[itemIndex] = { 
        ...newItems[itemIndex], 
        pickedQty: newQty,
        isPicked: newQty >= maxQty 
      };
      return { ...prev, items: newItems };
    });
    
    return true;
  };

  const decrementPickedQty = async (barcode) => {
    if (!activeOrder) return;
    
    // Find item matching the barcode
    const itemIndex = activeOrder.items.findIndex(i => 
      (i.barcode && i.barcode === barcode) || 
      i.itemCode === barcode
    );
    
    if (itemIndex === -1) {
      showToast('Barcode tidak ditemukan pada Delivery Note.', 'error');
      return false;
    }

    const itemToPick = activeOrder.items[itemIndex];
    const currentQty = itemToPick.pickedQty || 0;

    if (currentQty <= 0) {
      return false;
    }

    // Update frontend state only
    setActiveOrder(prev => {
      const newItems = [...prev.items];
      const newQty = currentQty - 1;
      newItems[itemIndex] = { 
        ...newItems[itemIndex], 
        pickedQty: newQty,
        isPicked: false 
      };
      return { ...prev, items: newItems };
    });
    
    return true;
  };

  const setPickedQty = async (barcode, newQtyValue) => {
    if (!activeOrder) return;
    
    // Find item matching the barcode
    const itemIndex = activeOrder.items.findIndex(i => 
      (i.barcode && i.barcode === barcode) || 
      i.itemCode === barcode
    );
    
    if (itemIndex === -1) {
      showToast('Barcode tidak ditemukan pada Delivery Note.', 'error');
      return false;
    }

    const itemToPick = activeOrder.items[itemIndex];
    const maxQty = itemToPick.qty || 0;
    
    let parsedQty = parseInt(newQtyValue, 10);
    if (isNaN(parsedQty) || parsedQty < 0) {
      parsedQty = 0;
    }
    
    if (parsedQty > maxQty) {
      showToast('Qty melebihi jumlah barang.', 'error');
      parsedQty = maxQty;
    }

    // Update frontend state only
    setActiveOrder(prev => {
      const newItems = [...prev.items];
      newItems[itemIndex] = { 
        ...newItems[itemIndex], 
        pickedQty: parsedQty,
        isPicked: parsedQty >= maxQty 
      };
      return { ...prev, items: newItems };
    });
    
    return true;
  };

  const completeOrder = async () => {
    if (!activeOrder) return false;
    
    const isFullyPicked = activeOrder.items.every(i => i.isPicked);
    if (!isFullyPicked) {
      showToast('Masih ada produk yang belum diambil.', 'error');
      return false;
    }

    setLoading(true);
    try {
      const submitRes = await completeDeliveryNotePicking(activeOrder.deliveryNoteNo);
      
      localStorage.removeItem('murni_active_picking');
      setActivePickingId(null);

      const newLastPicked = {
        name: activeOrder.deliveryNoteNo,
        customer: activeOrder.customer,
        custom_event_pickup_option: activeOrder.custom_event_pickup_option,
        pickupCode: submitRes?.custom_pick_up_code || activeOrder.pickupCode || null
      };
      
      setLastPickedOrder(newLastPicked);
      localStorage.setItem('lastPickedOrder', JSON.stringify(newLastPicked));
      
      showToast('Picking selesai.', 'success');
      fetchDeliveryNotes(); // Refresh list
      return newLastPicked;
    } catch {
      showToast('Data picking belum berhasil diselesaikan di server. Silakan coba lagi.', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <OrderContext.Provider value={{
      orders,
      deliveryNotes,
      activeDeliveryNotes,
      activeOrder,
      loading,
      ordersError,
      dnError,
      activeOrderError,
      selectOrder,
      createDN,
      loadDeliveryNoteDetail,
      selectDeliveryNote,
      clearActiveOrder,
      resumePicking,
      incrementPickedQty,
      decrementPickedQty,
      setPickedQty,
      completeOrder,
      fetchOrders,
      fetchDeliveryNotes,
      toast,
      showToast,
      lastPickedOrder,
      activePickingId,
      setLastPickedOrder
    }}>
      {children}
    </OrderContext.Provider>
  );
};
