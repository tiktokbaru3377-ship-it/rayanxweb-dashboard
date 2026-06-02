import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from './store/useAuthStore';
import { useSocketStore } from './store/useSocketStore';
import { auth } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { ThemeProvider } from './context/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from './services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export default function App() {
  const { setUser, clearAuth, setLoading } = useAuthStore();
  const { connectSocket, disconnectSocket } = useSocketStore();

  useEffect(() => {
    // Pengawas daur hidup otentikasi Firebase (Firebase Auth State Observer Engine)
    const unsubscribeFromAuthObserver = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const res = await api.get('/auth/me');
          setUser(firebaseUser, res.data.user.role);
          // Nyalakan koneksi real-time socket pipe begitu token terverifikasi aman
          await connectSocket();
        } catch (error) {
          setUser(firebaseUser, 'Viewer');
          await connectSocket();
        }
      } else {
        clearAuth();
        disconnectSocket();
      }
      setLoading(false);
    });

    return () => unsubscribeFromAuthObserver();
  }, [setUser, clearAuth, setLoading, connectSocket, disconnectSocket]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
