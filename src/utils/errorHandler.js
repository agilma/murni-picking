/**
 * Centralized error parser to convert raw API/network errors into safe,
 * user-friendly Indonesian messages for the UI.
 * 
 * @param {Error} error - The caught error object
 * @param {string} fallbackMsg - A fallback message if the error is unknown
 * @returns {string} Safe UI message
 */
export const parseApiError = (error, fallbackMsg = 'Terjadi kesalahan yang tidak dapat diproses. Silakan coba lagi.') => {
  // If it's our custom APIError from client.js
  if (error && error.name === 'APIError') {
    // Network Error (status 0)
    if (error.status === 0) {
      return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
    }
    
    // Auth errors (401, 403)
    if (error.status === 401 || error.status === 403) {
      return 'Sesi tidak valid atau kredensial salah.';
    }
    
    // Validation errors (422)
    if (error.status === 422) {
      // If backend provides a specific safe message in data, we could use it.
      // But for now, returning a safe generic message.
      return 'Data tidak valid. Periksa kembali input Anda.';
    }

    // Default API error message (e.g. 500)
    if (error.message) {
      // client.js already provides some safe messages, but we override here to be sure
      // it doesn't expose technical details.
      return 'Terjadi masalah pada server. Silakan coba lagi.';
    }
  }

  // Native network errors (e.g. fetch failed entirely before APIError wrapper)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
  }

  return fallbackMsg;
};
