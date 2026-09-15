import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { Search, Package, MapPin, QrCode, Calendar, Truck, ClipboardList, ChevronLeft } from 'lucide-react';

const parseItemsSummary = (summary) => {
  if (!summary) return [];
  const results = [];
  const regex = /(.*?)\s*\((\d+)\)(?:,\s*|$)/g;
  let match;
  let hasMatches = false;
  
  while ((match = regex.exec(summary)) !== null) {
    hasMatches = true;
    results.push({
      name: match[1].trim(),
      qty: parseInt(match[2], 10)
    });
  }
  
  if (!hasMatches && summary.trim().length > 0) {
    return summary.split(',').map(s => ({ name: s.trim(), qty: '-' }));
  }
  return results;
};

const Home = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'dn'
  const [selectedSO, setSelectedSO] = useState(null); // Local state for Detail SO
  const [selectedDN, setSelectedDN] = useState(null); // Local state for Detail DN
  const { orders, deliveryNotes, createDN, selectDeliveryNote, loading, ordersError, dnError, fetchOrders, fetchDeliveryNotes } = useOrders();
  const navigate = useNavigate();

  const handleCreateDN = async (orderNumber) => {
    const success = await createDN(orderNumber);
    if (success) {
      setSelectedSO(null);
      setActiveTab('dn'); // Switch to delivery note list after success
    }
  };

  const handleSelectDN = (dnObject) => {
    setSelectedDN(dnObject);
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
          onClick={() => { setActiveTab('pending'); setSelectedSO(null); setSelectedDN(null); }}
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
          onClick={() => { setActiveTab('dn'); setSelectedSO(null); setSelectedDN(null); }}
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
        {selectedSO ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div 
              onClick={() => setSelectedSO(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '8px', fontWeight: '500' }}
            >
              <ChevronLeft size={20} />
              Kembali ke Antrean
            </div>
            
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Sales Order</div>
                <div className="text-xl" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{selectedSO.orderNumber}</div>
              </div>
              
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Pelanggan</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', color: 'var(--text-primary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  <MapPin size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  {selectedSO.customerInfo?.name || '-'}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tanggal Pesanan</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  <Calendar size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  {selectedSO.transactionDate ? new Date(selectedSO.transactionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Barang</div>
                
                <div style={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '12px', 
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-secondary)'
                  }}>
                    <div>NAMA BARANG</div>
                    <div>QTY</div>
                  </div>
                  
                  {parseItemsSummary(selectedSO.itemsSummary).length > 0 ? (
                    parseItemsSummary(selectedSO.itemsSummary).map((item, idx, arr) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        padding: '12px', 
                        borderBottom: idx < arr.length - 1 ? '1px solid var(--border-color)' : 'none',
                        fontSize: '14px',
                        gap: '12px'
                      }}>
                        <div style={{ 
                          fontWeight: '500', 
                          color: 'var(--text-primary)', 
                          wordBreak: 'break-word', 
                          overflowWrap: 'anywhere',
                          lineHeight: '1.4'
                        }}>
                          {item.name}
                        </div>
                        <div style={{ 
                          fontWeight: '600', 
                          color: 'var(--text-primary)',
                          flexShrink: 0
                        }}>
                          {item.qty}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '16px 12px', fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      Detail barang belum tersedia.
                    </div>
                  )}
                  
                  {selectedSO.totalItems && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '12px', 
                      borderTop: '2px solid var(--border-color)',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-secondary)'
                    }}>
                      <div>Total Barang</div>
                      <div>{selectedSO.totalItems}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ padding: '8px 4px', color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>
              Sales Order ini akan dibuat menjadi Delivery Note sebelum barang bisa dipicking.
            </div>

            <button 
              className="btn btn-primary"
              disabled={loading}
              onClick={() => handleCreateDN(selectedSO.orderNumber)}
              style={{ width: '100%', padding: '16px', fontSize: '16px' }}
            >
              {loading ? 'Membuat Delivery Note...' : 'Buat Delivery Note'}
            </button>
          </div>
        ) : selectedDN ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div 
              onClick={() => setSelectedDN(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '8px', fontWeight: '500' }}
            >
              <ChevronLeft size={20} />
              Kembali
            </div>
            
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Delivery Note</div>
                <div className="text-xl" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{selectedDN.deliveryNoteNo}</div>
              </div>
              
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Sales Order</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', color: 'var(--text-primary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  <ClipboardList size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  {selectedDN.salesOrderNo || '-'}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Customer</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', color: 'var(--text-primary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  <MapPin size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  {selectedDN.customer || '-'}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tanggal</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  <Calendar size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  {selectedDN.postingDate ? new Date(selectedDN.postingDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {selectedDN.status || '-'}
                </div>
              </div>

              {selectedDN.poNo && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>PO</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    {selectedDN.poNo}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Barang</div>
                
                <div style={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '12px', 
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-secondary)'
                  }}>
                    <div>NAMA BARANG</div>
                    <div>QTY</div>
                  </div>
                  
                  {selectedDN.items && selectedDN.items.length > 0 ? (
                    selectedDN.items.map((item, idx, arr) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        padding: '12px', 
                        borderBottom: idx < arr.length - 1 ? '1px solid var(--border-color)' : 'none',
                        fontSize: '14px',
                        gap: '12px'
                      }}>
                        <div style={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          minWidth: 0
                        }}>
                          <div style={{ 
                            fontWeight: '500', 
                            color: 'var(--text-primary)', 
                            wordBreak: 'break-word', 
                            overflowWrap: 'anywhere',
                            lineHeight: '1.4'
                          }}>
                            {item.itemName || item.itemCode}
                          </div>
                          {(item.itemCode || item.warehouse) && (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {item.itemCode}{item.itemCode && item.warehouse ? ' • ' : ''}{item.warehouse}
                            </div>
                          )}
                        </div>
                        <div style={{ 
                          fontWeight: '600', 
                          color: 'var(--text-primary)',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          {item.orderedQty}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '16px 12px', fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      Delivery Note tidak memiliki barang.
                    </div>
                  )}
                  
                  {selectedDN.items && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '12px', 
                      borderTop: '2px solid var(--border-color)',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-secondary)'
                    }}>
                      <div>Total Barang</div>
                      <div>{selectedDN.items.reduce((sum, i) => sum + (i.orderedQty || 0), 0)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ padding: '8px 4px', color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>
              Periksa barang dan jumlah sebelum mulai picking.
            </div>

            <button 
              className="btn btn-primary"
              onClick={() => {
                selectDeliveryNote(selectedDN);
                navigate('/picking');
              }}
              style={{ width: '100%', padding: '16px', fontSize: '16px' }}
            >
              Mulai Picking
            </button>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : activeTab === 'pending' ? (
          <>
            {ordersError ? (
              <div className="card text-center text-danger" style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Gagal Memuat Antrean</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{ordersError}</p>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={() => fetchOrders()}
                  style={{ padding: '8px 24px', fontSize: '14px' }}
                >
                  Coba Lagi
                </button>
              </div>
            ) : (
              <>
              <div style={{ padding: '0 4px 16px 4px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Ada {filteredOrders.length} pesanan baru. Tekan tombol <strong>Buat Delivery Note</strong> untuk memproses pesanan.
              </div>
            {filteredOrders.length === 0 ? (
              <div className="card text-center text-muted" style={{ padding: '32px 16px' }}>
                <ClipboardList size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
                <p style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>Antrean Kosong</p>
                <p style={{ fontSize: '14px' }}>Saat ini belum ada antrean pesanan baru yang masuk.</p>
              </div>
            ) : (
            filteredOrders.map(order => (
              <div 
                key={order.orderNumber} 
                className="card" 
                onClick={() => setSelectedSO(order)}
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
                    color: 'var(--accent-primary)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)'
                  }}>
                    Lihat Detail
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
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flex: 1 }}>
                    <Package size={14} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, display: 'block', flex: 1 }}>
                      {order.totalItems} Items — {order.itemsSummary}
                    </span>
                  </div>
                </div>
              </div>
            ))
            )}
              </>
            )}
          </>
        ) : (
          <>
            {dnError ? (
              <div className="card text-center text-danger" style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Gagal Memuat Delivery Note</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{dnError}</p>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={() => fetchDeliveryNotes()}
                  style={{ padding: '8px 24px', fontSize: '14px' }}
                >
                  Coba Lagi
                </button>
              </div>
            ) : (
              <>
            <div style={{ padding: '0 4px 16px 4px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Ada {filteredDNs.length} pesanan siap diproses. Pilih pesanan dan tekan <strong>Mulai Picking</strong> untuk mengambil barang.
            </div>
            {filteredDNs.length === 0 ? (
              <div className="card text-center text-muted" style={{ padding: '32px 16px' }}>
                <Truck size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
                <p style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>Tidak Ada Pekerjaan</p>
                <p style={{ fontSize: '14px' }}>Belum ada Delivery Note yang siap di-picking. Buat Delivery Note dari Antrean SO terlebih dahulu.</p>
              </div>
            ) : (
            filteredDNs.map(dn => (
              <div 
                key={dn.deliveryNoteNo} 
                className="card" 
                onClick={() => handleSelectDN(dn)}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minWidth: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <span className="text-lg" style={{ marginBottom: '4px' }}>{dn.deliveryNoteNo}</span>
                    {dn.customer && (
                      <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
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
                  color: 'var(--accent-primary)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  textAlign: 'center',
                  transition: 'background-color var(--transition-fast)'
                }}>
                  Lihat Detail
                </div>
              </div>
            ))
            )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
