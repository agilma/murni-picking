import React, { useState } from 'react';

const ManualPickupCode = ({ onSubmit, onCancel }) => {
  const [code, setCode] = useState('MURNI-PICKUP:VALID-001');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.trim()) {
      onSubmit(code.trim());
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
          autoFocus
        />
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
            Batal
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={!code.trim()}>
            Cek Kode
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualPickupCode;
