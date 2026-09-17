import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDeliveryNoteHistory } from '../api/deliveryNote';

const History = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchHistory = useCallback(async (isLoadMore = false) => {
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
      const data = await getDeliveryNoteHistory(user.username, limit, currentOffset);
      
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
  }, [user, limit, offset]);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRetry = () => {
    fetchHistory();
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchHistory(true);
    }
  };

  const formatDate = (dateStr, timeStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const options = { day: 'numeric', month: 'short', year: 'numeric' };
      const dateFormatted = d.toLocaleDateString('id-ID', options);
      return `${dateFormatted} • ${timeStr ? timeStr.substring(0, 5) : ''}`;
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
            {historyItems.map((item, idx) => (
              <div 
                key={item.name || idx} 
                onClick={() => navigate(`/history/${encodeURIComponent(item.name)}`)}
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                    {item.name}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {formatDate(item.posting_date, item.posting_time)}
                  </span>
                </div>
                
                {item.against_sales_order && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-primary)' }}>
                    Sales Order: <strong>{item.against_sales_order}</strong>
                  </p>
                )}
                <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Customer: {item.customer || '-'}
                </p>
              </div>
            ))}

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
