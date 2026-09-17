import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ClipboardList } from 'lucide-react';
import { getDeliveryNoteDetail } from '../api/deliveryNote';

const DeliveryNoteDetail = () => {
  const { deliveryNoteName } = useParams();
  const navigate = useNavigate();
  
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDeliveryNoteDetail(deliveryNoteName);
      if (data) {
        setDetail(data);
      } else {
        setError('Detail Delivery Note tidak ditemukan');
      }
    } catch (err) {
      console.error("Failed to fetch detail:", err);
      setError('Detail Delivery Note tidak dapat dimuat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryNoteName]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return timeStr.substring(0, 5);
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
          onClick={() => navigate('/history')} 
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
            Detail
          </h1>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
            Riwayat Picking
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
        gap: '16px'
      }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px' }}>
            <RefreshCw size={24} className="text-secondary" style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
            <p className="text-secondary text-sm">Memuat detail Delivery Note...</p>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px' }}>
            <p className="text-error text-center mb-4">{error}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/history')} style={{ padding: '8px 24px' }}>Kembali</button>
              <button className="btn btn-primary" onClick={fetchDetail} style={{ padding: '8px 24px' }}>Coba Lagi</button>
            </div>
          </div>
        ) : detail ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Delivery Note</div>
              <div className="text-xl" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{detail.name}</div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Customer</div>
              <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{detail.customer || '-'}</div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tanggal</div>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{formatDate(detail.posting_date)}</div>
              </div>

              <div style={{ flex: 1, borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Waktu</div>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{formatTime(detail.posting_time)}</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default DeliveryNoteDetail;
