import React, { useState } from 'react';

const ManualPickupCode = ({ onSubmit, onCancel }) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(cleanCode);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2 className="text-lg">Masukkan Kode Pickup</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input 
          type="text"
          className="search-input"
          placeholder="MURNI-XXXXXX"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={isSubmitting}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }} disabled={isSubmitting}>
            Batal
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} disabled={!code.trim() || isSubmitting}>
            {isSubmitting ? (
              <>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 1s linear infinite' }} />
                Mengecek...
              </>
            ) : (
              'Cek Kode'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualPickupCode;
