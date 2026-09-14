import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { ChevronLeft, Check, Minus, Plus, Maximize, Search } from 'lucide-react';

const playSuccessBeep = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); // 1000Hz frequency
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Set volume
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1); // Fade out over 100ms
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) {
    console.error('Web Audio API not supported or failed', e);
  }
};

const Picking = () => {
  const { activeOrder, updateQuantity, scanProduct, completeOrder, clearActiveOrder, loading, activeOrderError } = useOrders();
  const navigate = useNavigate();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [pickupLater, setPickupLater] = useState(false); // New state for Pickup Mode
  const [isSubmitting, setIsSubmitting] = useState(false);

  // This input captures simulated barcode scans (typing + enter) for prototype purposes
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const barcode = barcodeInput.trim();
    if (barcode) {
      // Check if it's a valid scan that will be accepted
      const item = activeOrder?.items.find(i => i.itemCode === barcode);
      if (item && item.pickedQty < item.orderedQty) {
        playSuccessBeep();
      }
      
      scanProduct(barcode);
      setBarcodeInput('');
    }
  };

  const handleBack = () => {
    clearActiveOrder();
    navigate('/');
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    const success = await completeOrder(pickupLater);
    setIsSubmitting(false);
    if (success) {
      // For now navigate to success. If pickupNow needs to go to /pickup, adjust logic here.
      // E.g., if (!pickupLater) navigate('/pickup'); else navigate('/success');
      // Keeping it simple and going to success page:
      navigate('/success', { state: { orderId: activeOrder.deliveryNoteNo, type: pickupLater ? 'PICKUP_LATER' : 'PICKUP_NOW' } });
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (activeOrderError) {
    return (
      <div className="flex-col p-4 text-center mt-4">
        <p style={{ color: 'var(--error-color)' }}>{activeOrderError}</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Kembali ke Beranda</button>
      </div>
    );
  }

  if (!activeOrder) {
    return (
      <div className="flex-col p-4 text-center mt-4">
        <p>Pesanan tidak ditemukan.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Kembali ke Beranda</button>
      </div>
    );
  }

  const isFullyPicked = activeOrder.items.every(i => i.pickedQty === i.orderedQty);
  const completedItemsCount = activeOrder.items.filter(i => i.pickedQty === i.orderedQty).length;
  
  const filteredItems = activeOrder.items.filter(item => 
    item.itemName.toLowerCase().includes(productSearch.toLowerCase()) || 
    item.itemCode.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="header">
        <div className="header-row">
          <button className="icon-btn" onClick={handleBack} aria-label="Kembali">
            <ChevronLeft size={24} />
          </button>
          <div style={{ flexGrow: 1 }}>
            <h1 className="text-lg">{activeOrder.deliveryNoteNo}</h1>
            <span className="text-muted" style={{ fontSize: '14px' }}>SO: {activeOrder.salesOrderNo} | {activeOrder.customer}</span>
          </div>
        </div>
      </div>

      <div className="scanner-container">
        {/* Placeholder for camera feed in prototype */}
        <div style={{ position: 'absolute', color: 'white', zIndex: 2, textAlign: 'center' }}>
          <Maximize size={48} style={{ opacity: 0.5, marginBottom: '8px' }} />
          <p style={{ fontSize: '14px', opacity: 0.8 }}>Kamera Scanner Aktif</p>
        </div>
        <div className="scanner-overlay" />
        <div className="scan-line" />
      </div>
      
      {/* Search and hidden input for scanner simulation */}
      <div style={{ padding: '16px', backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', top: '12px', left: '16px', color: 'var(--text-muted)' }} size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Cari produk manual..."
            style={{ padding: '12px 12px 12px 48px', width: '100%' }}
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
        </div>
        <form onSubmit={handleBarcodeSubmit}>
          <input 
            type="text" 
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Simulasi Scan Barcode (Ketik & Enter)"
            className="search-input"
            style={{ padding: '12px', width: '100%', fontSize: '12px' }}
          />
        </form>
      </div>

      <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: '600', fontSize: '14px' }}>Daftar Barang</span>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '4px' }}>
          {completedItemsCount} dari {activeOrder.items.length} selesai
        </span>
      </div>

      <div className="flex-grow" style={{ overflowY: 'auto' }}>
        {filteredItems.map(item => {
          const isCompleted = item.pickedQty === item.orderedQty;
          
          return (
            <div key={item.itemCode} className={`product-item ${isCompleted ? 'completed' : 'incomplete'}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
              <div className="product-info" style={{ width: '100%' }}>
                <span className="product-name">{item.itemName}</span>
                <span className="product-status">SKU: {item.itemCode} | {item.warehouse}</span>
              </div>
              
              <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                <div className="qty-controls">
                  <button 
                    className="qty-btn" 
                    onClick={() => updateQuantity(item.itemCode, -1)}
                    disabled={item.pickedQty === 0}
                  >
                    <Minus size={20} />
                  </button>
                  <div className="qty-value">
                    <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.pickedQty}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>{item.orderedQty}</span>
                  </div>
                  <button 
                    className="qty-btn" 
                    onClick={() => updateQuantity(item.itemCode, 1)}
                    disabled={item.pickedQty >= item.orderedQty}
                  >
                    {isCompleted ? <Check size={20} color="var(--success-color)" /> : <Plus size={20} />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky-bottom" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="selectable-card-container">
          <div 
            className={`selectable-card ${!pickupLater ? 'active' : ''}`}
            onClick={() => setPickupLater(false)}
          >
            <div className="selectable-card-title">
              {!pickupLater && <Check size={16} />}
              Ambil Sekarang
            </div>
            <div className="selectable-card-desc">Pesanan siap untuk diambil sekarang.</div>
          </div>
          <div 
            className={`selectable-card ${pickupLater ? 'active' : ''}`}
            onClick={() => setPickupLater(true)}
          >
            <div className="selectable-card-title">
              {pickupLater && <Check size={16} />}
              Ambil Nanti
            </div>
            <div className="selectable-card-desc">Pesanan akan disiapkan untuk diambil nanti.</div>
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={handleComplete}
          disabled={!isFullyPicked || isSubmitting}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          {isSubmitting ? (
            <>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 1s linear infinite' }} />
              Menyimpan...
            </>
          ) : (
            'Selesai Ambil Barang'
          )}
        </button>
      </div>
    </div>
  );
};

export default Picking;
