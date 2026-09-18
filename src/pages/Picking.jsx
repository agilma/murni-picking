import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { ChevronLeft, Check, Minus, Plus, Search, CameraOff, AlertCircle, Camera, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

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
  const { activeOrder, incrementPickedQty, completeOrder, clearActiveOrder, loading, activeOrderError } = useOrders();
  const navigate = useNavigate();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanFeedback, setScanFeedback] = useState(null);
  
  const [cameraState, setCameraState] = useState('initializing'); // initializing, active, error
  const [cameraErrorMsg, setCameraErrorMsg] = useState('');
  const [submitError, setSubmitError] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  const scannerRef = useRef(null);
  const scannerContainerRef = useRef(null);

  // This input captures simulated barcode scans (typing + enter) for prototype purposes
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const barcode = barcodeInput.trim();
    if (barcode) {
      processScan(barcode);
      setBarcodeInput('');
    }
  };

  const processScan = async (barcode) => {
    if (!activeOrder) return;
    
    // Using incrementPickedQty which updates state inside OrderContext
    const success = await incrementPickedQty(barcode);
    
    if (success) {
      playSuccessBeep();
      setScanFeedback('✓ Barang berhasil dipindai');
      setTimeout(() => setScanFeedback(null), 2000);
      setIsScannerOpen(false); // Close modal on successful item match
    } else {
      // The toast is already shown by incrementPickedQty in context, 
      // but we can set local feedback if needed.
      setTimeout(() => setScanFeedback(null), 2000);
    }
  };

  const handleBack = () => {
    clearActiveOrder();
    navigate('/');
  };

  const handleComplete = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(false);
    
    const result = await completeOrder();
    setIsSubmitting(false);
    
    if (result) {
      navigate('/success', { 
        state: { 
          orderId: activeOrder.deliveryNoteNo, 
          type: result.custom_event_pickup_option || 'UNKNOWN',
          customPickUpCode: result.pickupCode
        } 
      });
    } else {
      setSubmitError(true);
    }
  };

  useEffect(() => {
    let isUnmounted = false;

    if (!activeOrder || activeOrderError || loading) return;
    
    if (!isScannerOpen) {
      if (scannerRef.current) {
        const html5QrCode = scannerRef.current;
        scannerRef.current = null;
        if (html5QrCode.isScanning) {
          html5QrCode.stop().then(() => {
            try { html5QrCode.clear(); } catch(e) {}
          }).catch(() => {
            try { html5QrCode.clear(); } catch(e) {}
          });
        } else {
          try { html5QrCode.clear(); } catch(e) {}
        }
      }
      return;
    }
    
    if (scannerRef.current) return;

    setCameraState('initializing');
    setCameraErrorMsg('');

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode("picking-reader");
        scannerRef.current = html5QrCode;
        
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!isUnmounted) {
              const barcode = decodedText.trim();
              if (barcode) {
                processScan(barcode);
              }
            }
          },
          () => {
            // ignore constant scanning errors
          }
        );
        
        if (isUnmounted || !isScannerOpen) {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
              try { html5QrCode.clear(); } catch(e) {}
            }).catch(console.error);
          } else {
            try { html5QrCode.clear(); } catch(e) {}
          }
        } else {
          setCameraState('active');
        }
      } catch (err) {
        if (!isUnmounted) {
          setCameraState('error');
          setCameraErrorMsg('Kamera tidak dapat digunakan. Silakan izinkan akses kamera dari browser.');
        }
      }
    };

    startScanner();

    return () => {
      isUnmounted = true;
      if (scannerRef.current) {
        const html5QrCode = scannerRef.current;
        scannerRef.current = null;
        
        if (html5QrCode.isScanning) {
          html5QrCode.stop().then(() => {
            try { html5QrCode.clear(); } catch(e) {}
          }).catch(err => {
            try { html5QrCode.clear(); } catch(e) {}
          });
        } else {
          try { html5QrCode.clear(); } catch(e) {}
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrder?.deliveryNoteNo, isScannerOpen]); // Re-init based on isScannerOpen

  if (loading && !activeOrder) {
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

  const isFullyPicked = activeOrder.items.every(i => i.isPicked);
  
  const totalRequired = activeOrder.items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const totalPicked = activeOrder.items.reduce((sum, item) => sum + Number(item.pickedQty || 0), 0);
  
  const progressPercent = totalRequired > 0 ? (totalPicked / totalRequired) * 100 : 0;
  
  const filteredItems = activeOrder.items.filter(item => 
    item.itemName.toLowerCase().includes(productSearch.toLowerCase()) || 
    item.itemCode.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* HEADER SECTION */}
      <div className="header" style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="icon-btn" 
            onClick={handleBack} 
            aria-label="Kembali" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px' }}
          >
            <ChevronLeft size={24} />
          </button>
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <h1 className="text-xl" style={{ fontWeight: '700', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Mulai Picking
            </h1>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {activeOrder.deliveryNoteNo}
            </div>
          </div>
        </div>
      </div>

      {/* PROGRESS SECTION */}
      <div style={{ padding: '16px', backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Progres Picking
            </div>
            <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--accent-primary)' }}>
              Total: {totalPicked} / {totalRequired} item
            </div>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: 'var(--success-color)', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '500' }}>
          {Math.round(progressPercent)}%
        </div>
        {isFullyPicked ? (
          <div style={{ textAlign: 'center', color: 'var(--success-color)', fontSize: '14px', fontWeight: '600', marginTop: '12px' }}>
            Picking Selesai
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500', marginTop: '12px' }}>
            Scan item berikutnya
          </div>
        )}
      </div>

      {/* CAMERA SCANNER BUTTON */}
      <div style={{ padding: '16px', backgroundColor: 'var(--bg-primary)', display: 'flex', justifyContent: 'center' }}>
        <button 
          className="btn btn-primary" 
          onClick={() => setIsScannerOpen(true)}
          disabled={isFullyPicked}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '14px', fontSize: '15px' }}
        >
          <Camera size={20} />
          Scan Item dengan Kamera
        </button>
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
        {filteredItems.map((item, idx) => {
          const isCompleted = item.isPicked;
          
          return (
            <div key={`${item.itemCode}-${idx}`} style={{ 
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
                    Barcode: {item.itemCode}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Warehouse: {item.warehouse}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: isCompleted ? 'var(--success-color)' : 'var(--text-primary)' }}>
                    Picked: {item.pickedQty || 0} / {item.qty}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  {isCompleted ? (
                    <div style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      color: 'var(--success-color)',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                      marginBottom: '8px'
                    }}>
                      PICKED
                    </div>
                  ) : (
                    <div style={{
                      color: 'var(--text-secondary)',
                      padding: '4px 8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginBottom: '8px'
                    }}>
                      Belum selesai
                    </div>
                  )}
                  
                  <button 
                    onClick={() => incrementPickedQty(item.itemName || item.itemCode)}
                    disabled={isCompleted}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: isCompleted ? 'var(--bg-secondary)' : 'var(--accent-primary)',
                      color: isCompleted ? 'var(--text-muted)' : 'white',
                      border: isCompleted ? '1px solid var(--border-color)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isCompleted ? 'not-allowed' : 'pointer',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      boxShadow: isCompleted ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky-bottom" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {submitError && (
          <div style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid var(--error-color)',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <AlertCircle size={20} color="var(--error-color)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flexGrow: 1 }}>
              <div style={{ color: 'var(--error-color)', fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                Gagal menyimpan Delivery Note.
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Silakan coba lagi.
              </div>
            </div>
          </div>
        )}



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
              Menyimpan...
            </>
          ) : submitError ? (
            'Coba Lagi'
          ) : !isFullyPicked ? (
            'Selesaikan jumlah barang terlebih dahulu'
          ) : (
            'Selesai Picking'
          )}
        </button>
      </div>

      {/* MODAL SCANNER */}
      {isScannerOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, 
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Scan Barcode</h2>
              <button 
                onClick={() => setIsScannerOpen(false)}
                style={{ background: 'none', border: 'none', color: 'white', display: 'flex', padding: '8px', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ position: 'relative', width: '100%', aspectRatio: '1', backgroundColor: '#111', borderRadius: '12px', overflow: 'hidden' }}>
              {cameraState === 'initializing' && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 10 }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '14px' }}>Menyiapkan kamera...</span>
                </div>
              )}
              {cameraState === 'error' && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#ef4444', textAlign: 'center', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 10 }}>
                  <CameraOff size={32} />
                  <span style={{ fontSize: '14px' }}>{cameraErrorMsg}</span>
                </div>
              )}
              <div 
                id="picking-reader" 
                ref={scannerContainerRef}
                style={{ 
                  width: '100%', height: '100%',
                  opacity: cameraState === 'active' ? 1 : 0,
                  transition: 'opacity 0.3s ease'
                }}
              />
            </div>
            
            <div style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: '14px' }}>
              Arahkan kamera ke barcode pada produk.
            </div>

            <button 
              className="btn btn-secondary" 
              onClick={() => setIsScannerOpen(false)}
              style={{ width: '100%', padding: '14px', marginTop: '8px' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Picking;
