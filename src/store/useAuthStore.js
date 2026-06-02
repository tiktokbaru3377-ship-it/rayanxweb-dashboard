import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  role: 'Viewer', // Admin, Operator, Viewer Default Fallback
  isAuthenticated: false,
  isLoading: true,
  setUser: (user, role = 'Viewer') => set({ user, role, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => set({ user: null, role: 'Viewer', isAuthenticated: false, isLoading: false })
}));
