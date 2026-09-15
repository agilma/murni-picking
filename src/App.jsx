import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { OrderProvider, useOrders } from './context/OrderContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import Home from './pages/Home';
import Picking from './pages/Picking';
import Pickup from './pages/Pickup/index';
import Login from './pages/Login/index';
import Success from './pages/Success';
import Settings from './pages/Settings';

const Toast = () => {
  const { toast } = useOrders();
  
  if (!toast) return null;
  
  return (
    <div className="toast-container">
      <div className={`toast ${toast.type}`}>
        {toast.message}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <OrderProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* App Shell Routes */}
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="/" element={<Home />} />
              <Route path="/pickup" element={<Pickup />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Standalone Authenticated Routes */}
            <Route path="/picking" element={
              <ProtectedRoute>
                <Picking />
              </ProtectedRoute>
            } />
            <Route path="/success" element={
              <ProtectedRoute>
                <Success />
              </ProtectedRoute>
            } />
            
            {/* Fallback for unknown routes */}
            <Route path="*" element={
              <ProtectedRoute>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px', padding: '16px' }}>
                  <h2 className="text-xl text-center">Halaman tidak ditemukan</h2>
                  <p className="text-muted text-center">Halaman yang Anda cari tidak tersedia.</p>
                  <a href="/" className="btn btn-primary" style={{ maxWidth: '200px' }}>Kembali ke Home</a>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
          <Toast />
        </BrowserRouter>
      </OrderProvider>
    </AuthProvider>
  );
};

export default App;
