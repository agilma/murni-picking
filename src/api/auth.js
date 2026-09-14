import { apiClient, APIError } from './client';


const LOGIN_ENDPOINT = import.meta.env.VITE_API_LOGIN_ENDPOINT || '/api/method/thunder_erp.api.auth.login_and_get_sid';

/**
 * Validate session strictly with backend
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
export const checkSession = async () => {
  try {
    const response = await apiClient.get('/api/method/frappe.auth.get_logged_user');
    // Depending on backend, might return { message: "user@email.com" }
    return { success: true, message: response.message };
  } catch (error) {
    return { success: false, error: error.message };
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

    return { success: true, data: response, user: sessionCheck.message };
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
