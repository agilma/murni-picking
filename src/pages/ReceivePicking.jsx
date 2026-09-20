import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, QrCode, Search, CheckCircle, User, UserCheck, Store, Trash2, AlertCircle } from 'lucide-react';
import { useOrders } from '../context/OrderContext';
import { fetchReadyToReceiveDeliveryNotes } from '../api/picking';
import { submitDeliveryNote, submitDeliveryNotesBatch } from '../api/deliveryNote';
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

const ReceivePicking = ({ isHome = false }) => {
  const navigate = useNavigate();
  const { showToast } = useOrders();
  const { user } = useAuth();
  
  const [pickupCode, setPickupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidateDns, setCandidateDns] = useState([]);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showItemClearConfirm, setShowItemClearConfirm] = useState(false);
  const [showWrongBoothConfirm, setShowWrongBoothConfirm] = useState(false);
  const [wrongBoothData, setWrongBoothData] = useState(null);
  const [dnToRemove, setDnToRemove] = useState(null);

  const handleRemoveCandidate = (dnName) => {
    setDnToRemove(dnName);
    setShowItemClearConfirm(true);
  };

  const confirmRemoveCandidate = () => {
    if (dnToRemove) {
      setCandidateDns(prev => prev.filter(dn => dn.name !== dnToRemove));
    }
    setShowItemClearConfirm(false);
    setDnToRemove(null);
  };

  const handleClearAllCandidates = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAll = () => {
    setCandidateDns([]);
    setIsBatchMode(false);
    setShowClearConfirm(false);
  };
  
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!pickupCode.trim()) return;
    
    setLoading(true);
    setError(null);
    setLoading(true);
    setError(null);
    
    try {
      const searchVal = pickupCode.trim();
      let authorizedCandidates = [];
      
      const dns = await fetchReadyToReceiveDeliveryNotes(searchVal, user?.roleProfile === 'Pickup' ? 'anyone' : user?.username);
      
      if (dns && dns.length > 0) {
        // Filter out non-draft ones just in case
        authorizedCandidates = dns.filter(dn => dn.docstatus === 0 || dn.status === 'Draft');
      }
      
      if (authorizedCandidates.length > 0) {
        // Check if booth matches user session
        const candidateBooth = authorizedCandidates[0].custom_event_pickup_option || authorizedCandidates[0].custom_event_booth;
        
        let allowedBooths = user?.eventBooth || [];
        if (!Array.isArray(allowedBooths)) allowedBooths = [allowedBooths];
        
        // Skip strict full_name fallback for Pickup role if they have no explicit permissions
        if (allowedBooths.length === 0 && user?.full_name && user?.roleProfile !== 'Pickup') {
          allowedBooths = [user.full_name];
        }

        let isWrongBooth = false;
        if (candidateBooth) {
          const cb = candidateBooth.toLowerCase();
          
          if (allowedBooths.length > 0) {
            const matched = allowedBooths.some(b => b && b.toLowerCase() === cb);
            if (!matched) {
              isWrongBooth = true;
              
              // Exception: If pickup option is generic 'booth' and user is a Picker, allow it
              if (cb === 'booth' && user?.roleProfile === 'Picking') {
                isWrongBooth = false;
              }
            }
          } else {
            // User has no explicit permissions (allowedBooths is empty).
            // Currently this applies to Pickup role without eventBooth (due to skipped fallback above).
            // They can receive goods, EXCEPT if the goods are meant for a Booth.
            if (user?.roleProfile === 'Pickup' && cb.startsWith('booth')) {
              isWrongBooth = true;
            }
          }
        }
        
        if (isWrongBooth) {
           setWrongBoothData({
             expectedBooth: candidateBooth,
             scannedSo: authorizedCandidates[0].against_sales_order || authorizedCandidates[0].sales_order || authorizedCandidates[0].name
           });
           setShowWrongBoothConfirm(true);
           setPickupCode('');
           setLoading(false);
           return;
        }

        setCandidateDns(prev => {
          const newCandidates = isBatchMode ? [...prev] : [];
          let added = false;
          authorizedCandidates.forEach(cand => {
            if (!newCandidates.find(d => d.name === cand.name)) {
              newCandidates.unshift(cand);
              added = true;
            }
          });
          if (newCandidates.length > 1) {
            setIsBatchMode(true);
          }
          return newCandidates;
        });
        setPickupCode('');
      } else {
        if (dns && dns.length > 0) {
            setError('Delivery Note sudah diterima atau status tidak valid.');
        } else {
            setError('Sales Order tidak ditemukan.');
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
      let finalPickupCode = null;
      let successRespData = null;
      
      if (isBatchMode) {
        const names = candidateDns.map(dn => dn.name || dn.deliveryNoteNo);
        const submitResponse = await submitDeliveryNotesBatch(names);
        const batchResults = submitResponse?.message || [];
        
        const successfulResults = batchResults.filter(r => r.status === 'success');
        
        const mergedResults = successfulResults.map(res => {
          const originalDn = candidateDns.find(dn => (dn.name || dn.deliveryNoteNo) === res.delivery_note);
          return {
            ...res,
            custom_pick_up_code: res.custom_pick_up_code || (originalDn ? originalDn.custom_pick_up_code : null),
            customer: originalDn ? (originalDn.customer || originalDn.customer_name) : '-',
            custom_event_pickup_option: originalDn ? originalDn.custom_event_pickup_option : '-'
          };
        });

        if (mergedResults.length === 0) {
          throw new Error('Seluruh Delivery Note dalam batch gagal di-submit.');
        }

        const serverMsgs = parseServerMessages(submitResponse?._server_messages);
        if (serverMsgs.length > 0) {
          successMessages.push(...serverMsgs);
        }

        successRespData = mergedResults;
      } else {
        const dn = candidateDns[0];
        const submitResponse = await submitDeliveryNote(dn.name || dn.deliveryNoteNo);
        const submitMsg = submitResponse?.message || {};
        
        if (submitMsg.status === 'success') {
          successRespData = {
            ...submitMsg,
            sales_order: submitMsg.sales_order || dn.against_sales_order || dn.sales_order || '-',
            delivery_note: submitMsg.delivery_note || dn.name || dn.deliveryNoteNo,
            customer: dn.customer || dn.customer_name || '-',
            custom_event_pickup_option: dn.custom_event_pickup_option || '-'
          };
          
          if (submitMsg.custom_pick_up_code) {
            finalPickupCode = submitMsg.custom_pick_up_code;
          }
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
          if (submitResponse?.docstatus !== undefined && submitResponse?.docstatus !== 1) {
              throw new Error(`Delivery Note ${dn.name} gagal berubah status.`);
          }
        }
      }
      
      let baseMsg = isBatchMode ? 'Berhasil men-submit seluruh Delivery Note secara Batch!' : 'Berhasil menerima barang dan mensubmit Delivery Note!';
      
      if (successRespData) {
        setSuccessData({
          data: successRespData,
          messages: successMessages
        });
        // Do not navigate yet, user must dismiss the success screen
      } else {
        if (finalPickupCode) {
          baseMsg = `Berhasil submit DN. Kode Pickup: ${finalPickupCode}`;
        }
        showToast(baseMsg, 'success');
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Gagal mensubmit Delivery Note.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    const data = successData.data;
    const msgs = successData.messages;
    
    const handleResetSuccess = () => {
      setSuccessData(null);
      setCandidateDns([]);
      setPickupCode('');
      setIsBatchMode(false);
      navigate('/', { replace: true });
    };

    if (Array.isArray(data)) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-primary)', padding: '24px', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, marginBottom: '24px', marginTop: '24px' }}>
            <CheckCircle size={64} color="var(--success-color)" style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)', textAlign: 'center' }}>Terima Batch Berhasil!</h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '350px', lineHeight: '1.5' }}>
              <b>{data.length}</b> pesanan telah diterima dari tim Picking dan siap diambil oleh pelanggan.
            </p>
          </div>

          <div style={{ width: '100%', maxWidth: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', padding: '4px' }}>
            {data.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid var(--accent-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>{item.sales_order}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.delivery_note}</div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px' }}>
                      <User size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: '500' }}>{item.customer}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  marginTop: '12px',
                  padding: '12px', 
                  backgroundColor: 'var(--bg-secondary)', 
                  borderTop: '1px solid var(--border-color)',
                  borderRadius: '0 0 8px 8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Informasi Ambil Barang</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Store size={18} color="var(--accent-primary)" />
                      <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {item.custom_event_pickup_option || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', maxWidth: '400px', padding: '16px', fontSize: '18px', fontWeight: 'bold', borderRadius: '12px', flexShrink: 0, marginBottom: '24px' }}
            onClick={handleResetSuccess}
          >
            Selesai & Kembali ke Beranda
          </button>
        </div>
      );
    }
    
    // Single Submit View
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-primary)', padding: '24px', alignItems: 'center', justifyContent: 'center' }}>
        <CheckCircle size={80} color="var(--success-color)" style={{ marginBottom: '24px' }} />
        <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)', textAlign: 'center' }}>Terima Barang Berhasil!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'center', maxWidth: '350px', lineHeight: '1.5' }}>
          Barang telah diterima dari tim Picking. Pesanan ini <b>siap diambil</b> oleh pelanggan.
        </p>
        
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sales Order</div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>{data.sales_order}</div>
          </div>
          <div style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Delivery Note</div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-secondary)' }}>{data.delivery_note}</div>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Customer</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{data.customer}</div>
            </div>
          </div>
          
          <div style={{ 
            padding: '16px', 
            backgroundColor: 'var(--bg-secondary)', 
            borderRadius: '12px', 
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Informasi Ambil Barang</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Store size={22} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>{data.custom_event_pickup_option}</div>
            </div>
          </div>
        </div>
        
        <button 
          className="btn btn-primary" 
          style={{ width: '100%', maxWidth: '400px', padding: '16px', fontSize: '18px', fontWeight: 'bold', borderRadius: '12px' }}
          onClick={handleResetSuccess}
        >
          Selesai & Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="header" style={isHome ? { display: 'flex', flexDirection: 'column', gap: '12px' } : {}}>
        <div className="header-row" style={isHome ? { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } : {}}>
          {!isHome && (
            <button 
              className="icon-btn" 
              onClick={() => navigate(-1)} 
              aria-label="Kembali" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px' }}
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <div style={{ flexGrow: 1, paddingLeft: isHome ? '0' : '0' }}>
            <h1 className="text-xl" style={{ fontWeight: '700', margin: 0 }}>
              {isHome ? "Murni-Booth" : "Terima Barang"}
            </h1>
          </div>

          {isHome && (
            <div style={{ 
              fontSize: '13px', 
              color: 'var(--accent-primary)', 
              fontWeight: '700', 
              backgroundColor: 'rgba(59, 130, 246, 0.1)', 
              padding: '6px 12px', 
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <style>{`
                @keyframes pulse {
                  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
                  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
                  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                }
                @keyframes slideUp {
                  from { opacity: 0; transform: translateY(20px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', animation: 'pulse 2s infinite' }}></div>
              MODE: {user?.roleProfile?.toUpperCase() || 'PICKUP'}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <form onSubmit={handleSearch} style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-muted)' }} size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Masukkan Nomor Sales Order..."
            style={{ padding: '14px 14px 14px 48px', width: '100%', fontSize: '16px', backgroundColor: '#ffffff', borderRadius: '12px' }}
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
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center', 
            padding: '32px 24px', 
            backgroundColor: '#ffffff', 
            borderRadius: '16px', 
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            gap: '16px'
          }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <AlertCircle size={32} color="var(--error-color)" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Pencarian Gagal
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {error.includes('not found in response') 
                  ? (
                    <>
                      {error.replace('Gagal mencari data. ', '').replace('not found in response', 'tidak ditemukan pada sistem.')}
                      <br /><br />
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Tips:</span> Pastikan pesanan ini memang ditujukan untuk lokasi booth Anda.
                    </>
                  )
                  : error.replace('Gagal mencari data. ', '')}
              </p>
            </div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={isBatchMode} 
                    onChange={(e) => setIsBatchMode(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Batch Submit</span>
                </label>
                {isBatchMode && (
                  <button onClick={handleClearAllCandidates} style={{ border: 'none', background: 'none', padding: '4px', color: 'var(--error-color)', display: 'flex', alignItems: 'center', cursor: 'pointer' }} aria-label="Hapus Semua">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
            
            {candidateDns.map(dn => {
              const totalItems = dn.total_qty || (dn.items ? dn.items.reduce((sum, item) => sum + item.qty, 0) : 0);
              const customerName = dn.customer || dn.customer_name || '-';
              const soNumber = dn.po_no || '-';
              const pickupOption = dn.custom_event_pickup_option || '-';
              const pickedBy = dn.custom_picked_by || dn.pickedBy || null;
              
              return (
                <div key={dn.name} style={{ display: 'flex', flexDirection: 'column', padding: '16px', backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontWeight: '800', fontSize: '20px', color: 'var(--text-primary)' }}>{soNumber}</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>{dn.name}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success-color)', fontWeight: '600', fontSize: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '6px 10px', borderRadius: '12px' }}>
                        <CheckCircle size={14} /> Dipicking
                      </div>
                      {isBatchMode && (
                        <button onClick={() => handleRemoveCandidate(dn.name)} style={{ border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error-color)', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} aria-label="Hapus Item">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {customerName && customerName !== '-' && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '14px', color: 'var(--text-primary)' }}>
                      <User size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontWeight: '500', wordBreak: 'break-word' }}>{customerName}</span>
                    </div>
                  )}

                  {pickedBy && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      <UserCheck size={16} color="var(--success-color)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontWeight: '500', wordBreak: 'break-word', color: 'var(--success-color)' }}>Picker: {pickedBy}</span>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {dn.items?.length > 0 ? `${dn.items.length} Produk` : 'Total Item'}
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        ({totalItems} pcs)
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    padding: '12px 16px', 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    margin: '16px -16px -16px -16px',
                    borderRadius: '0 0 12px 12px'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Informasi Ambil Barang</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Store size={18} color="var(--accent-primary)" />
                        <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                          {pickupOption}
                        </span>
                      </div>
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

      {showClearConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error-color)' }}>
              <Trash2 size={32} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>Hapus Semua Data?</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                Apakah Anda yakin ingin menghapus <b>{candidateDns.length} Delivery Note</b> dari daftar ini? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => setShowClearConfirm(false)}
                style={{ flex: 1, padding: '12px', fontWeight: '600' }}
              >
                Batal
              </button>
              <button 
                className="btn btn-primary" 
                onClick={confirmClearAll}
                style={{ flex: 1, padding: '12px', fontWeight: '600', backgroundColor: 'var(--error-color)', borderColor: 'var(--error-color)' }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {showItemClearConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error-color)' }}>
              <Trash2 size={32} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>Hapus Pesanan?</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                Apakah Anda yakin ingin menghapus <b>{dnToRemove}</b> dari daftar ini?
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => { setShowItemClearConfirm(false); setDnToRemove(null); }}
                style={{ flex: 1, padding: '12px', fontWeight: '600' }}
              >
                Batal
              </button>
              <button 
                className="btn btn-primary" 
                onClick={confirmRemoveCandidate}
                style={{ flex: 1, padding: '12px', fontWeight: '600', backgroundColor: 'var(--error-color)', borderColor: 'var(--error-color)' }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {showWrongBoothConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error-color)' }}>
              <Store size={32} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>Salah Booth!</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                Pesanan <b>{wrongBoothData?.scannedSo}</b> ini seharusnya di-pickup di:
              </p>
              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>
                {wrongBoothData?.expectedBooth}
              </div>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowWrongBoothConfirm(false)}
              style={{ width: '100%', marginTop: '8px', padding: '12px', fontWeight: '600' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceivePicking;
