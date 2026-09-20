import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, RefreshCw, Search, User, Store, CheckCircle, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchHistorySalesOrders } from '../api/salesOrder';

const PickupHistory = () => {
  const navigate = useNavigate();
  const { user, selectedBooth } = useAuth();
  
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const searchTimeoutRef = useRef(null);
  const limit = 20;

  const fetchHistory = useCallback(async (isLoadMore = false, searchQuery = search) => {
    if (!user || !user.roleProfileName) {
      setError('User session not available');
      setLoading(false);
      return;
    }

    const currentPage = isLoadMore ? page + 1 : 1;
    
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const data = await fetchHistorySalesOrders(
        searchQuery, 
        currentPage, 
        limit, 
        user.roleProfileName, 
        user.eventBooth
      );
      
      if (isLoadMore) {
        setHistoryItems(prev => [...prev, ...data]);
      } else {
        setHistoryItems(data);
      }
      
      setHasMore(data.length === limit);
      setPage(currentPage);
    } catch (err) {
      console.error("Failed to fetch history:", err);
      if (!isLoadMore) {
        setError('Riwayat tidak dapat dimuat');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, page, limit, search]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="header">
        <div className="header-row">
          <button 
            onClick={() => navigate('/pickup')}
            className="icon-btn"
            aria-label="Kembali"
          >
            <ChevronLeft size={24} />
          </button>
          <div style={{ flexGrow: 1 }}>
            <h1 className="text-lg" style={{ margin: 0, fontWeight: '600', color: 'var(--text-primary)' }}>
              History Pickup
            </h1>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              Pesanan yang sudah diambil
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0 16px', display: 'flex', gap: '8px', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', top: '12px', left: '16px', color: 'var(--text-muted)' }} size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Cari nomor SO..."
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
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>Belum ada riwayat pickup</h3>
            <p className="text-secondary text-sm" style={{ margin: 0 }}>Pesanan yang sudah diambil akan muncul di sini.</p>
          </div>
        ) : (
          <>
            {historyItems.map((item, idx) => {
              return (
                <div 
                  key={item.name || idx}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontWeight: '800', fontSize: '20px', color: 'var(--text-primary)' }}>{item.name || '-'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Store size={14} color="var(--text-secondary)" />
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                          {item.custom_event_pickup_option || '-'}
                        </div>
                        {item.custom_event_booth && (
                          <>
                            <span style={{ color: 'var(--text-muted)' }}>•</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.custom_event_booth}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ 
                      backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                      color: '#16a34a',
                      padding: '6px 10px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      <CheckCircle size={14} />
                      Selesai
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', marginTop: '4px' }}>
                    <User size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.customer_name || item.customer || '-'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                      <Clock size={14} />
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>
                        {item.modified ? new Date(item.modified).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                    </div>
                    {item.grand_total > 0 && (
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                        Rp {item.grand_total.toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {hasMore && (
              <button 
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '12px', marginTop: '8px', borderRadius: '12px' }}
              >
                {loadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
              </button>
            )}
            
            {!hasMore && historyItems.length > 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', margin: '16px 0' }}>
                Semua data telah dimuat
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PickupHistory;
