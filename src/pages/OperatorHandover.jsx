import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { ChevronLeft, QrCode, CheckCircle } from 'lucide-react';

const Pickup = () => {
  const { activeOrder, clearActiveOrder } = useOrders();
  const navigate = useNavigate();
  const [qrScanned, setQrScanned] = useState(false);

  const handleBack = () => {
    navigate('/picking');
  };

  const handleSimulateScan = () => {
    setQrScanned(true);
  };

  const handleComplete = () => {
    clearActiveOrder();
    navigate('/');
  };

  if (!activeOrder) {
    return (
      <div className="flex-col p-4 text-center mt-4">
        <p>Tidak ada pesanan aktif.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Kembali ke Beranda</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div className="header">
        <div className="header-row">
          <button className="icon-btn" onClick={handleBack} aria-label="Kembali">
            <ChevronLeft size={24} />
          </button>
          <div style={{ flexGrow: 1 }}>
            <h1 className="text-lg">Serahkan Pesanan</h1>
            <span className="text-muted" style={{ fontSize: '14px' }}>{activeOrder.orderNumber}</span>
          </div>
        </div>
      </div>

      <div className="flex-grow flex-col" style={{ padding: '24px', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        {!qrScanned ? (
          <>
            <div style={{ 
              width: '200px', 
              height: '200px', 
              backgroundColor: 'var(--bg-elevated)', 
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed var(--border-color)',
              marginBottom: '24px'
            }}>
              <QrCode size={64} color="var(--text-muted)" />
            </div>
            
            <h2 className="text-lg mb-4">Scan QR Pelanggan</h2>
            <p className="text-secondary mb-4" style={{ marginBottom: '32px' }}>
              Minta pelanggan untuk menunjukkan QR code pengambilan pesanan mereka.
            </p>
            
            <button className="btn btn-secondary" onClick={handleSimulateScan}>
              (Simulasi) Berhasil Scan QR
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '24px' }}>
              <CheckCircle size={80} color="var(--success-color)" />
            </div>
            <h2 className="text-lg mb-4">QR Valid</h2>
            <p className="text-secondary mb-4" style={{ marginBottom: '32px' }}>
              Pesanan untuk {activeOrder.customerInfo?.name || 'Pelanggan'} dapat diserahkan.
            </p>
          </>
        )}
      </div>

      <div className="sticky-bottom">
        <button 
          className="btn btn-primary" 
          onClick={handleComplete}
          disabled={!qrScanned}
        >
          Pesanan Selesai
        </button>
      </div>
    </div>
  );
};

export default Pickup;
