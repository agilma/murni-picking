import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, QrCode, Search, CheckCircle } from 'lucide-react';
import { useOrders } from '../context/OrderContext';
import { getDeliveryNoteWithItems } from '../api/picking';
import { submitDeliveryNote, submitFrappeDeliveryNote, findDeliveryNotesBySalesOrder } from '../api/deliveryNote';
import { getSalesOrderByName } from '../api/salesOrder';
import { resolvePickupFlow, canReceivePickingForFlow } from '../utils/pickupFlow';
import { useAuth } from '../context/AuthContext';

const parseServerMessages = (serverMessages) => {
  try {
    if (!serverMessages) return [];
    let parsed = typeof serverMessages === 'string' ? JSON.parse(serverMessages) : serverMessages;
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed); // Sometimes it's doubly stringified
    }
    
    if (Array.isArray(parsed)) {
      return parsed.map(msg => {
        if (typeof msg === 'string') {
          try {
            const innerMsg = JSON.parse(msg);
            return innerMsg.message || innerMsg;
          } catch (e) {
            return msg;
          }
        }
        return msg.message || msg;
      });
    }
  } catch (err) {
    console.error('Failed to parse _server_messages:', err);
  }
  return [];
};

const ReceivePicking = () => {
  const navigate = useNavigate();
  const { showToast } = useOrders();
  const { user } = useAuth();
  
  const [pickupCode, setPickupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidateDns, setCandidateDns] = useState([]);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!pickupCode.trim()) return;
    
    setLoading(true);
    setError(null);
    setLoading(true);
    setError(null);
    
    try {
      const searchVal = pickupCode.trim();
      let soName = null;
      let authorizedCandidates = [];
      let foundAnyDn = false;
      let foundUnpicked = false;
      let foundNotDraft = false;
      
      const so = await getSalesOrderByName(searchVal);
      
      if (so) {
        soName = so.name;
        const dns = await findDeliveryNotesBySalesOrder(so.name);
        if (dns && dns.length > 0) foundAnyDn = true;
        
        const candidates = dns.filter(dn => {
          const isDraft = (dn.docstatus === 0 || dn.status === 'Draft');
          const isPicked = (dn.custom_event_is_picked === 1);
          if (!isDraft) foundNotDraft = true;
          if (!isPicked) foundUnpicked = true;
          return isDraft && isPicked;
        });
        
        authorizedCandidates = candidates.filter(candidate => canReceivePickingForFlow({
            role: user?.roleProfile,
            deliveryNote: candidate
        }));
      }
      
      if (authorizedCandidates.length === 0) {
        // Fallback: search as Delivery Note ID directly
        const detail = await getDeliveryNoteWithItems(searchVal);
        if (detail) {
          foundAnyDn = true;
          const isDraft = (detail.docstatus === 0 || detail.status === 'Draft');
          const isPicked = (detail.custom_event_is_picked === 1);
          
          if (!isDraft) foundNotDraft = true;
          if (!isPicked) foundUnpicked = true;
          
          if (isDraft && isPicked) {
            const isAllowed = canReceivePickingForFlow({
              role: user?.roleProfile,
              deliveryNote: detail
            });
            if (isAllowed) authorizedCandidates.push(detail);
          }
        }
      }
      
      if (authorizedCandidates.length > 0) {
        setCandidateDns(prev => {
          const newCandidates = [...prev];
          let added = false;
          authorizedCandidates.forEach(cand => {
            if (!newCandidates.find(d => d.name === cand.name)) {
              newCandidates.push(cand);
              added = true;
            }
          });
          if (added && newCandidates.length > 1) {
            setIsBatchMode(true);
          }
          return newCandidates;
        });
        setPickupCode('');
      } else if (foundAnyDn) {
        if (foundUnpicked) {
            setError('Barang belum selesai dipicking oleh tim Picking.');
        } else if (foundNotDraft) {
            setError('Delivery Note sudah diterima atau status tidak valid.');
        } else {
            setError('Delivery Note ini tidak dapat diterima oleh role Anda.');
        }
      } else {
        if (soName) {
            setError('Delivery Note untuk nomor sales order ini belum ditemukan.');
        } else {
            setError('Delivery Note tidak ditemukan.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Gagal mencari data. ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleReceiveAndSubmit = async () => {
    if (candidateDns.length === 0) return;
    
    setLoading(true);
    let successMessages = [];
    
    try {
      if (isBatchMode) {
        for (const dn of candidateDns) {
          const resp = await submitFrappeDeliveryNote(dn);
          const serverMsgs = parseServerMessages(resp._server_messages);
          if (serverMsgs.length > 0) {
            successMessages.push(`DN ${dn.name}: ${serverMsgs.join(' ')}`);
          }
        }
      } else {
        const dn = candidateDns[0];
        const submitResponse = await submitDeliveryNote(dn.name || dn.deliveryNoteNo);
        const submitMsg = submitResponse?.message || {};
        
        if (submitMsg.status === 'success') {
          if (submitMsg.docstatus !== 1) {
            throw new Error(`Delivery Note ${dn.name} gagal berubah status.`);
          }
          const serverMsgs = parseServerMessages(submitResponse._server_messages);
          if (serverMsgs.length > 0) {
             successMessages.push(...serverMsgs);
          }
        } else if (submitMsg.docstatus !== undefined && submitMsg.docstatus !== 1) {
            throw new Error(`Delivery Note ${dn.name} gagal berubah status.`);
        } else {
          // Additional fallback if it's not a clear error but status isn't 1
          if (submitResponse?.docstatus !== undefined && submitResponse?.docstatus !== 1) {
              throw new Error(`Delivery Note ${dn.name} gagal berubah status.`);
          }
        }
      }
      
      const isBatch = isBatchMode;
      const baseMsg = isBatch ? 'Berhasil men-submit seluruh Delivery Note secara Batch!' : 'Berhasil menerima barang dan mensubmit Delivery Note!';
      
      alert(baseMsg);
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
            placeholder="Masukkan Nomor Sales Order..."
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

        {candidateDns.length > 0 && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '600' }}>Terdapat {candidateDns.length} Delivery Note</span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Total {candidateDns.reduce((sum, dn) => sum + (dn.items ? dn.items.reduce((s, i) => s + i.qty, 0) : 0), 0)} Item
                </span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={isBatchMode} 
                  onChange={(e) => setIsBatchMode(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span>Batch Submit</span>
              </label>
            </div>
            
            {candidateDns.map(dn => {
              const totalItems = dn.items ? dn.items.reduce((sum, item) => sum + item.qty, 0) : 0;
              const customerName = dn.customer || dn.customer_name || '-';
              const soNumber = dn.against_sales_order || dn.sales_order || '-';
              const pickupCodeStr = dn.pickup_code || dn.custom_pick_up_code || '-';
              
              return (
                <div key={dn.name} style={{ display: 'flex', flexDirection: 'column', padding: '12px 0', borderBottom: '1px dashed var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Delivery Note</div>
                      <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '8px' }}>{dn.name}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success-color)', fontWeight: '600', fontSize: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                      <CheckCircle size={12} /> Dipicking
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', backgroundColor: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Customer</span>
                      <span style={{ fontWeight: '600' }}>{customerName}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Sales Order</span>
                      <span style={{ fontWeight: '600' }}>{soNumber}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Sales Order</span>
                      <span style={{ fontWeight: '600' }}>{dn.against_sales_order || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Total Item</span>
                      <span style={{ fontWeight: '600' }}>{totalItems}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <button
              className="btn btn-primary"
              onClick={handleReceiveAndSubmit}
              disabled={loading}
              style={{ padding: '16px', fontSize: '16px', marginTop: '8px' }}
            >
              {loading ? 'Memproses...' : (isBatchMode ? `Terima & Submit Batch (${candidateDns.length} DN)` : 'Terima & Submit DN')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceivePicking;
