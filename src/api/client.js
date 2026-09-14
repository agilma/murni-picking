const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Standardized error for API responses
 */
export class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Centralized API client for communicating with Thunder Picking API.
 * Uses credentials: 'include' to handle session cookies automatically.
 */
export const apiClient = {
  async post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async get(endpoint, params = {}) {
    const urlParams = new URLSearchParams(params).toString();
    const query = urlParams ? `?${urlParams}` : '';
    return this.request(`${endpoint}${query}`, {
      method: 'GET',
    });
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Crucial for sending/receiving 'sid' cookie
      });

      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        let errorMessage = 'Terjadi kesalahan pada server. Silakan coba lagi.';
        
        if (response.status === 401 || response.status === 403) {
          errorMessage = 'Sesi tidak valid. Silakan login kembali.';
        } else if (response.status === 404) {
          errorMessage = 'Resource tidak ditemukan.';
        } else if (response.status === 422) {
          errorMessage = 'Data tidak valid.';
        }
        
        throw new APIError(errorMessage, response.status, data);
      }

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      // Network errors (e.g. CORS failed, DNS failed, offline)
      throw new APIError('Tidak dapat terhubung ke server. Silakan coba lagi.', 0, null);
    }
  }
};
