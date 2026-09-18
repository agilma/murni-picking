import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCapabilities } from '../context/AuthContext';

const CapabilityGuard = ({ children, requiredCapability }) => {
  const capabilities = useCapabilities();

  if (requiredCapability && !capabilities[requiredCapability]) {
    // If the user doesn't have the required capability, redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
};

export default CapabilityGuard;
