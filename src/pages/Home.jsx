import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { useAuth, useCapabilities } from '../context/AuthContext';
import { Search, Package, MapPin, Barcode, Calendar, Truck, ClipboardList, ChevronLeft, RefreshCw, Clock, UserCheck, Inbox } from 'lucide-react';
import { resolvePickupFlow } from '../utils/pickupFlow';

const Home = () => {
  const [search, setSearch] = useState('');
  const [selectedDN, setSelectedDN] = useState(null); // Local state for Detail DN
  const [showLastPickedModal, setShowLastPickedModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Pull to refresh states
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const { 
    deliveryNotes, 
    selectDeliveryNote, 
    loadDeliveryNoteDetail, 
    loading, 
    dnError, 
    fetchDeliveryNotes, 
    lastPickedOrder, 
    setLastPickedOrder,
    activePickingId,
    resumePicking
  } = useOrders();
  const { user } = useAuth();
  const capabilities = useCapabilities();
  const navigate = useNavigate();
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await fetchDeliveryNotes();
    setIsRefreshing(false);
  };

  const handleSelectDN = async (dnObject) => {
    // Show skeleton or old data while loading
    setSelectedDN(dnObject);
    setLoadingDetail(true);
    const detail = await loadDeliveryNoteDetail(dnObject.deliveryNoteNo);
    if (detail) {
      setSelectedDN({ ...dnObject, ...detail });
    }
    setLoadingDetail(false);
  };

  const handleResumePicking = async () => {
    if (!activePickingId) return;
    const success = await resumePicking(activePickingId);
    if (success) {
      navigate('/picking');
    }
  };

  const availableDNs = deliveryNotes.filter(dn => 
    !dn.pickedBy && !dn.isPicked && dn.docstatus === 0
  );
  
  const activeDNs = deliveryNotes.filter(dn => 
    dn.pickedBy === (user?.email || user?.name) && !dn.isPicked && dn.docstatus === 0
  );

  const filterFn = dn => 
    dn.deliveryNoteNo.toLowerCase().includes(search.toLowerCase()) ||
    (dn.salesOrderNo && dn.salesOrderNo.toLowerCase().includes(search.toLowerCase())) ||
    (dn.customer && dn.customer.toLowerCase().includes(search.toLowerCase()));

  const filteredAvailableDNs = availableDNs.filter(filterFn);
  const filteredActiveDNs = activeDNs.filter(filterFn);

  // Touch handlers for pull to refresh
  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (startY === 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;
    
    if (distance > 0 && window.scrollY === 0) {
      setIsPulling(true);
      setPullDistance(Math.min(distance * 0.4, 80)); // Add resistance and cap at 80px
      if (e.cancelable) e.preventDefault(); // Prevent native overscroll
    }
  };

  const handleTouchEnd = () => {
    if (isPulling) {
      if (pullDistance > 50) {
        handleRefresh();
      }
      setIsPulling(false);
      setPullDistance(0);
      setStartY(0);
    }
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      {isPulling && (
        <div style={{
          height: `${pullDistance}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          transition: isPulling ? 'none' : 'height 0.3s ease',
          backgroundColor: 'var(--bg-primary)'
        }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} style={{ transform: `rotate(${pullDistance * 2}deg)` }} />
            {pullDistance > 50 ? 'Lepaskan untuk memperbarui' : 'Tarik untuk memperbarui'}
          </div>
        </div>
      )}


      
      <div className="header" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="text-xl">Murni-Booth</h1>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--accent-primary)',
              fontWeight: '600',
              fontSize: '14px',
              padding: '4px 8px',
              cursor: (isRefreshing || loading) ? 'not-allowed' : 'pointer',
              opacity: (isRefreshing || loading) ? 0.7 : 1
            }}
          >
            <RefreshCw size={16} className={(isRefreshing || loading) ? "spin-animation" : ""} />
            {(isRefreshing || loading) ? 'Memperbarui...' : 'Refresh'}
          </button>
        </div>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', top: '16px', left: '16px', color: 'var(--text-muted)' }} size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Cari Nomor Pesanan/DN/Customer..."
            style={{ paddingLeft: '48px', width: '100%' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      <style>{`
        .spin-animation { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>

      {capabilities.canCustomerPickup && (
        <div style={{ padding: '16px 16px 0 16px' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/pickup')}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            <Barcode size={20} />
            Scan Barcode Pickup Pelanggan
          </button>
        </div>
      )}

      {(user?.roleProfile === 'Picking' || user?.roleProfile === 'Pickup') && (
        <div style={{ padding: '16px 16px 0 16px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/receive-picking')}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            <Inbox size={20} />
            Terima Barang dari Picker
          </button>
        </div>
      )}

      {capabilities.canPicking && (
        <>
          <div style={{ padding: '12px 16px 0 16px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => navigate('/history')}
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              <Clock size={20} />
              Riwayat Picking
            </button>
          </div>

          {/* Resume Picking Banner */}
          {activePickingId && (
            <div style={{
              margin: '16px 16px 0',
              padding: '16px',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: '12px',
              border: '1px solid var(--accent-primary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06)'
            }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '4px' }}>
                  Picking Aktif
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {activePickingId}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Masih ada proses picking yang belum selesai.
                </div>
              </div>
              <button 
                onClick={handleResumePicking}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                Lanjut Picking
              </button>
            </div>
          )}
        </>
      )}

      {lastPickedOrder && (
        <div style={{ padding: '16px 16px 0 16px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            backgroundColor: 'var(--bg-elevated)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '8px',
            padding: '12px'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Picking Terakhir</div>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{lastPickedOrder.name}</div>
            </div>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '14px' }}
              onClick={() => setShowLastPickedModal(true)}
            >
              Lihat
            </button>
          </div>
        </div>
      )}

      {showLastPickedModal && lastPickedOrder && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '360px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', textAlign: 'center' }}>Picking Terakhir</h3>
            
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Sales Order</div>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{lastPickedOrder.name}</div>
            </div>
            
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Customer</div>
              <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{lastPickedOrder.customer || '-'}</div>
            </div>

            {(() => {
              const flow = resolvePickupFlow(lastPickedOrder);
              if (flow === 'UNKNOWN') {
                return (
                  <div style={{ marginTop: '8px', border: '2px solid var(--error-color)', padding: '16px', borderRadius: '8px', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                    <p style={{ color: 'var(--error-color)', fontSize: '14px', margin: 0, fontWeight: '600' }}>Metode Pickup Tidak Dikenali</p>
                  </div>
                );
              }
              if (flow === 'BOOTH') {
                return (
                  <div style={{ marginTop: '8px', border: '2px solid var(--border-color)', padding: '16px', borderRadius: '8px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)' }}>
                    <p className="text-secondary" style={{ fontSize: '14px', marginBottom: '8px' }}>PICKUP CODE</p>
                    {lastPickedOrder.pickupCode ? (
                      <>
                        <h1 style={{ fontSize: '32px', margin: '0 0 12px 0', color: 'var(--text-primary)', letterSpacing: '2px' }}>{lastPickedOrder.pickupCode}</h1>
                        <p className="text-secondary" style={{ fontSize: '14px', margin: 0 }}>Tulis kode ini pada paper bag.</p>
                      </>
                    ) : (
                      <p className="text-secondary" style={{ fontSize: '14px', margin: 0, color: 'var(--error-color)' }}>Pickup code belum tersedia.</p>
                    )}
                  </div>
                );
              }
              return null;
            })()}
            
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowLastPickedModal(false)}
              style={{ marginTop: '8px' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', padding: '16px 16px 0 16px', gap: '8px' }}>
        <div 
          style={{ 
            flex: 1, 
            padding: '12px', 
            borderRadius: '8px 8px 0 0', 
            borderBottom: filteredActiveDNs.length > 0 ? '2px solid var(--accent-primary)' : '2px solid transparent',
            background: filteredActiveDNs.length > 0 ? 'var(--bg-elevated)' : 'transparent',
            color: filteredActiveDNs.length > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
          }}>
          <UserCheck size={18} />
          Active · {filteredActiveDNs.length}
        </div>
        <div 
          style={{ 
            flex: 1, 
            padding: '12px', 
            borderRadius: '8px 8px 0 0', 
            borderBottom: filteredActiveDNs.length === 0 ? '2px solid var(--accent-primary)' : '2px solid transparent',
            background: filteredActiveDNs.length === 0 ? 'var(--bg-elevated)' : 'transparent',
            color: filteredActiveDNs.length === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
          }}>
          <Truck size={18} />
          Available · {filteredAvailableDNs.length}
        </div>
      </div>

      <div className="flex-col p-4 flex-grow" style={{ backgroundColor: 'var(--bg-elevated)', minHeight: '300px' }}>
        {selectedDN ? (
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
                
                {loadingDetail ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ width: '24px', height: '24px', margin: '0 auto', borderRadius: '50%', border: '2px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : (
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
                            }}>
                              {item.itemName || item.itemCode}
                            </div>
                            {item.itemName && item.itemName !== item.itemCode && (
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {item.itemCode}
                              </div>
                            )}
                          </div>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)', flexShrink: 0 }}>
                            {item.qty}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Tidak ada data barang
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ padding: '16px', fontSize: '16px', marginTop: '8px' }}
              onClick={async () => {
                const success = await selectDeliveryNote(selectedDN);
                if (success) {
                  navigate('/picking');
                }
              }}
            >
              Mulai Picking
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : dnError ? (
              <div style={{ textAlign: 'center', color: 'var(--error-color)', padding: '24px' }}>
                <p>{dnError}</p>
                <button 
                  onClick={handleRefresh}
                  className="btn btn-secondary" 
                  style={{ marginTop: '12px' }}
                >
                  Coba Lagi
                </button>
              </div>
            ) : (filteredActiveDNs.length > 0 || filteredAvailableDNs.length > 0) ? (
              <>
                {filteredActiveDNs.map((dn) => (
                  <div 
                    key={dn.deliveryNoteNo} 
                    className="card" 
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid var(--accent-primary)' }}
                    onClick={() => handleSelectDN(dn)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="text-lg" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{dn.deliveryNoteNo}</span>
                        {dn.salesOrderNo && (
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ClipboardList size={14} />
                            {dn.salesOrderNo}
                          </span>
                        )}
                      </div>
                      <div style={{ 
                        backgroundColor: 'var(--accent-primary)', 
                        color: 'white',
                        padding: '4px 10px', 
                        borderRadius: '16px', 
                        fontSize: '12px', 
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Package size={14} />
                        {dn.items?.reduce((total, item) => total + Number(item.qty || 0), 0) || 0}
                      </div>
                    </div>
                    
                    {dn.customer && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px' }}>
                        <MapPin size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontWeight: '500', wordBreak: 'break-word' }}>{dn.customer}</span>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: '600' }}>
                        Sedang Anda Pick
                      </div>
                      <div style={{ color: 'var(--accent-primary)', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                        Lanjutkan
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredAvailableDNs.map((dn) => (
                  <div 
                    key={dn.deliveryNoteNo} 
                    className="card" 
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}
                    onClick={() => handleSelectDN(dn)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="text-lg" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{dn.deliveryNoteNo}</span>
                        {dn.salesOrderNo && (
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ClipboardList size={14} />
                            {dn.salesOrderNo}
                          </span>
                        )}
                      </div>
                      <div style={{ 
                        backgroundColor: 'var(--bg-secondary)', 
                        color: 'var(--text-primary)',
                        padding: '4px 10px', 
                        borderRadius: '16px', 
                        fontSize: '12px', 
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Package size={14} />
                        {dn.items?.reduce((total, item) => total + Number(item.qty || 0), 0) || 0}
                      </div>
                    </div>
                    
                    {dn.customer && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px' }}>
                        <MapPin size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontWeight: '500', wordBreak: 'break-word' }}>{dn.customer}</span>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {dn.postingDate ? new Date(dn.postingDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                        Detail
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>Tidak ada Delivery Note siap picking</p>
                {search && <p style={{ fontSize: '13px', marginTop: '8px' }}>Coba ubah kata kunci pencarian</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {!capabilities.canPicking && (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>Anda login sebagai role Pickup. Silakan gunakan menu di atas.</p>
        </div>
      )}
    </div>
  );
};

export default Home;
