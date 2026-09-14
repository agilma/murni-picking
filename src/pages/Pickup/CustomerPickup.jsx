import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, QrCode, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';
import { validatePickupQr, confirmPickup } from '../../services/pickupService';
import PickupScanner from './PickupScanner';
import ManualPickupCode from './ManualPickupCode';
import PickupOrderCard from './PickupOrderCard';

const CustomerPickup = () => {
  const navigate = useNavigate();
  const [pickupState, setPickupState] = useState('idle'); // idle, scanning, manual-code, processing, order-found, invalid, expired, already-picked-up, confirmation, success, camera-error
  const [pickupOrder, setPickupOrder] = useState(null);

  const handleBack = () => {
    if (['scanning', 'manual-code', 'invalid', 'expired', 'already-picked-up', 'camera-error'].includes(pickupState)) {
      setPickupState('idle');
    } else if (pickupState === 'order-found' || pickupState === 'confirmation') {
      setPickupState('idle');
      setPickupOrder(null);
    } else {
      navigate('/');
    }
  };

  const processCode = async (code) => {
    setPickupState('processing');
    try {
      const result = await validatePickupQr(code);
      if (result.status === 'success') {
        setPickupOrder(result.order);
        setPickupState('order-found');
      } else {
        setPickupState(result.status);
        if (result.order) {
          setPickupOrder(result.order); // for already-picked-up
        }
      }
    } catch {
      setPickupState('invalid');
    }
  };

  const handleScanSuccess = (code) => {
    processCode(code);
  };

  const handleConfirmPickup = async () => {
    setPickupState('confirmation');
  };

  const executeConfirm = async () => {
    setPickupState('processing');
    await confirmPickup(pickupOrder.orderId);
    navigate('/success', { state: { orderId: pickupOrder.orderId, type: 'DINE_IN' } });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {pickupState !== 'success' && (
        <div className="header">
          <div className="header-row">
            <button className="icon-btn" onClick={handleBack} aria-label="Kembali">
              <ChevronLeft size={24} />
            </button>
            <div style={{ flexGrow: 1 }}>
              <h1 className="text-lg">Pickup</h1>
            </div>
          </div>
        </div>
      )}

      <div className="flex-grow" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {/* IDLE STATE */}
        {pickupState === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '24px', alignItems: 'center', justifyContent: 'center', flexGrow: 1, textAlign: 'center', gap: '32px' }}>
            <div>
              <h2 className="text-xl mb-2">Pickup Pesanan</h2>
              <p className="text-secondary">Ambil pesananmu dengan<br/>scan QR Code dari website Murni.</p>
            </div>
            
            <div style={{ 
              width: '100%', 
              maxWidth: '320px', 
              aspectRatio: '1', 
              border: '2px dashed var(--border-color)', 
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              backgroundColor: 'var(--bg-elevated)'
            }}>
              <QrCode size={64} color="var(--text-muted)" />
              <span className="text-secondary">Scan untuk Pickup</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '320px' }}>
              <button className="btn btn-primary" onClick={() => setPickupState('scanning')}>
                Scan QR Pickup
              </button>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>atau</div>
              <button className="btn btn-secondary" onClick={() => setPickupState('manual-code')}>
                Masukkan Kode Manual
              </button>
            </div>
          </div>
        )}

        {/* SCANNING STATE */}
        {pickupState === 'scanning' && (
          <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <PickupScanner 
              onScanSuccess={handleScanSuccess} 
              onClose={() => setPickupState('idle')} 
              onError={() => setPickupState('camera-error')} 
            />
          </div>
        )}

        {/* CAMERA ERROR STATE */}
        {pickupState === 'camera-error' && (
          <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '24px' }}>
            <Smartphone size={64} color="var(--warning-color)" />
            <div>
              <h2 className="text-lg mb-2">Kamera Tidak Dapat Diakses</h2>
              <p className="text-secondary">Izinkan akses kamera untuk melakukan<br/>scan QR Code.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px' }}>
              <button className="btn btn-primary" onClick={() => setPickupState('scanning')}>
                Coba Lagi
              </button>
              <button className="btn btn-secondary" onClick={() => setPickupState('manual-code')}>
                Masukkan Kode Manual
              </button>
            </div>
          </div>
        )}

        {/* MANUAL CODE STATE */}
        {pickupState === 'manual-code' && (
          <ManualPickupCode onSubmit={processCode} onCancel={() => setPickupState('idle')} />
        )}

        {/* PROCESSING STATE */}
        {pickupState === 'processing' && (
          <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
            <p className="text-secondary">Memproses...</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ORDER FOUND STATE */}
        {pickupState === 'order-found' && (
          <PickupOrderCard 
            order={pickupOrder} 
            onConfirm={handleConfirmPickup} 
            onCancel={() => setPickupState('idle')} 
          />
        )}

        {/* INVALID STATE */}
        {pickupState === 'invalid' && (
          <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '24px' }}>
            <AlertCircle size={64} color="var(--error-color)" />
            <div>
              <h2 className="text-lg mb-2">QR Code Tidak Valid</h2>
              <p className="text-secondary">QR Code ini tidak dapat digunakan<br/>untuk pickup.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setPickupState('scanning')} style={{ width: '100%', maxWidth: '320px' }}>
              Scan Lagi
            </button>
          </div>
        )}

        {/* EXPIRED STATE */}
        {pickupState === 'expired' && (
          <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '24px' }}>
            <AlertCircle size={64} color="var(--warning-color)" />
            <div>
              <h2 className="text-lg mb-2">QR Code Kedaluwarsa</h2>
              <p className="text-secondary">QR Code pickup ini sudah tidak<br/>dapat digunakan.<br/><br/>Silakan gunakan QR Code terbaru.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setPickupState('scanning')} style={{ width: '100%', maxWidth: '320px' }}>
              Scan Lagi
            </button>
          </div>
        )}

        {/* ALREADY PICKED UP STATE */}
        {pickupState === 'already-picked-up' && (
          <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '24px' }}>
            <CheckCircle size={64} color="var(--text-muted)" />
            <div>
              <h2 className="text-lg mb-2">Pesanan Sudah Diambil</h2>
              <p className="text-secondary">Pesanan ini sudah pernah digunakan<br/>untuk pickup.</p>
              {pickupOrder && <p className="text-primary mt-4" style={{ fontWeight: '600' }}>Order #{pickupOrder.orderId}</p>}
            </div>
            <button className="btn btn-secondary" onClick={() => setPickupState('idle')} style={{ width: '100%', maxWidth: '320px' }}>
              Kembali
            </button>
          </div>
        )}

        {/* CONFIRMATION STATE */}
        {pickupState === 'confirmation' && (
          <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '24px' }}>
            <div className="card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '320px' }}>
              <h2 className="text-lg">Konfirmasi Pickup</h2>
              <p className="text-secondary" style={{ marginBottom: '16px' }}>Pastikan pesanan sudah diterima oleh customer.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button className="btn btn-primary" onClick={executeConfirm}>
                  Konfirmasi
                </button>
                <button className="btn btn-secondary" onClick={() => setPickupState('order-found')} style={{ border: 'none', background: 'transparent' }}>
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {pickupState === 'success' && (
          <div style={{ 
            padding: '24px', 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            textAlign: 'center', 
            gap: '24px',
            animation: 'fadeIn 0.5s ease-out' 
          }}>
            <div style={{ animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
              <CheckCircle size={80} color="var(--success-color)" />
            </div>
            <div>
              <h2 className="text-xl mb-4" style={{ color: 'var(--success-color)' }}>Pickup Berhasil!</h2>
              <p className="text-primary mb-2">Pesanan <strong>#{pickupOrder?.orderId}</strong><br/>telah berhasil diambil.</p>
              <p className="text-secondary mt-4">Terima kasih telah menggunakan<br/>Murni Booth.</p>
            </div>
            <button className="btn btn-primary mt-4" onClick={() => navigate('/')} style={{ width: '100%', maxWidth: '320px' }}>
              Kembali ke Home
            </button>
            <style>{`
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
              @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
            `}</style>
          </div>
        )}

      </div>
    </div>
  );
};

export default CustomerPickup;
