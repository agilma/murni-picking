import React, { useState } from 'react';
import { Database, Trash2, Info, User, Clock, LogOut } from 'lucide-react';
import { useAuth, useCapabilities } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, logout } = useAuth();
  const capabilities = useCapabilities();
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(
    parseInt(localStorage.getItem('refreshInterval')) || 45
  );

  const handleIntervalChange = (val) => {
    setRefreshInterval(val);
    localStorage.setItem('refreshInterval', val);
  };

  const handleClearCache = () => {
    // Audit confirmed no active application cache (localStorage, sessionStorage) 
    // is used by the real application flow.
    // 'murniUser' is a legacy mock reference, we leave it untouched.
    
    // Close confirm modal
    setShowConfirmModal(false);
    
    // Open feedback modal indicating no cache
    setShowFeedbackModal(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-primary)', padding: '16px', overflowY: 'auto' }}>
      <h1 className="text-xl" style={{ fontWeight: '700', marginBottom: '24px' }}>Pengaturan</h1>

      {/* Akun Aktif Section */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Akun Aktif
        </h2>
        <div className="card" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '50%', color: 'var(--accent-primary)' }}>
            <User size={24} />
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '16px', color: 'var(--text-primary)' }}>
              {user?.username || 'Tidak diketahui'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              <span style={{ fontWeight: '600' }}>Role:</span> {user?.roleProfileName || 'Unknown'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              <span style={{ fontWeight: '600' }}>Booth:</span> {
                Array.isArray(user?.eventBooth) && user.eventBooth.length > 0 
                  ? user.eventBooth.join(', ') 
                  : (user?.eventBooth || 'Semua Booth (Tidak dibatasi)')
              }
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Data Aplikasi
        </h2>
        
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--accent-primary)' }}>
              <Database size={24} />
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Hapus Cache
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Bersihkan data sementara aplikasi
              </div>
            </div>
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={() => setShowConfirmModal(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Trash2 size={16} />
            Hapus Cache
          </button>
        </div>
      </div>

      {/* Auto Refresh Setting */}
      {capabilities?.canPicking && (
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Auto Refresh
          </h2>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--accent-primary)' }}>
                <Clock size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Interval Pembaruan Data
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Tentukan waktu muat ulang otomatis untuk daftar Delivery Note di Beranda.
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {[30, 45, 60].map((val) => (
                <button
                  key={val}
                  onClick={() => handleIntervalChange(val)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: refreshInterval === val ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    backgroundColor: refreshInterval === val ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                    color: refreshInterval === val ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: refreshInterval === val ? '700' : '500',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                >
                  {val} Detik
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Informasi Aplikasi
        </h2>
        
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--accent-primary)' }}>
              <Info size={24} />
            </div>
            <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)' }}>
              Versi Aplikasi
            </div>
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>
            v{__APP_VERSION__}
          </div>
        </div>
      </div>

      {/* Akun Section (Keluar) */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Sesi Akun
        </h2>
        
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--error-color)' }}>
              <LogOut size={24} />
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Keluar Aplikasi
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Akhiri sesi Anda saat ini
              </div>
            </div>
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={() => setShowLogoutConfirm(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: 'var(--error-color)' }}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '360px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Hapus Cache?
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
              Data sementara aplikasi akan dibersihkan. Anda tetap masuk ke sistem.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn" 
                onClick={() => setShowConfirmModal(false)}
                style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                Batal
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleClearCache}
                style={{ flex: 1, backgroundColor: 'var(--error-color)' }}
              >
                Hapus Cache
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '360px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Konfirmasi Keluar
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
              Apakah Anda tetap ingin keluar dari aplikasi?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn" 
                onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                Batal
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleLogoutConfirm}
                style={{ flex: 1, backgroundColor: 'var(--error-color)' }}
              >
                Tetap Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '360px', padding: '24px', textAlign: 'center' }}>
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '50%', 
              backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              margin: '0 auto 16px auto' 
            }}>
              <Database size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Tidak Ada Cache
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
              Tidak ada data sementara yang perlu dibersihkan.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowFeedbackModal(false)}
              style={{ width: '100%' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
