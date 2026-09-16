import React from 'react';

const PickupOrderCard = ({ order, onConfirm, onCancel, isConfirming }) => {
  if (!order) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="flex-grow flex-col p-4" style={{ gap: '24px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--success-color)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <h2 className="text-lg" style={{ color: 'var(--text-primary)' }}>Pesanan Ditemukan</h2>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <div className="text-muted" style={{ fontSize: '14px', marginBottom: '4px' }}>Order</div>
            <div className="text-lg">{order.orderId}</div>
            <div className="text-secondary" style={{ fontSize: '14px', marginTop: '4px' }}>{order.customerName}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {order.items.map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '500' }}>{item.name}</span>
                  <span className="text-secondary" style={{ fontSize: '14px' }}>{item.quantity} × Rp {item.price.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '600' }}>Total</span>
            <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>Rp {order.total.toLocaleString('id-ID')}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <span className="text-secondary">Status</span>
            <span style={{ 
              padding: '4px 8px', 
              borderRadius: '4px', 
              backgroundColor: 'var(--success-bg)', 
              color: 'var(--success-color)', 
              fontSize: '14px',
              fontWeight: '500' 
            }}>
              Siap Diambil
            </span>
          </div>
        </div>
      </div>

      <div className="sticky-bottom" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button className="btn btn-primary" onClick={onConfirm} disabled={isConfirming}>
          {isConfirming ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 1s linear infinite' }} />
              Memproses...
            </div>
          ) : 'PICK UP'}
        </button>
        <button className="btn btn-secondary" onClick={onCancel} style={{ border: 'none', background: 'transparent' }} disabled={isConfirming}>
          Batal
        </button>
      </div>
    </div>
  );
};

export default PickupOrderCard;
