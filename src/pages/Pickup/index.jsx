import React from 'react';
import { useOrders } from '../../context/OrderContext';
import OperatorHandover from '../OperatorHandover';
import CustomerPickup from './CustomerPickup';

const Pickup = () => {
  const { activeOrder } = useOrders();
  
  if (activeOrder) {
    return <OperatorHandover />;
  }

  return <CustomerPickup />;
};

export default Pickup;
