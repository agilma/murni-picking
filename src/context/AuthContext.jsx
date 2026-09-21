import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { login as apiLogin, logout as apiLogout, getLoggedUser } from '../api/auth';
import { normalizeRoleProfile, getCapabilities } from '../utils/capabilities';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await getLoggedUser();
        // ERPNext returns 'Guest' if not logged in
        if (response.success && response.message && response.message !== 'Guest') {
          const username = response.message;
          
          let roleProfileName = 'Unknown';
          let eventBooth = null;
          let full_name = null;
          let appMode = 'picking';

          // Restore role_profile_name and event_booth from localStorage if available
          const storedUserStr = localStorage.getItem('murni_user_session');
          if (storedUserStr) {
            try {
              const storedUser = JSON.parse(storedUserStr);
              if (storedUser && storedUser.username === username) {
                roleProfileName = storedUser.roleProfileName || 'Unknown';
                eventBooth = storedUser.eventBooth || null;
                full_name = storedUser.full_name || null;
                appMode = storedUser.appMode || 'picking';
              }
            } catch (e) {
              console.error('Failed to parse stored user session');
            }
          }

          const roleProfile = normalizeRoleProfile(roleProfileName);
          const capabilities = getCapabilities(appMode);



          setUser({ 
            username,
            full_name,
            roleProfileName,
            roleProfile,
            capabilities,
            eventBooth,
            appMode
          });
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        // If API fails (e.g., 401/403), session is invalid
        console.error("Session validation failed:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiLogin(username, password);
      
      if (!response.success) {
        return { success: false, error: response.error };
      }

      const loggedInUser = response.user || username;
      
      const roleProfileName = response.role_profile_name || 'Unknown';
      const eventBooth = response.event_booth || null;
      const appMode = response.appMode || 'picking';
      
      const roleProfile = normalizeRoleProfile(roleProfileName);
      const capabilities = getCapabilities(appMode);



      const userData = { 
        username: loggedInUser,
        full_name: response.full_name,
        roleProfileName,
        roleProfile,
        capabilities,
        eventBooth,
        appMode
      }; 
      
      localStorage.setItem('murni_user_session', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      localStorage.removeItem('murni_user_session');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const useCapabilities = () => {
  const { user } = useAuth();
  return user?.capabilities || getCapabilities('Unknown');
};
