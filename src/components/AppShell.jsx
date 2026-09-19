import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, QrCode, Settings } from 'lucide-react';
import { useAuth, useCapabilities } from '../context/AuthContext';

const AppShell = () => {
  const { user } = useAuth();
  const capabilities = useCapabilities();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-secondary)', position: 'relative' }}>
      {/* Main Content Area */}
      <div style={{ flexGrow: 1, overflowY: 'auto', paddingBottom: '60px' }}>
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 100,
        maxWidth: '480px',
        margin: '0 auto'
      }}>
        {capabilities.canPicking && (
          <NavLink 
            to="/" 
            end
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
              textDecoration: 'none', fontSize: '12px', fontWeight: '500'
            })}
          >
            <Home size={20} />
            <span>Home</span>
          </NavLink>
        )}

        {capabilities.canCustomerPickup && (
          <NavLink 
            to="/pickup" 
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
              textDecoration: 'none', fontSize: '12px', fontWeight: '500'
            })}
          >
            <QrCode size={20} />
            <span>Pickup</span>
          </NavLink>
        )}

        <NavLink 
          to="/settings" 
          style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
            textDecoration: 'none', fontSize: '12px', fontWeight: '500'
          })}
        >
          <Settings size={20} />
          <span>Pengaturan</span>
        </NavLink>
      </div>
    </div>
  );
};

export default AppShell;
