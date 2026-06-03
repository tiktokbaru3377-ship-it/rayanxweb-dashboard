import { useEffect } from 'react';

// MENERAPKAN PATH ALIAS: Bypass deteksi relatif Linux Vercel
import { useAuthStore, useAuthLoading, useAuthUser } from '@/store/authStore';

import Login from '@/pages/Login'; 
import DashboardLayout from '@/components/DashboardLayout'; 

function App() {
  const user = useAuthUser();
  const isLoading = useAuthLoading();
  const initAuthListener = useAuthStore((state) => state.initAuthListener);

  useEffect(() => {
    // Jalankan radar pemantau token Firebase Auth
    const unsubscribe = initAuthListener();
    return () => unsubscribe(); 
  }, [initAuthListener]);

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

  return user ? <DashboardLayout /> : <Login />;
}

export default App;
