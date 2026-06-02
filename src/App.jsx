import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from './store/useAuthStore';
import { useSocketStore } from './store/useSocketStore';
import { useToastStore } from './store/useToastStore';
import { auth } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { ThemeProvider } from './context/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ToastContainer from './components/common/ToastContainer';
import api from './services/api';

const queryClient = new QueryClient();

export default function App() {
  const { setUser, clearAuth, setLoading } = useAuthStore();
  const { socket, connectSocket, disconnectSocket } = useSocketStore();
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    const unsubscribeFromAuthObserver = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const res = await api.get('/auth/me');
          setUser(firebaseUser, res.data.user.role);
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

  // Pasang Listener Keamanan Global Real-time
  useEffect(() => {
    if (!socket) return;

    socket.on('notification_update', (data) => {
      addToast(`Device [${data.deviceId}] triggered panic signal: ${data.alertContext}`, 'panic');
    });

    return () => {
      socket.off('notification_update');
    };
  }, [socket, addToast]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
        <ToastContainer /> {/* Pipa peluncur alert mengambang global */}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
