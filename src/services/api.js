import axios from 'axios';
import { auth } from '../firebase/config';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.rayanx.internal/v1',
  timeout: 15000,
});

// Antrean untuk menampung permintaan API saat offline
let offlineRequestQueue = [];
let isListeningToNetworkChange = false;

const processOfflineQueue = (isAvailable) => {
  if (!isAvailable) return;
  offlineRequestQueue.forEach((request) => request());
  offlineRequestQueue = [];
};

// Daftarkan event listener global untuk mendeteksi status jaringan
if (typeof window !== 'undefined' && !isListeningToNetworkChange) {
  window.addEventListener('online', () => processOfflineQueue(true));
  isListeningToNetworkChange = true;
}

// REQUEST INTERCEPTOR: Injeksi Bearer Token Enkripsi
api.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      // Dapatkan token ID segar dari Firebase SDK
      const token = await currentUser.getIdToken(false);
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['X-Console-Client-Time'] = Date.now();
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Auto-Retry, Offline Queue, dan Defensif Error Handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Skenario A: Penanganan Token Expired (HTTP 401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const freshToken = await auth.currentUser?.getIdToken(true);
        originalRequest.headers.Authorization = `Bearer ${freshToken}`;
        return api(originalRequest);
      } catch (authError) {
        return Promise.reject(authError);
      }
    }

    // Skenario B: Perangkat Offline / Network Error
    if (!window.navigator.onLine || error.message === 'Network Error') {
      return new Promise((resolve) => {
        offlineRequestQueue.push(() => {
          resolve(api(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

export default api;
