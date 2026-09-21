import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Email / Username dan Password wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await login(username, password);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      let errorMsg = 'Username atau password tidak sesuai.';
      if (result.error && (result.error.status === 0 || result.error.message?.toLowerCase().includes('fetch'))) {
        errorMsg = 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
      }
      setError(errorMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center' }}>
      <div className="text-center mb-4">
        <h2 className="text-xl">Murni Picking</h2>
        <p className="text-muted" style={{ marginTop: '8px' }}>Masuk ke sistem operasional</p>
      </div>

      <div className="card">
        <form className="flex-col" onSubmit={handleSubmit}>
          {error && (
            <div style={{ 
              backgroundColor: 'var(--error-bg)', 
              color: 'var(--error-color)', 
              padding: '12px 16px', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '14px', 
              fontWeight: '500',
              borderLeft: '4px solid var(--error-color)' 
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500' }}>Email / Username</label>
            <input
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="search-input"
              placeholder="Masukkan email atau username"
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="search-input"
                placeholder="Masukkan password"
                disabled={isSubmitting}
                style={{ paddingRight: '100px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? 'Memproses...' : 'Login Masuk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
