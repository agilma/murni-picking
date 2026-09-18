export const resolvePickupFlow = (deliveryNote) => {
  const option = String(
    deliveryNote?.custom_event_pickup_option || ''
  ).trim().toUpperCase();

  if (option === 'BOOTH') {
    return 'BOOTH';
  }

  if (option === 'STATION_PICKUP' || option === 'PICKUP STATION') {
    return 'STATION_PICKUP';
  }

  return 'UNKNOWN';
};

export const canReceivePickingForFlow = ({
  role,
  deliveryNote,
}) => {
  const flow = resolvePickupFlow(deliveryNote);

  if (role === 'Pickup') {
    // Both flows might be allowed for Pickup according to existing rules, or just STATION_PICKUP.
    // User said: "Pickup + BOOTH -> blocked kecuali existing business rule memang mengizinkan"
    // Let's restrict it to STATION_PICKUP. Wait, existing rule: Pickup handles Pickup. If BOOTH is handled by Picking, maybe Pickup doesn't handle BOOTH Receive Picking?
    // Let's just allow STATION_PICKUP.
    return flow === 'STATION_PICKUP';
  }

  if (role === 'Picking') {
    return flow === 'BOOTH' || flow === 'STATION_PICKUP';
  }

  return false;
};
