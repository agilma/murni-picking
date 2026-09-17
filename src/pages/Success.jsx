import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Copy, Check } from 'lucide-react';
import { useOrders } from '../context/OrderContext';

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearActiveOrder } = useOrders();
  const [copied, setCopied] = useState(false);
  const [pickupCodeCopied, setPickupCodeCopied] = useState(false);
  const [showNextOrderConfirmation, setShowNextOrderConfirmation] = useState(false);

  const { orderId, type, customPickUpCode } = location.state || {};

  useEffect(() => {
    // Clear active order context when reaching success page
    clearActiveOrder();
  }, [clearActiveOrder]);

  const handleCopyPickupCode = async () => {
    if (!customPickUpCode) return;

    try {
      await navigator.clipboard.writeText(customPickUpCode);
      setCopied(true);
      setPickupCodeCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy pickup code:', error);
    }
  };

  const proceedToNextOrder = () => {
    navigate('/');
  };

  const handleNextOrder = () => {
    if (type === 'PICKUP_NOW' && customPickUpCode && !pickupCodeCopied) {
      setShowNextOrderConfirmation(true);
      return;
    }

    proceedToNextOrder();
  };

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

      {type === 'PICKUP_LATER' && (
        <div style={{ marginTop: '24px', marginBottom: '16px', border: '2px solid var(--border-color)', padding: '16px', borderRadius: '8px', width: '100%', maxWidth: '320px', backgroundColor: 'var(--bg-secondary)' }}>
          <p className="text-secondary" style={{ fontSize: '14px', marginBottom: '8px' }}>PICKUP CODE</p>
          {customPickUpCode ? (<> <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 12px 0', color: 'var(--text-primary)', letterSpacing: '2px', lineHeight: '1.2' }} > {customPickUpCode} </h1> <p className="text-secondary" style={{ fontSize: '14px', margin: 0 }} > Tulis kode ini pada paper bag. </p> </>) : (<p className="text-secondary" style={{ fontSize: '14px', margin: 0, color: 'var(--error-color)' }} > Kode pickup belum tersedia. </p>)}
        </div>
      )}

      {type === 'PICKUP_NOW' && (
        <div style={{ marginTop: '24px', marginBottom: '16px', border: '2px solid var(--border-color)', padding: '16px', borderRadius: '8px', width: '100%', maxWidth: '320px', backgroundColor: 'var(--bg-secondary)' }}>
          <p className="text-secondary" style={{ fontSize: '14px', marginBottom: '8px' }}>Pickup Code</p>
          {customPickUpCode ? (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                <div style={{ flex: 1, minWidth: 0, overflowX: 'auto', textAlign: 'left', paddingBottom: '4px' }}>
                  <h1 style={{ fontSize: '20px', fontWeight: '700', margin: '0', color: 'var(--text-primary)', letterSpacing: '1px', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                    {customPickUpCode}
                  </h1>
                </div>
                <button 
                  onClick={handleCopyPickupCode}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: copied ? 'var(--success-bg)' : 'var(--bg-elevated)',
                    color: copied ? 'var(--success-color)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Tersalin' : 'Copy'}
                </button>
              </div>
              <p className="text-secondary" style={{ fontSize: '14px', margin: 0 }}>
                Kode ini digunakan saat pengambilan pesanan.
              </p>
            </>
          ) : (
            <p className="text-secondary" style={{ fontSize: '14px', margin: 0, color: 'var(--error-color)' }}>
              Kode pickup belum tersedia.
            </p>
          )}
        </div>
      )}

      <div style={{ marginTop: '40px', width: '100%', maxWidth: '320px' }}>
        <button className="btn btn-primary" onClick={handleNextOrder} style={{ width: '100%' }}>
          Process Next Order
        </button>
      </div>

      {showNextOrderConfirmation && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, 
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{ 
            backgroundColor: 'var(--bg-primary)', 
            width: '100%', 
            maxWidth: '320px', 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            textAlign: 'center',
            animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              Pickup Code belum disalin
            </h3>
            
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
              Anda belum menyalin Pickup Code untuk order ini.<br/><br/>Apakah Anda yakin ingin melanjutkan ke order berikutnya?
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => setShowNextOrderConfirmation(false)}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Tetap di Halaman
              </button>
              
              <button 
                onClick={proceedToNextOrder}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                Lanjut Order Berikutnya
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
      `}</style>
    </div>
  );
};

export default Success;
