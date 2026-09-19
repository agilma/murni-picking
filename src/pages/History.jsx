import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, RefreshCw, Search, User, UserCheck, Store, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchHistoryDeliveryNotes } from '../api/picking';

const History = () => {
  const navigate = useNavigate();
  const { user, selectedBooth } = useAuth();
  
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const searchTimeoutRef = useRef(null);
  const limit = 20;

  const fetchHistory = useCallback(async (isLoadMore = false, searchQuery = search) => {
    if (!user || !user.username) {
      setError('User session not available');
      setLoading(false);
      return;
    }

    const currentOffset = isLoadMore ? offset : 0;
    
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const page = Math.floor(currentOffset / limit) + 1;
      const rawData = await fetchHistoryDeliveryNotes(searchQuery, page, limit, selectedBooth?.name, user.username);
      
      const data = rawData.map(item => ({
        ...item,
        isPicked: item.custom_event_is_picked === 1,
        salesOrderNo: item.items && item.items.length > 0 ? item.items[0].against_sales_order : null,
        pickedBy: item.custom_picked_by
      }));
      
      if (isLoadMore) {
        setHistoryItems(prev => [...prev, ...data]);
      } else {
        setHistoryItems(data);
      }
      
      // If we got fewer items than requested, we've reached the end
      setHasMore(data.length === limit);
      setOffset(currentOffset + data.length);
    } catch (err) {
      console.error("Failed to fetch history:", err);
      if (!isLoadMore) {
        setError('Riwayat tidak dapat dimuat');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, limit, offset, search, selectedBooth]);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      // Don't refetch on initial render empty string if we already fetched
      fetchHistory(false, search);
    }, 500);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]); // Intentionally omitting fetchHistory

  const handleRetry = () => {
    fetchHistory(false, search);
  };

  const handleRefresh = () => {
    fetchHistory(false, search);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchHistory(true, search);
    }
  };

  const formatDate = (dateStr, timeStr) => {
    if (!dateStr) return '';
    try {
      const dateParts = dateStr.split('-');
      if (dateParts.length !== 3) return dateStr;
      
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      
      const d = new Date(year, month, day);
      const options = { day: 'numeric', month: 'short', year: 'numeric' };
      const dateFormatted = d.toLocaleDateString('id-ID', options);
      return `${dateFormatted} ${timeStr ? timeStr.substring(0, 5) + ' WIB' : ''}`;
    } catch {
      return dateStr;
    }
  };



  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: 'var(--bg-primary)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        backgroundColor: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-color)',
        gap: '16px',
        zIndex: 10
      }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '8px',
            cursor: 'pointer',
            marginLeft: '-8px'
          }}
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
            History
          </h1>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
            Picking yang sudah selesai
          </p>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0 16px', display: 'flex', gap: '8px', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', top: '12px', left: '16px', color: 'var(--text-muted)' }} size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Cari nomor SO / DN..."
            style={{ paddingLeft: '48px', width: '100%', height: '44px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-elevated)' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={handleRefresh}
          disabled={loading}
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
          <RefreshCw size={20} className={loading ? "spin-animation" : ""} />
        </button>
      </div>

      {/* Content area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px' }}>
            <RefreshCw size={24} className="text-secondary" style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
            <p className="text-secondary text-sm">Loading history...</p>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px' }}>
            <p className="text-error text-center mb-4">{error}</p>
            <button className="btn btn-primary" onClick={handleRetry} style={{ padding: '8px 24px' }}>Coba Lagi</button>
          </div>
        ) : historyItems.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px', textAlign: 'center' }}>
            <Clock size={48} className="text-muted" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>Belum ada riwayat picking</h3>
            <p className="text-secondary text-sm" style={{ margin: 0 }}>Order yang sudah selesai diproses akan muncul di sini.</p>
          </div>
        ) : (
          <>
            {historyItems.map((item, idx) => {
              return (
                <div 
                  key={item.name || idx}
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    position: 'relative'
                  }}
                >
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontWeight: '800', fontSize: '20px', color: 'var(--text-primary)' }}>{item.salesOrderNo || item.against_sales_order || '-'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>{item.name}</div>
                          {item.custom_event_booth && (
                            <>
                              <span style={{ color: 'var(--text-muted)' }}>•</span>
                              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.custom_event_booth}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div style={{ 
                        backgroundColor: 'var(--bg-secondary)', 
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                        padding: '6px 10px', 
                        borderRadius: '12px', 
                        fontSize: '12px', 
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        Selesai
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '14px', color: 'var(--text-primary)' }}>
                        <User size={16} color="var(--text-muted)" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span style={{ fontWeight: '500', wordBreak: 'break-word' }}>{item.customer || '-'}</span>
                      </div>
                      {item.custom_picked_by && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                          <UserCheck size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span style={{ fontWeight: '500', wordBreak: 'break-word' }}>Picker: {item.custom_picked_by}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {item.items && item.items.length > 0 && (
                    <div style={{ 
                      padding: '0 16px 12px 16px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '4px' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {item.items.length} Produk
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          ({item.items.reduce((total, i) => total + Number(i.qty || 0), 0)} pcs)
                        </div>
                      </div>
                      {item.items.map((prod, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-primary)', flex: 1, paddingRight: '8px' }}>{prod.item_name || prod.item_code}</span>
                          <span style={{ fontWeight: '700', color: 'var(--text-primary)', flexShrink: 0 }}>{prod.qty}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ 
                    padding: '12px 16px', 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Informasi Ambil Barang</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Store size={18} color="var(--text-muted)" />
                        <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                          {item.custom_event_pickup_option || '-'}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                        {formatDate(item.posting_date, item.posting_time)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <button 
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn btn-secondary"
                style={{ marginTop: '8px', marginBottom: '24px' }}
              >
                {loadingMore ? 'Memuat...' : 'Load More'}
              </button>
            )}
          </>
        )}
      </div>
      
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default History;
