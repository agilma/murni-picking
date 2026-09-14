const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock User
const mockUser = {
  message: {
    sid: "mock-session-123",
    user: "demo@murni.test",
    full_name: "Demo Operator",
    email: "demo@murni.test",
    roles: ["Tim Pengurus", "BA", "All"],
  },
  full_name: "Demo Operator"
};

// Mock Orders
let mockOrders = [
  {
    name: "MOCK-DN-001",
    customer: "Budi Santoso",
    posting_date: "2026-09-11",
    status: "To Bill",
    custom_order_type: "STATION_PICKUP",
    items: [
      { name: "row-1", item_code: "ITEM-001", item_name: "Kopi Susu Gula Aren", qty: 2, picked_qty: 0 },
      { name: "row-2", item_code: "ITEM-002", item_name: "Matcha Latte", qty: 1, picked_qty: 0 }
    ]
  },
  {
    name: "MOCK-DN-002",
    customer: "Meja 4",
    posting_date: "2026-09-11",
    status: "To Bill",
    custom_order_type: "DINE_IN",
    items: [
      { name: "row-3", item_code: "ITEM-003", item_name: "Nasi Goreng Spesial", qty: 1, picked_qty: 0 },
      { name: "row-4", item_code: "ITEM-004", item_name: "Es Teh Manis", qty: 2, picked_qty: 0 }
    ]
  },
  {
    name: "MOCK-DN-003",
    customer: "Siti Rahma",
    posting_date: "2026-09-11",
    status: "To Bill",
    custom_order_type: "STATION_PICKUP",
    items: [
      { name: "row-5", item_code: "ITEM-005", item_name: "Roti Bakar Coklat Keju", qty: 3, picked_qty: 0 }
    ]
  }
];

// Mock Invoices
let mockInvoices = [
  {
    name: "MOCK-SINV-001",
    customer_name: "Budi Santoso",
    grand_total: 65000,
    custom_picked_up: 0,
    items: [
      { item_name: "Kopi Susu Gula Aren", qty: 2, rate: 20000 },
      { item_name: "Matcha Latte", qty: 1, rate: 25000 }
    ]
  },
  {
    name: "MOCK-SINV-002",
    customer_name: "Siti Rahma",
    grand_total: 45000,
    custom_picked_up: 1, // Already picked up
    items: [
      { item_name: "Roti Bakar Coklat Keju", qty: 3, rate: 15000 }
    ]
  }
];

export const mockAuthService = {
  login: async (usr, pwd) => {
    await delay(1000);
    if (usr && pwd) {
      return mockUser;
    }
    throw new Error("Invalid credentials");
  },
  logout: async () => {
    await delay(500);
    return { message: "ok" };
  },
  getLoggedUser: async () => {
    await delay(500);
    // If we want to simulate a logged in user, return full_name.
    // If not, return "Guest".
    const hasSession = localStorage.getItem('murniUser');
    if (hasSession) {
      return { message: mockUser.full_name };
    }
    return { message: "Guest" };
  }
};

export const mockOrderService = {
  getDeliveryNotes: async () => {
    await delay(800);
    return { data: mockOrders };
  },
  getDeliveryNote: async (name) => {
    await delay(500);
    const order = mockOrders.find(o => o.name === name);
    if (!order) throw new Error("Order not found");
    return { data: order };
  },
  updateDeliveryNotePicking: async (name, items) => {
    await delay(1000);
    const orderIndex = mockOrders.findIndex(o => o.name === name);
    if (orderIndex === -1) throw new Error("Order not found");
    
    const order = mockOrders[orderIndex];
    items.forEach(updateItem => {
      const item = order.items.find(i => i.name === updateItem.name);
      if (item) {
        item.picked_qty = updateItem.picked_qty;
      }
    });
    
    return { data: order };
  }
};

export const mockPickupService = {
  getSalesInvoice: async (name) => {
    await delay(800);
    const invoice = mockInvoices.find(i => i.name === name);
    if (!invoice) throw new Error("Invoice not found");
    return { data: invoice };
  },
  markSalesInvoicePickedUp: async (name) => {
    await delay(1000);
    const invoice = mockInvoices.find(i => i.name === name);
    if (!invoice) throw new Error("Invoice not found");
    
    if (invoice.custom_picked_up) {
      throw new Error("Pesanan sudah diambil");
    }
    
    invoice.custom_picked_up = 1;
    return { data: invoice };
  }
};
