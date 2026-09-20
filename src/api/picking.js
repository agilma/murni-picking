import { apiClient } from './client';
import { isFrappeChecked } from '../utils/frappeUtils';

/**
 * Fetch active/available Delivery Notes for picking.
 */
export const fetchDeliveryNotes = async (searchQuery = '', page = 1, limit = 20, eventBooth = null) => {
  const endpoint = '/api/method/thunder_erp.api.dn_picker.get_delivery_note_cl';
  
  const params = {
    custom_event_is_picked: 0,
    page: page,
    limit: limit
  };
  
  if (eventBooth && eventBooth.length > 0) {
    const boothStr = Array.isArray(eventBooth) ? eventBooth[0] : eventBooth;
    params.custom_event_booth = boothStr;
  }
  if (searchQuery) {
    params.po_no = searchQuery;
  }
  
  const response = await apiClient.get(endpoint, params);
  

  
  const list = response?.message;
  
  if (!list) {
    return [];
  }
  
  if (!Array.isArray(list)) {
    console.error('[HOME] Invalid delivery note response format', list);
    return [];
  }
  
  return list;
};

export const fetchActiveDeliveryNotes = async (searchQuery = '', page = 1, limit = 20, eventBooth = null, currentUser = null) => {
  const endpoint = '/api/method/thunder_erp.api.dn_picker.get_delivery_note_cl';
  
  const params = {
    custom_event_is_picked: 0,
    custom_picked_by: currentUser || '["is","set"]',
    page: page,
    limit: limit
  };
  
  if (eventBooth && eventBooth.length > 0) {
    const boothStr = Array.isArray(eventBooth) ? eventBooth[0] : eventBooth;
    params.custom_event_booth = boothStr;
  }
  if (searchQuery) {
    params.po_no = searchQuery;
  }
  
  const response = await apiClient.get(endpoint, params);
  

  
  const list = response?.message;
  
  if (!list) {
    return [];
  }
  
  if (!Array.isArray(list)) {
    console.error('[HOME] Invalid active delivery note response format', list);
    return [];
  }
  
  return list;
};

export const fetchHistoryDeliveryNotes = async (searchQuery = '', page = 1, limit = 30, eventBooth = null, currentUser = null) => {
  const endpoint = '/api/method/thunder_erp.api.dn_picker.get_delivery_note_cl';
  
  const params = {
    custom_event_is_picked: 1,
    docstatus: 1,
    custom_picked_by: currentUser,
    page: page,
    limit: limit
  };
  
  if (eventBooth && eventBooth.length > 0) {
    const boothStr = Array.isArray(eventBooth) ? eventBooth[0] : eventBooth;
    params.custom_event_booth = boothStr;
  }
  if (searchQuery) {
    params.po_no = searchQuery;
  }
  
  const response = await apiClient.get(endpoint, params);
  

  
  const list = response?.message;
  
  if (!list) {
    return [];
  }
  
  if (!Array.isArray(list)) {
    console.error('[HISTORY] Invalid history delivery note response format', list);
    return [];
  }
  
  return list;
};


/**
 * Fetch active/available Delivery Notes for picking.
 */
export const fetchReadyToReceiveDeliveryNotes = async (searchQuery = '', currentUser = null) => {
  const endpoint = '/api/method/thunder_erp.api.dn_picker.get_delivery_note_cl';
  
  const params = {
    custom_event_is_picked: 1,
    custom_picked_by: currentUser || '["is","set"]'
  };
  
  if (searchQuery) {
    params.po_no = searchQuery;
  }
  
  const response = await apiClient.get(endpoint, params);
  const list = response?.message;
  
  if (!list || !Array.isArray(list)) {
    return [];
  }
  
  return list;
};

/**
 * Fetch full Delivery Note detail (parent + items) using custom API
 * as the source of truth for Picking UI.
 */
export const getDeliveryNoteWithItems = async (dnName) => {
  const resourceBase = import.meta.env.VITE_API_DELIVERY_NOTE_RESOURCE || '/api/resource/Delivery Note';
  const endpoint = `${resourceBase}/${encodeURIComponent(dnName)}`;
  
  const response = await apiClient.get(endpoint);
  

  
  const detail = response?.data;
  
  if (!detail) {
    throw new Error(`Delivery Note ${dnName} not found in response`);
  }
  
  const normalizedItems = (detail.items || []).map(normalizeDeliveryNoteItem);
  
  return {
    ...detail,
    items: normalizedItems
  };
};

const normalizeDeliveryNoteItem = (item) => {
  if (item.name == null) {
    console.warn('[PICKING] Warning: item.name (row ID) is missing from backend response. Item picking persistence will fail without it.');
  }
  if (item.is_picked == null) {
    console.warn('[PICKING] Warning: item.is_picked state is missing from backend response. Defaulting to false.');
  }
  
  return {
    name: item.name ?? null,
    parent: item.parent ?? null,
    parenttype: item.parenttype ?? 'Delivery Note',
    itemCode: item.item_code ?? '',
    itemName: item.item_name ?? '',
    barcode: item.barcode ?? null,
    qty: Number(item.qty ?? 0),
    warehouse: item.warehouse ?? '',
    against_sales_order: item.against_sales_order ?? null,
    isPicked: isFrappeChecked(item.is_picked)
  };
};

/**
 * Claim a Delivery Note for picking.
 * 
 * Uses standard Frappe Resource API.
 * 
 * @param {string} deliveryNoteNo - The Delivery Note number to claim
 * @param {string} currentUser - The currently logged-in user email/id
 */
export const claimDeliveryNote = async (deliveryNoteNo, currentUser) => {
  if (!deliveryNoteNo) throw new Error('Delivery Note name is required');
  if (!currentUser) throw new Error('Current user is required');



  const resourceBase = import.meta.env.VITE_API_DELIVERY_NOTE_RESOURCE || '/api/resource/Delivery%20Note';
  const endpoint = `${resourceBase}/${encodeURIComponent(deliveryNoteNo)}`;
  
  const response = await apiClient.put(endpoint, {
    custom_picked_by: currentUser
  });
  

  
  return response;
};

/**
 * Mark a specific Delivery Note Item as picked.
 * Uses the child row name (unique ID) to ensure exact row update.
 * 
 * TODO BACKEND:
 * Replace temporary set_value implementation with secure custom API.
 * item update must verify DN ownership.
 * 
 * @param {string} deliveryNoteNo - The Delivery Note number (for ownership validation in backend later)
 * @param {string} itemRowName - The unique name (ID) of the Delivery Note Item child row
 */
export const updateDeliveryNoteItemPicked = async (deliveryNoteNo, itemRowName) => {

  const endpoint = '/api/method/frappe.client.set_value';
  const response = await apiClient.post(endpoint, {
    doctype: 'Delivery Note Item',
    name: itemRowName,
    fieldname: 'is_picked',
    value: 1
  });
  return response;
};

/**
 * Mark the entire Delivery Note as picked.
 * 
 * TODO BACKEND:
 * Replace frontend completion validation + set_value with server-side complete_picking API.
 * completion must be server-side validated.
 * 
 * @param {string} deliveryNoteNo - The Delivery Note number
 */
export const completeDeliveryNotePicking = async (deliveryNoteNo) => {

  
  const resourceBase = import.meta.env.VITE_API_DELIVERY_NOTE_RESOURCE || '/api/resource/Delivery%20Note';
  const endpoint = `${resourceBase}/${encodeURIComponent(deliveryNoteNo)}`;
  
  const response = await apiClient.put(endpoint, {
    custom_event_is_picked: 1
  });
  
  return response.data || response;
};
