import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { Search, Package, MapPin, QrCode, Calendar, Truck, ClipboardList } from 'lucide-react';

const Home = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'dn'
  const { orders, deliveryNotes, createDN, selectDeliveryNote, loading, errorState } = useOrders();
  const navigate = useNavigate();

  const handleCreateDN = async (orderNumber) => {
    const success = await createDN(orderNumber);
    if (success) {
      setActiveTab('dn'); // Switch to delivery note list after success
    }
  };

  const handleSelectDN = (dnObject) => {
    selectDeliveryNote(dnObject);
    navigate('/picking');
  };

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDNs = deliveryNotes.filter(dn => 
    dn.deliveryNoteNo.toLowerCase().includes(search.toLowerCase()) ||
    (dn.salesOrderNo && dn.salesOrderNo.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="header">
        <h1 className="text-xl">Murni-Booth</h1>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', top: '16px', left: '16px', color: 'var(--text-muted)' }} size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Cari Nomor Pesanan/DN..."
            style={{ paddingLeft: '48px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ padding: '16px 16px 0 16px' }}>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/pickup')}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <QrCode size={20} />
          Scan QR Pickup Pelanggan
        </button>
      </div>

      <div style={{ display: 'flex', padding: '16px 16px 0 16px', gap: '8px' }}>
        <button 
          onClick={() => setActiveTab('pending')}
          style={{ 
            flex: 1, 
            padding: '12px', 
            borderRadius: '8px 8px 0 0', 
            borderBottom: activeTab === 'pending' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            background: activeTab === 'pending' ? 'var(--bg-elevated)' : 'transparent',
            color: activeTab === 'pending' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'pending' ? 'bold' : 'normal',
            border: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
          }}>
          <ClipboardList size={18} />
          Antrean SO · {filteredOrders.length}
        </button>
        <button 
          onClick={() => setActiveTab('dn')}
          style={{ 
            flex: 1, 
            padding: '12px', 
            borderRadius: '8px 8px 0 0', 
            borderBottom: activeTab === 'dn' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            background: activeTab === 'dn' ? 'var(--bg-elevated)' : 'transparent',
            color: activeTab === 'dn' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'dn' ? 'bold' : 'normal',
            border: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
          }}>
          <Truck size={18} />
          Siap Picking · {filteredDNs.length}
        </button>
      </div>

      <div className="flex-col p-4" style={{ backgroundColor: 'var(--bg-elevated)', minHeight: '300px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : errorState ? (
          <div className="card text-center text-danger" style={{ color: 'var(--error-color)' }}>
            <p>{errorState}</p>
          </div>
        ) : activeTab === 'pending' ? (
          filteredOrders.length === 0 ? (
            <div className="card text-center text-muted">
              <p>Belum ada antrean pesanan baru.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div 
                key={order.orderNumber} 
                className="card" 
                onClick={() => handleCreateDN(order.orderNumber)}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="text-lg" style={{ marginBottom: '4px' }}>{order.orderNumber}</div>
                    {order.customerInfo?.name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                        <MapPin size={16} />
                        <span style={{ fontWeight: '500' }}>{order.customerInfo.name}</span>
                      </div>
                    )}
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    fontWeight: '600',
                    backgroundColor: 'var(--accent-gradient)',
                    background: 'var(--accent-gradient)',
                    color: 'white',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    Buat Delivery Note
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '13px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  {order.transactionDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} />
                      <span>
                        {new Date(order.transactionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Package size={14} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {order.totalItems} Items — {order.itemsSummary}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          filteredDNs.length === 0 ? (
            <div className="card text-center text-muted">
              <p>Belum ada Delivery Note yang siap dipicking.</p>
            </div>
          ) : (
            filteredDNs.map(dn => (
              <div 
                key={dn.deliveryNoteNo} 
                className="card" 
                onClick={() => handleSelectDN(dn)}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="text-lg" style={{ marginBottom: '4px' }}>{dn.deliveryNoteNo}</span>
                    {dn.customer && (
                      <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        {dn.customer}
                      </span>
                    )}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '13px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ClipboardList size={14} />
                    <span>SO: {dn.salesOrderNo}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Package size={14} />
                    <span>
                      {dn.items.length} Items ({dn.items.reduce((acc, curr) => acc + curr.orderedQty, 0)} total qty)
                    </span>
                  </div>
                </div>

                <div style={{
                  marginTop: '4px',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--accent-primary)',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center',
                  transition: 'background-color var(--transition-fast)'
                }}>
                  Mulai Picking
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default Home;
