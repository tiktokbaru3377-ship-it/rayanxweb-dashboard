import { create } from 'zustand';
import { auth, googleProvider } from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onIdTokenChanged 
} from 'firebase/auth';
import axios from 'axios';

// 1. Konfigurasi Instans Ekspedisi HTTP Axios dengan Batas Waktu Tunggu 5 Detik
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 5000 // Memutus request jika backend macet, mencegah loading selamanya
});

export const useAuthStore = create((set, get) => ({
  user: null,
  role: 'Viewer',
  isLoading: true, // Memastikan aplikasi memulai dengan state memverifikasi token
  authError: null,

  // 2. ORKESTRASI AUTOMATIS: Mendengarkan Perubahan Status Otentikasi Firebase
  initAuthListener: () => {
    // onIdTokenChanged memantau login, logout, dan pembaruan token berkala otomatis
    return onIdTokenChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // Jika tidak ada user (Logout atau belum login)
        set({ user: null, role: 'Viewer', isLoading: false, authError: null });
        delete api.defaults.headers.common['Authorization'];
        return;
      }

      try {
        // Ambil token JWT Firebase secara instan dari cache lokal browser
        const token = await firebaseUser.getIdToken();
        
        // Suntikkan token ke header global Axios untuk semua request ke backend Node.js
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Sinkronisasi kilat ke backend untuk mengambil Custom Claims / Role dari MongoDB
        // Jika backend Anda belum siap, Anda bisa menutup baris res hingga set sementara waktu
        const res = await api.post('/v1/auth/sync', {});
        const assignedRole = res.data?.role || 'Viewer';

        set({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'Operator'
          },
          role: assignedRole,
          isLoading: false,
          authError: null
        });
      } catch (error) {
        console.error('[AUTH SYNC FAULT]:', error.message);
        
        // Fallback: Jika backend mati tetapi Firebase aktif, tetap izinkan masuk dengan role terendah
        set({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'Operator'
          },
          role: 'Viewer',
          isLoading: false
        });
      }
    });
  },

  // 3. LOGIKA MASUK VIA EMAIL & PASSWORD (KILAT & AMAN)
  loginWithEmail: async (email, password) => {
    set({ isLoading: true, authError: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Status user dan pengalihan halaman akan diurus otomatis oleh initAuthListener di atas
      return { success: true };
    } catch (error) {
      let friendlyMessage = 'Gagal terhubung ke peladen otentikasi.';
      if (error.code === 'auth/wrong-password') friendlyMessage = 'Kata sandi keamanan salah.';
      if (error.code === 'auth/user-not-found') friendlyMessage = 'Akun email tidak terdaftar.';
      if (error.code === 'auth/invalid-email') friendlyMessage = 'Format alamat email tidak sah.';
      if (error.code === 'auth/internal-error') friendlyMessage = 'Firebase Error: Periksa Authorized Domain Vercel.';
      
      set({ authError: friendlyMessage, isLoading: false });
      return { success: false, error: friendlyMessage };
    }
  },

  // 4. LOGIKA MASUK VIA GOOGLE IDENTITY PROVIDER
  loginWithGoogle: async () => {
    set({ isLoading: true, authError: null });
    try {
      await signInWithPopup(auth, googleProvider);
      return { success: true };
    } catch (error) {
      let friendlyMessage = 'Otentikasi Google dibatalkan atau diblokir.';
      if (error.code === 'auth/internal-error') friendlyMessage = 'Authorized Domain Vercel belum didaftarkan di Firebase.';
      set({ authError: friendlyMessage, isLoading: false });
      return { success: false, error: friendlyMessage };
    }
  },

  // 5. LOGIKA KELUAR SISTEM (LOGOUT)
  logoutSecurely: async () => {
    set({ isLoading: true });
    try {
      await signOut(auth);
    } catch (error) {
      set({ isLoading: false });
    }
  }
}));

// ATOMIC PERFORMANCE SELECTORS (Mencegah Re-render Komponen Induk)
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthRole = () => useAuthStore((state) => state.role);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.authError);
