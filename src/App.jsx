import { useEffect } from 'react';
// Menggunakan jalur eksplisit relatif super-aman untuk Linux Vercel
import { useAuthStore, useAuthLoading, useAuthUser } from './store/authStore.js';

import Login from './pages/Login.jsx'; 
import DashboardLayout from './components/DashboardLayout.jsx'; 

function App() {
  const user = useAuthUser();
  const isLoading = useAuthLoading();
  const initAuthListener = useAuthStore((state) => state.initAuthListener);

  useEffect(() => {
    // Menyalakan radar pemantau status login token Firebase
    const unsubscribe = initAuthListener();
    return () => unsubscribe(); 
  }, [initAuthListener]);

  // Render loading ring agar aplikasi responsif saat booting awal
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#020617] font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase animate-pulse">
            Verifying Security Credentials...
          </p>
        </div>
      </div>
    );
  }

  // Pengalihan halaman otomatis pasca verifikasi token selesai
  return user ? <DashboardLayout /> : <Login />;
}

export default App;
