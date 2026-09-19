import { apiClient, APIError } from './client';


const LOGIN_ENDPOINT = import.meta.env.VITE_API_LOGIN_ENDPOINT || '/api/method/thunder_erp.api.auth.login_and_get_sid';

/**
 * Validate session strictly with backend
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
export const checkSession = async () => {
  try {
    // Hit an endpoint that requires authentication to verify cookie works
    await apiClient.get('/api/method/frappe.client.get_list?doctype=Delivery Note&limit_page_length=1');
    
    // Retrieve username from localStorage if available, otherwise fallback
    const stored = localStorage.getItem('murni_user_session');
    let username = 'user';
    if (stored) {
      try { username = JSON.parse(stored).username || 'user'; } catch (e) {}
    }
    return { success: true, message: username };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Fetch Event Booth from User Permission
 * @param {string} username 
 * @returns {Promise<string[]|null>}
 */
export const getBoothPermission = async (username) => {
  try {
    const response = await apiClient.get('/api/resource/User Permission', {
      filters: JSON.stringify([['user', '=', username], ['allow', '=', 'Event Booth']]),
      fields: JSON.stringify(['for_value'])
    });
    if (response.data && response.data.length > 0) {
      return response.data.map(d => d.for_value);
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch Event Booth permission:", error);
    return null;
  }
};

/**
 * Authenticate with ERPNext (Real API)
 * @param {string} usr - Username or email
 * @param {string} pwd - Password
 * @returns {Promise} Resolves with { success, error, message }
 */
export const login = async (usr, pwd) => {
  try {
    const response = await apiClient.post(LOGIN_ENDPOINT, { usr, pwd });
    
    // Check if API returns an explicit success or if there's any implicit token
    // The current documented response says it returns `{ "message": [...] }` Delivery notes.
    // If we reach here, HTTP status was 200/20x.

    // STRICT VALIDATION: Prove the session works by calling checkSession
    const sessionCheck = await checkSession();
    if (!sessionCheck.success) {
      return { success: false, error: 'Login API merespons sukses tetapi session/cookie tidak dapat digunakan (CORS/Cookie policy blocker).' };
    }

    const loggedUser = response.message?.user || response.message?.email || usr;
    
    // Fetch Event Booth permission
    const eventBooth = await getBoothPermission(loggedUser);

    return { 
      success: true, 
      data: response, 
      user: loggedUser,
      role_profile_name: response.role_profile_name || response.message?.role_profile_name,
      event_booth: eventBooth
    };
  } catch (error) {
    let errorMessage = error.message;
    
    // Special handling for login specific errors (e.g., wrong credentials)
    if (error instanceof APIError && (error.status === 401 || error.status === 403)) {
      errorMessage = 'Email/username atau password salah.';
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * Logout from ERPNext
 * @returns {Promise}
 */
export const logout = async () => {
  // No real endpoint confirmed for logout yet.
  // We just return success to let frontend clear local state.
  return { success: true };
};

/**
 * Validate session by getting logged user
 * @returns {Promise}
 */
export const getLoggedUser = async () => {
  // Use real session check instead of local storage simulation
  return await checkSession();
};

/**
 * Fetch full user profile from Frappe
 * @param {string} username
 */
export const getUserProfile = async (username) => {
  try {
    const response = await apiClient.get(`/api/resource/User/${username}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
