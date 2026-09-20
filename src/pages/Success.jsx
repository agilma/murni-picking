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

  const { 
    orderId, // This is Delivery Note No
    salesOrderNo,
    customer,
    booth,
    totalItems,
    type, 
    customPickUpCode 
  } = location.state || {};

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
    if (type === 'DINE_IN') {
      navigate('/pickup', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
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

  if (type === 'DINE_IN') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-primary)', padding: '24px', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.5s ease-out' }}>
        <div style={{ animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)', marginBottom: '24px' }}>
          <CheckCircle size={80} color="var(--success-color)" />
        </div>
        
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Pickup Code</div>
        <h2 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '8px', color: 'var(--text-primary)', textAlign: 'center', letterSpacing: '2px' }}>
          {customPickUpCode || '-'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'center', maxWidth: '350px', lineHeight: '1.5' }}>
          Pesanan ini <b>telah berhasil diambil</b> oleh pelanggan.
        </p>
        
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sales Order</div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>{salesOrderNo || '-'}</div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Customer</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{customer || '-'}</span>
            </div>
          </div>
        </div>
        
        <button 
          className="btn btn-primary" 
          style={{ width: '100%', maxWidth: '400px', padding: '16px', fontSize: '18px', fontWeight: 'bold', borderRadius: '12px' }}
          onClick={proceedToNextOrder}
        >
          Process Next Order
        </button>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
        `}</style>
      </div>
    );
  }

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
      
      <h1 style={{ fontWeight: '800', fontSize: '28px', margin: '0 0 4px 0', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
        {salesOrderNo || '-'}
      </h1>
      <p className="text-secondary mb-4" style={{ fontSize: '14px', fontWeight: '500' }}>{orderId}</p>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px', 
        marginBottom: '16px',
        width: '100%',
        maxWidth: '320px',
        textAlign: 'left',
        backgroundColor: 'var(--bg-elevated)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Customer</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{customer || '-'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Booth</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{booth || '-'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Item</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{totalItems || 0} item</span>
        </div>
      </div>

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
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-secondary" style={{ fontSize: '14px', margin: 0, textAlign: 'left' }}>
                Minta pelanggan menuliskan kode ini.
              </p>
            </>
          ) : (
            <p className="text-secondary" style={{ fontSize: '14px', margin: 0, color: 'var(--error-color)' }}>
              Kode pickup belum tersedia.
            </p>
          )}
        </div>
      )}

      <div style={{ marginTop: 'auto', width: '100%', paddingTop: '24px' }}>
        <button 
          className="btn btn-primary" 
          onClick={handleNextOrder}
          style={{ width: '100%', maxWidth: '320px' }}
        >
          {type === 'DINE_IN' ? 'Process Next Order' : 'Selesai'}
        </button>
      </div>

      {showNextOrderConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            padding: '24px',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '320px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>Peringatan</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
              Anda belum menyalin (copy) Kode Pickup. Pastikan pelanggan sudah mengetahui kodenya sebelum melanjutkan.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => setShowNextOrderConfirmation(false)}
              >
                Batal
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                onClick={() => {
                  setShowNextOrderConfirmation(false);
                  proceedToNextOrder();
                }}
              >
                Lanjutkan
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
