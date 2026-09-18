import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, QrCode, Search, CheckCircle } from 'lucide-react';
import { useOrders } from '../context/OrderContext';
import { getDeliveryNoteWithItems } from '../api/picking';
import { submitDeliveryNote, findDeliveryNotesBySalesOrder } from '../api/deliveryNote';
import { getSalesOrderByPickupCode } from '../api/salesOrder';
import { resolvePickupFlow, canReceivePickingForFlow } from '../utils/pickupFlow';
import { useAuth } from '../context/AuthContext';

const ReceivePicking = () => {
  const navigate = useNavigate();
  const { showToast } = useOrders();
  const { user } = useAuth();
  
  const [pickupCode, setPickupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [dnDetail, setDnDetail] = useState(null);
  const [error, setError] = useState(null);
  
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!pickupCode.trim()) return;
    
    setLoading(true);
    setError(null);
    setDnDetail(null);
    
    try {
      const searchVal = pickupCode.trim();
      let detail = null;
      let soName = null;
      let searchType = 'unknown';
      let dnFoundCount = 0;
      
      // We assume it's a pickup code first if it looks like one, or try Delivery Note directly.
      // Usually DN names start with 'MAT-DN-' or similar, but let's try getSalesOrderByPickupCode first
      // since the primary search for Pickup role is by pickup code.
      // We will try fetching Sales Order first, if not found, we fallback to searching as DN directly.
      const so = await getSalesOrderByPickupCode(searchVal);
      
      if (so) {
        searchType = 'pickup_code';
        soName = so.name;
        // Found SO, get associated DNs
        const dns = await findDeliveryNotesBySalesOrder(so.name);
        dnFoundCount = dns.length;
        
        // Filter candidates
        const candidates = dns.filter(dn => 
          (dn.docstatus === 0 || dn.status === 'Draft') && dn.custom_event_is_picked === 1
        );
        
        // If multiple candidates, find one that matches authorization
        for (const candidate of candidates) {
          const isAllowed = canReceivePickingForFlow({
            role: user?.roleProfile,
            deliveryNote: candidate
          });
          if (isAllowed) {
            // Found a match, get full details
            detail = await getDeliveryNoteWithItems(candidate.name);
            break;
          }
        }
        
        if (!detail && candidates.length > 0) {
          // No authorized candidate, just pick the first to let it fail authorization below
          // so the user gets a proper error message.
          detail = await getDeliveryNoteWithItems(candidates[0].name);
        }
        
        if (!detail && dnFoundCount > 0) {
           // All DNs were either docstatus 1 or not picked
           // Let's just grab the first one to show a proper error
           detail = await getDeliveryNoteWithItems(dns[0].name);
        }
      } 
      
      if (!detail) {
        // Fallback: search as Delivery Note ID directly
        searchType = 'delivery_note';
        detail = await getDeliveryNoteWithItems(searchVal);
      }
      
      if (!detail) {
        if (searchType === 'pickup_code' && soName) {
           setError('Delivery Note untuk pickup code ini belum ditemukan.');
        } else {
           setError('Delivery Note tidak ditemukan.');
        }
        setLoading(false);
        return;
      }
      
      // Temporary Debug Logging
      console.log(`[Receive Picking]
Role: ${user?.roleProfile}
Search Type: ${searchType}
Search Value: ${searchVal}
Sales Order: ${soName || 'N/A'}
Delivery Notes Found: ${dnFoundCount}
Selected Delivery Note: ${detail.name}
Pickup Flow: ${resolvePickupFlow(detail)}
custom_event_is_picked: ${detail.custom_event_is_picked}
docstatus: ${detail.docstatus !== undefined ? detail.docstatus : detail.status}
Authorization: ${canReceivePickingForFlow({ role: user?.roleProfile, deliveryNote: detail })}`);

      // Validate custom_event_is_picked === 1
      if (!detail.isPicked && detail.custom_event_is_picked !== 1) {
        setError('Barang belum selesai dipicking oleh tim Picking.');
        setLoading(false);
        return;
      }
      
      const isDraft = detail.docstatus === 0 || detail.status === 'Draft';
      if (!isDraft) {
        const isSubmitted = detail.docstatus === 1 || detail.status === 'Return' || detail.status === 'Submitted';
        setError(isSubmitted ? 'Delivery Note sudah diterima.' : 'Delivery Note tidak valid (bukan Draft).');
        setLoading(false);
        return;
      }
      
      const isAllowed = canReceivePickingForFlow({
        role: user?.roleProfile,
        deliveryNote: detail
      });
      
      if (!isAllowed) {
        setError('Delivery Note ini tidak dapat diterima oleh role Anda.');
        setLoading(false);
        return;
      }
      
      setDnDetail(detail);
    } catch (err) {
      console.error(err);
      setError('Gagal mencari data. ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleReceiveAndSubmit = async () => {
    if (!dnDetail) return;
    
    setLoading(true);
    try {
      // Submit DN
      const submitResponse = await submitDeliveryNote(dnDetail.name || dnDetail.deliveryNoteNo);
      
      // Verify docstatus conceptually using the response
      if (submitResponse && submitResponse.status === 'success') {
        if (submitResponse.docstatus !== 1) {
          throw new Error('Delivery Note gagal berubah status menjadi Submitted.');
        }
      } else if (submitResponse && submitResponse.docstatus !== undefined && submitResponse.docstatus !== 1) {
          throw new Error('Delivery Note gagal berubah status menjadi Submitted.');
      }
      
      alert('Berhasil menerima barang dan mensubmit Delivery Note!');
      navigate('/');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Gagal mensubmit Delivery Note.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="header">
        <div className="header-row">
          <button 
            className="icon-btn" 
            onClick={() => navigate(-1)} 
            aria-label="Kembali" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px' }}
          >
            <ChevronLeft size={24} />
          </button>
          <div style={{ flexGrow: 1 }}>
            <h1 className="text-xl" style={{ fontWeight: '700', margin: 0 }}>
              Terima Barang
            </h1>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <form onSubmit={handleSearch} style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-muted)' }} size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Masukkan ID / Pickup Code..."
            style={{ padding: '14px 14px 14px 48px', width: '100%', fontSize: '16px' }}
            value={pickupCode}
            onChange={(e) => setPickupCode(e.target.value)}
          />
          <button 
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '12px', padding: '14px' }}
            disabled={loading || !pickupCode.trim()}
          >
            {loading ? 'Mencari...' : 'Cari Data'}
          </button>
        </form>

        {error && (
          <div style={{ color: 'var(--error-color)', padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid var(--error-color)' }}>
            {error}
          </div>
        )}

        {dnDetail && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Delivery Note</div>
              <div style={{ fontWeight: '700', fontSize: '18px' }}>{dnDetail.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-color)', fontWeight: '600' }}>
                <CheckCircle size={16} />
                Selesai Dipicking
              </div>
            </div>
            
            <button
              className="btn btn-primary"
              onClick={handleReceiveAndSubmit}
              disabled={loading}
              style={{ padding: '16px', fontSize: '16px', marginTop: '8px' }}
            >
              {loading ? 'Memproses...' : 'Terima & Submit DN'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceivePicking;
