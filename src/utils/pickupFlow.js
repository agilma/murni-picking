export const resolvePickupFlow = (deliveryNote) => {
  const option = String(
    deliveryNote?.custom_event_pickup_option || deliveryNote?.custom_event_booth || ''
  ).trim().toUpperCase();

  if (option.startsWith('BOOTH')) {
    return 'BOOTH';
  }

  if (option === 'STATION_PICKUP' || option === 'PICKUP STATION') {
    return 'STATION_PICKUP';
  }

  return 'UNKNOWN';
};


