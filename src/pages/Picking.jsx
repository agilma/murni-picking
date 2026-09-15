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
  const [scanFeedback, setScanFeedback] = useState(null);

  // This input captures simulated barcode scans (typing + enter) for prototype purposes
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const barcode = barcodeInput.trim();
    if (barcode) {
      // Check if it's a valid scan that will be accepted
      const item = activeOrder?.items.find(i => i.itemCode === barcode);
      if (item) {
        if (item.pickedQty < item.orderedQty) {
          playSuccessBeep();
          setScanFeedback('✓ Barang berhasil dipindai');
          setTimeout(() => setScanFeedback(null), 2000);
        } else {
          setScanFeedback('Jumlah barang ini sudah sesuai.');
          setTimeout(() => setScanFeedback(null), 2000);
        }
      } else {
        setScanFeedback('Kode barang ini tidak ada di Delivery Note.');
        setTimeout(() => setScanFeedback(null), 2000);
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
    const result = await completeOrder(pickupLater);
    setIsSubmitting(false);
    if (result) {
      // For now navigate to success. If pickupNow needs to go to /pickup, adjust logic here.
      // E.g., if (!pickupLater) navigate('/pickup'); else navigate('/success');
      // Keeping it simple and going to success page:
      navigate('/success', { 
        state: { 
          orderId: activeOrder.deliveryNoteNo, 
          type: pickupLater ? 'PICKUP_LATER' : 'PICKUP_NOW',
          customPickUpCode: result.customPickUpCode
        } 
      });
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
  const progressPercent = activeOrder.items.length > 0 ? (completedItemsCount / activeOrder.items.length) * 100 : 0;
  
  const filteredItems = activeOrder.items.filter(item => 
    item.itemName.toLowerCase().includes(productSearch.toLowerCase()) || 
    item.itemCode.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="header" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="header-row" style={{ alignItems: 'flex-start' }}>
          <button className="icon-btn" onClick={handleBack} aria-label="Kembali" style={{ marginTop: '-4px' }}>
            <ChevronLeft size={24} />
          </button>
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Picking</div>
            <h1 className="text-xl" style={{ fontWeight: '700', margin: '2px 0 4px 0' }}>{activeOrder.deliveryNoteNo}</h1>
            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{activeOrder.customer}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>SO: {activeOrder.salesOrderNo}</div>
          </div>
        </div>
        
        <div style={{ marginTop: '8px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '500' }}>
            <span>Progress Picking</span>
            <span>{completedItemsCount} dari {activeOrder.items.length} selesai</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: 'var(--success-color)', transition: 'width 0.3s ease' }} />
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

      <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <span style={{ fontWeight: '600', fontSize: '14px' }}>Daftar Barang</span>
        
        {scanFeedback && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-primary)',
            padding: '6px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            zIndex: 10,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            {scanFeedback}
          </div>
        )}
      </div>

      <div className="flex-grow" style={{ overflowY: 'auto' }}>
        {filteredItems.map(item => {
          const isCompleted = item.pickedQty === item.orderedQty;
          
          return (
            <div key={item.itemCode} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              padding: '16px',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: isCompleted ? 'var(--bg-secondary)' : 'var(--bg-primary)',
              transition: 'background-color 0.2s'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ 
                  marginTop: '2px', 
                  color: isCompleted ? 'var(--success-color)' : 'transparent',
                  flexShrink: 0
                }}>
                  <Check size={18} strokeWidth={3} />
                </div>
                <div style={{ flexGrow: 1, minWidth: 0, opacity: isCompleted ? 0.7 : 1 }}>
                  <div style={{ 
                    fontWeight: '600', 
                    fontSize: '15px', 
                    color: 'var(--text-primary)',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    lineHeight: '1.4',
                    marginBottom: '4px'
                  }}>
                    {item.itemName}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {item.itemCode}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {item.warehouse}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '4px 8px',
                  borderRadius: '24px',
                  border: '1px solid var(--border-color)'
                }}>
                  <button 
                    onClick={() => updateQuantity(item.itemCode, -1)}
                    disabled={item.pickedQty === 0}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: item.pickedQty === 0 ? 'transparent' : 'var(--bg-elevated)',
                      color: item.pickedQty === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                      cursor: item.pickedQty === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Minus size={20} />
                  </button>
                  
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', minWidth: '48px', justifyContent: 'center' }}>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: isCompleted ? 'var(--success-color)' : 'var(--text-primary)' }}>
                      {item.pickedQty}
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>
                      {item.orderedQty}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => updateQuantity(item.itemCode, 1)}
                    disabled={item.pickedQty >= item.orderedQty}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: item.pickedQty >= item.orderedQty ? 'transparent' : 'var(--bg-elevated)',
                      color: item.pickedQty >= item.orderedQty ? 'var(--text-muted)' : 'var(--text-primary)',
                      cursor: item.pickedQty >= item.orderedQty ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky-bottom" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '0 4px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Cara Pengambilan</div>
          <div className="selectable-card-container">
            <div 
              className={`selectable-card ${!pickupLater ? 'active' : ''}`}
              onClick={() => setPickupLater(false)}
            >
              <div className="selectable-card-title">
                {!pickupLater && <Check size={16} />}
                Ambil Sekarang
              </div>
              <div className="selectable-card-desc">Barang diambil sekarang</div>
            </div>
            <div 
              className={`selectable-card ${pickupLater ? 'active' : ''}`}
              onClick={() => setPickupLater(true)}
            >
              <div className="selectable-card-title">
                {pickupLater && <Check size={16} />}
                Ambil Nanti
              </div>
              <div className="selectable-card-desc">Pelanggan mengambil nanti</div>
            </div>
          </div>
        </div>

        <button 
          className={`btn ${isFullyPicked ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={handleComplete}
          disabled={!isFullyPicked || isSubmitting}
          style={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '8px',
            padding: '16px',
            fontSize: '15px',
            opacity: (!isFullyPicked && !isSubmitting) ? 1 : undefined,
            backgroundColor: (!isFullyPicked && !isSubmitting) ? 'var(--bg-secondary)' : undefined,
            color: (!isFullyPicked && !isSubmitting) ? 'var(--text-muted)' : undefined,
            border: (!isFullyPicked && !isSubmitting) ? '1px solid var(--border-color)' : undefined
          }}
        >
          {isSubmitting ? (
            <>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 1s linear infinite' }} />
              Menyelesaikan Picking...
            </>
          ) : !isFullyPicked ? (
            'Selesaikan jumlah barang terlebih dahulu'
          ) : (
            'Selesaikan Picking'
          )}
        </button>
      </div>
    </div>
  );
};

export default Picking;
