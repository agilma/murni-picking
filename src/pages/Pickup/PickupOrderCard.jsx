import React from 'react';

const PickupOrderCard = ({ order, onConfirm, onCancel, isConfirming }) => {
  if (!order) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px 16px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', marginTop: '8px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success-color)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <div>
          <h2 className="text-xl" style={{ color: 'var(--text-primary)', fontWeight: '800', marginBottom: '4px' }}>Pesanan Ditemukan</h2>
          <p className="text-secondary" style={{ fontSize: '14px' }}>Silakan serahkan pesanan kepada pelanggan.</p>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Nomor Order</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>{order.orderId}</div>
          </div>
          <div style={{ 
            padding: '6px 12px', 
            borderRadius: '16px', 
            backgroundColor: 'var(--success-bg)', 
            color: 'var(--success-color)', 
            fontSize: '13px',
            fontWeight: '700' 
          }}>
            Siap Diambil
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '4px' }}>Nama Pelanggan</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{order.customerName}</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '4px' }}>Kode Pickup</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{order.pickupCode || '-'}</div>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '4px' }}>Lokasi Pengambilan</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {order.custom_event_pickup_option || '-'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Daftar Barang</div>
          {order.items.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.4' }}>{item.name}</span>
              </div>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '6px' }}>x{item.quantity}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Total Barang</span>
          <span style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text-primary)' }}>{order.items.length} Jenis ({order.totalQty} pcs)</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
        <button 
          className="btn btn-primary" 
          onClick={onConfirm} 
          disabled={isConfirming}
          style={{ padding: '16px', fontSize: '16px', fontWeight: '700' }}
        >
          {isConfirming ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 1s linear infinite' }} />
              Memproses...
            </div>
          ) : 'Selesaikan Pickup'}
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={onCancel} 
          disabled={isConfirming}
          style={{ padding: '14px', fontSize: '15px', fontWeight: '600' }}
        >
          Kembali
        </button>
      </div>
    </div>
  );
};

export default PickupOrderCard;
