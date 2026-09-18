import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { useAuth, useCapabilities } from '../context/AuthContext';
import { Search, Package, MapPin, Barcode, Calendar, Truck, ClipboardList, ChevronLeft, RefreshCw, Clock, UserCheck, Inbox, User, Store } from 'lucide-react';
import { resolvePickupFlow } from '../utils/pickupFlow';

const Home = () => {
  const [search, setSearch] = useState('');
  const [selectedDN, setSelectedDN] = useState(null); // Local state for Detail DN
  const [showLastPickedModal, setShowLastPickedModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Pull to refresh states
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [activeTab, setActiveTab] = useState('available');
  const [pullDistance, setPullDistance] = useState(0);
  const [scrollPos, setScrollPos] = useState(0);

  const { 
    deliveryNotes, 
    activeDeliveryNotes,
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
    await fetchDeliveryNotes(search);
    setIsRefreshing(false);
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      // Avoid fetching if search is empty on initial render, 
      // but fetchDeliveryNotes is also called in OrderContext's useEffect.
      // We can just fetch it with search.
      fetchDeliveryNotes(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search, fetchDeliveryNotes]);

  const handleSelectDN = async (dnObject) => {
    // Show skeleton or old data while loading
    setScrollPos(window.scrollY);
    setSelectedDN(dnObject);
    window.scrollTo(0, 0);
    
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
  
  const activeDNs = activeDeliveryNotes.filter(dn => 
    !dn.isPicked && dn.docstatus === 0
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
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>
            mode: {user?.roleProfile || 'Unknown'}
          </div>
        </div>
      </div>
      
      <style>{`
        .spin-animation { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>

      {!selectedDN && (
        <>
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

      <div style={{ padding: '16px 16px 0 16px', display: 'flex', gap: '12px' }}>
        {(user?.roleProfile === 'Picking' || user?.roleProfile === 'Pickup') && (
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/receive-picking')}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', fontSize: '13px', textAlign: 'center' }}
          >
            <Inbox size={24} />
            Terima Barang dari Picker
          </button>
        )}
        
        {capabilities.canPicking && (
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/history')}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', fontSize: '13px', textAlign: 'center' }}
          >
            <Clock size={24} />
            History Picking
          </button>
        )}
      </div>

      <div style={{ padding: '16px 16px 0 16px', display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', top: '12px', left: '16px', color: 'var(--text-muted)' }} size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Cari nomor SO..."
            style={{ paddingLeft: '48px', width: '100%', height: '44px', borderRadius: '12px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing || loading}
          className="btn btn-secondary"
          style={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center', 
            width: '44px',
            height: '44px',
            padding: '0',
            flexShrink: 0,
            borderRadius: '12px'
          }}
        >
          <RefreshCw size={20} className={(isRefreshing || loading) ? "spin-animation" : ""} />
        </button>
      </div>


      <div style={{ display: 'flex', padding: '16px 16px 0 16px', gap: '8px' }}>
        <div 
          onClick={() => setActiveTab('active')}
          style={{ 
            flex: 1, 
            padding: '12px', 
            borderRadius: '8px 8px 0 0', 
            borderBottom: activeTab === 'active' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            background: activeTab === 'active' ? 'var(--bg-elevated)' : 'transparent',
            color: activeTab === 'active' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}>
          <UserCheck size={18} />
          Active · {filteredActiveDNs.length}
        </div>
        <div 
          onClick={() => setActiveTab('available')}
          style={{ 
            flex: 1, 
            padding: '12px', 
            borderRadius: '8px 8px 0 0', 
            borderBottom: activeTab === 'available' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            background: activeTab === 'available' ? 'var(--bg-elevated)' : 'transparent',
            color: activeTab === 'available' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}>
          <Truck size={18} />
          Available · {filteredAvailableDNs.length}
        </div>
          </div>
        </>
      )}

      <div className="flex-col p-4 flex-grow" style={{ backgroundColor: 'var(--bg-elevated)', minHeight: '300px' }}>
        {selectedDN ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div 
              onClick={() => {
                setSelectedDN(null);
                setTimeout(() => window.scrollTo(0, scrollPos), 10);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '8px', fontWeight: '500' }}
            >
              <ChevronLeft size={20} />
              Kembali
            </div>
            
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Sales Order</div>
                <div style={{ fontWeight: '800', fontSize: '24px', color: 'var(--text-primary)' }}>{selectedDN.salesOrderNo || '-'}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '4px' }}>{selectedDN.deliveryNoteNo}</div>
              </div>
              
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '130px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Waktu Pemesanan</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    <Calendar size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '14px' }}>
                      {selectedDN.postingDate ? new Date(selectedDN.postingDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      {selectedDN.postingTime ? ` ${selectedDN.postingTime.substring(0, 5)} WIB` : ''}
                    </span>
                  </div>
                </div>
                
                <div style={{ flex: 1, minWidth: '130px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Booth</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    <Store size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', wordBreak: 'break-word' }}>{selectedDN.custom_event_pickup_option || '-'}</span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Customer</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', color: 'var(--text-primary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  <User size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  {selectedDN.customer || '-'}
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
            ) : (
              <>
                {activeTab === 'active' && filteredActiveDNs.map((dn) => (
                  <div 
                    key={dn.deliveryNoteNo} 
                    className="card" 
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid var(--accent-primary)' }}
                    onClick={async () => {
                      const success = await selectDeliveryNote(dn);
                      if (success) {
                        navigate('/picking');
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontWeight: '800', fontSize: '20px', color: 'var(--text-primary)' }}>{dn.salesOrderNo || '-'}</div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>{dn.deliveryNoteNo}</div>
                      </div>
                      <div style={{ 
                        backgroundColor: dn.pickedBy === (user?.email || user?.name) ? 'var(--accent-primary)' : 'var(--warning-color, #f59e0b)', 
                        color: dn.pickedBy === (user?.email || user?.name) ? 'white' : 'white',
                        padding: '6px 10px', 
                        borderRadius: '12px', 
                        fontSize: '12px', 
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Package size={14} />
                        {dn.pickedBy === (user?.email || user?.name) ? 'Sedang Anda Pick' : 'Sedang Di-pick'}
                      </div>
                    </div>
                    
                    {dn.customer && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '14px', color: 'var(--text-primary)' }}>
                        <User size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontWeight: '500', wordBreak: 'break-word' }}>{dn.customer}</span>
                      </div>
                    )}

                    {dn.pickedBy && dn.pickedBy !== (user?.email || user?.name) && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        <UserCheck size={16} color="var(--warning-color, #f59e0b)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontWeight: '500', wordBreak: 'break-word', color: 'var(--warning-color, #f59e0b)' }}>Picker: {dn.pickedBy}</span>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {dn.items?.length || 0} Produk
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          ({dn.items?.reduce((total, item) => total + Number(item.qty || 0), 0) || 0} pcs)
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', backgroundColor: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: '8px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Ambil barang di:</span>
                        <span style={{ fontWeight: '700', color: 'var(--primary-color)' }}>{dn.custom_event_pickup_option || '-'}</span>
                        {dn.custom_event_booth && (
                          <>
                            <span style={{ color: 'var(--text-muted)' }}>•</span>
                            <span style={{ color: 'var(--text-secondary)' }}>Booth:</span>
                            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{dn.custom_event_booth}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {dn.postingDate ? new Date(dn.postingDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                        {dn.postingTime ? ` ${dn.postingTime.substring(0, 5)} WIB` : ''}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                        Detail
                      </div>
                    </div>
                  </div>
                ))}
                
                {activeTab === 'available' && filteredAvailableDNs.map((dn) => (
                  <div 
                    key={dn.deliveryNoteNo} 
                    className="card" 
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}
                    onClick={() => handleSelectDN(dn)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontWeight: '800', fontSize: '20px', color: 'var(--text-primary)' }}>{dn.salesOrderNo || '-'}</div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>{dn.deliveryNoteNo}</div>
                      </div>
                      <div style={{ 
                        backgroundColor: 'var(--bg-secondary)', 
                        color: 'var(--text-primary)',
                        padding: '6px 10px', 
                        borderRadius: '12px', 
                        fontSize: '12px', 
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Package size={14} />
                        Siap Di-pick
                      </div>
                    </div>
                    
                    {dn.customer && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '14px', color: 'var(--text-primary)' }}>
                        <User size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontWeight: '500', wordBreak: 'break-word' }}>{dn.customer}</span>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {dn.items?.length || 0} Produk
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          ({dn.items?.reduce((total, item) => total + Number(item.qty || 0), 0) || 0} pcs)
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', backgroundColor: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: '8px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Ambil barang di:</span>
                        <span style={{ fontWeight: '700', color: 'var(--primary-color)' }}>{dn.custom_event_pickup_option || '-'}</span>
                        {dn.custom_event_booth && (
                          <>
                            <span style={{ color: 'var(--text-muted)' }}>•</span>
                            <span style={{ color: 'var(--text-secondary)' }}>Booth:</span>
                            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{dn.custom_event_booth}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {dn.postingDate ? new Date(dn.postingDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                        {dn.postingTime ? ` ${dn.postingTime.substring(0, 5)} WIB` : ''}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                        Detail
                      </div>
                    </div>
                  </div>
                ))}
                
                {((activeTab === 'active' && filteredActiveDNs.length === 0) || (activeTab === 'available' && filteredAvailableDNs.length === 0)) && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                    <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <p>Tidak ada Delivery Note siap picking</p>
                    {search && <p style={{ fontSize: '13px', marginTop: '8px' }}>Coba ubah kata kunci pencarian</p>}
                  </div>
                )}
              </>
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
