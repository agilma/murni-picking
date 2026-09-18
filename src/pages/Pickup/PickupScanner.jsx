import React, { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

const PickupScanner = ({ onScanSuccess, onClose, onError }) => {

  useEffect(() => {
    let html5QrCode;
    let isUnmounted = false;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("pickup-reader");
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!isUnmounted) {
              onScanSuccess(decodedText);
            }
          },
          () => {
            // ignore constant scanning errors
          }
        );
      } catch {
        if (!isUnmounted && onError) {
          onError("Kamera Tidak Dapat Diakses");
        }
      }
    };

    startScanner();

    return () => {
      isUnmounted = true;
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
        }).catch(err => {
          console.error("Failed to stop scanner", err);
        });
      }
    };
  }, [onScanSuccess, onError]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '320px', margin: '0 auto' }}>
      <div 
        id="pickup-reader" 
        style={{ 
          width: '100%', 
          aspectRatio: '1', 
          backgroundColor: '#000', 
          borderRadius: 'var(--radius-lg)', 
          overflow: 'hidden',
          marginBottom: '24px'
        }}
      ></div>
      <p className="text-secondary mb-4" style={{ textAlign: 'center', marginBottom: '24px' }}>
        Arahkan kamera ke Barcode pickup
      </p>
      <button className="btn btn-secondary" onClick={onClose} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
        <X size={20} /> Tutup Scanner
      </button>
    </div>
  );
};

export default PickupScanner;
