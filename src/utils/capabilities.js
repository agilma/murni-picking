export const normalizeRoleProfile = (rawProfile) => {
  // If undefined/null, return Unknown
  if (!rawProfile) return 'Unknown';

  const role = String(rawProfile).trim().toUpperCase();

  if (role === 'PICKER') return 'Picking';
  if (role === 'PICKUP') return 'Pickup';

  // Fail closed
  return 'Unknown';
};

export const getCapabilities = (appMode) => {
  switch (appMode) {
    case 'picking':
      return {
        canPicking: true,
        canReceivePicking: false,
        canCustomerPickup: false,
        canSubmitDeliveryNote: false,
      };

    case 'pickup':
      return {
        canPicking: false,
        canReceivePicking: true,
        canCustomerPickup: true,
        canSubmitDeliveryNote: true,
      };
      
    case 'all':
      return {
        canPicking: true,
        canReceivePicking: true,
        canCustomerPickup: true,
        canSubmitDeliveryNote: true,
      };

    default:
      return {
        canPicking: false,
        canReceivePicking: false,
        canCustomerPickup: false,
        canSubmitDeliveryNote: false,
      };
  }
};
