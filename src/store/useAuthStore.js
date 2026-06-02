import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  role: 'Viewer',
  isLoading: true,
  setUser: (firebaseUser, assignedRole) => set({ 
    user: firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName } : null, 
    role: assignedRole || 'Viewer' 
  }),
  setLoading: (status) => set({ isLoading: status }),
  clearAuth: () => set({ user: null, role: 'Viewer', isLoading: false }),
}));

// ATOMIC PERFORMANCE SELECTORS (Mencegah Re-render Komponen Induk)
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthRole = () => useAuthStore((state) => state.role);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
