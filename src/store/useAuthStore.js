import { create } from 'zustand';
import { auth, googleProvider } from '../firebase/config';
import { signInWithEmailAndPassword, signInWithPopup, signOut, onIdTokenChanged } from 'firebase/auth';

export const useAuthStore = create((set) => ({
  user: null,
  role: 'Viewer',
  isLoading: true,
  authError: null,

  initAuthListener: () => {
    return onIdTokenChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        set({ user: null, role: 'Viewer', isLoading: false, authError: null });
        return;
      }
      set({
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'Operator'
        },
        role: 'Viewer',
        isLoading: false,
        authError: null
      });
    });
  },

  loginWithEmail: async (email, password) => {
    set({ isLoading: true, authError: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      let friendlyMessage = 'Gagal masuk. Periksa kembali email dan sandi Anda.';
      if (error.code === 'auth/internal-error') friendlyMessage = 'Authorized Domain Vercel belum didaftarkan di Firebase.';
      set({ authError: friendlyMessage, isLoading: false });
      return { success: false, error: friendlyMessage };
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true, authError: null });
    try {
      await signInWithPopup(auth, googleProvider);
      return { success: true };
    } catch (error) {
      set({ authError: 'Otentikasi Google dibatalkan atau diblokir.', isLoading: false });
      return { success: false };
    }
  },

  logoutSecurely: async () => {
    set({ isLoading: true });
    await signOut(auth);
  }
}));

export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthRole = () => useAuthStore((state) => state.role);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.authError);
