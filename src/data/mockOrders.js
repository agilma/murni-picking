export const mockOrders = [
  {
    orderNumber: '#BM-10234',
    type: 'DINE_IN',
    customerInfo: {
      tableNumber: '12'
    },
    status: 'READY_TO_PICK',
    items: [
      { productId: '1', sku: 'SK-TONER-01', name: 'Hydrating Glow Toner', orderedQty: 2, pickedQty: 0, barcode: '899123456001' },
      { productId: '3', sku: 'SK-MOIST-01', name: 'Ceramide Barrier Moisturizer', orderedQty: 1, pickedQty: 0, barcode: '899123456003' }
    ]
  },
  {
    orderNumber: '#BM-10235',
    type: 'STATION_PICKUP',
    customerInfo: {
      name: 'Budi Santoso',
      phone: '08123456789'
    },
    status: 'READY_TO_PICK',
    items: [
      { productId: '2', sku: 'SK-SERUM-01', name: 'Vitamin C Brightening Serum', orderedQty: 1, pickedQty: 0, barcode: '899123456002' },
      { productId: '4', sku: 'SK-CLEAN-01', name: 'Gentle Foaming Cleanser', orderedQty: 1, pickedQty: 0, barcode: '899123456004' },
      { productId: '5', sku: 'SK-SUN-01', name: 'Daily UV Shield SPF 50', orderedQty: 3, pickedQty: 0, barcode: '899123456005' }
    ]
  }
];
