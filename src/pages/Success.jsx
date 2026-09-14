import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useOrders } from '../context/OrderContext';

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearActiveOrder } = useOrders();
  
  const { orderId, type } = location.state || {};

  useEffect(() => {
    // Clear active order context when reaching success page
    clearActiveOrder();
  }, [clearActiveOrder]);

  if (!orderId) {
    // Fallback if accessed directly
    return (
      <div style={{ padding: '24px', textAlign: 'center', marginTop: '40px' }}>
        <p>Data tidak ditemukan.</p>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>Kembali ke Home</button>
      </div>
    );
  }

  const title = type === 'DINE_IN' ? 'Pickup Completed' : 'Picking Completed';

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      backgroundColor: 'var(--bg-primary)',
      justifyContent: 'center', 
      alignItems: 'center', 
      textAlign: 'center', 
      padding: '24px',
      animation: 'fadeIn 0.5s ease-out' 
    }}>
      <div style={{ animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)', marginBottom: '24px' }}>
        <CheckCircle size={80} color="var(--success-color)" />
      </div>
      
      <h2 className="text-xl mb-4" style={{ color: 'var(--success-color)' }}>{title}</h2>
      <p className="text-primary mb-2">Order <strong>#{orderId}</strong></p>
      
      <div style={{ marginTop: '40px', width: '100%', maxWidth: '320px' }}>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ width: '100%' }}>
          Process Next Order
        </button>
      </div>
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
      `}</style>
    </div>
  );
};

export default Success;
