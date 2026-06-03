import { useEffect } from 'react';
// Menggunakan modul store yang baru dan sudah tervalidasi lolos kompilasi
import { useAuthStore, useAuthLoading, useAuthUser } from './store/useAuthStore.js';

import Login from './pages/Login'; 

// BYPASS STRATEGY: Mengimpor layout menggunakan nama unik baru agar Git terpaksa mendeteksi berkas baru
import CoreDashboardLayout from './components/CoreDashboardLayout';

function App() {
  const user = useAuthUser();
  const isLoading = useAuthLoading();
  const initAuthListener = useAuthStore((state) => state.initAuthListener);

  useEffect(() => {
    // Memantau token otentikasi Firebase secara real-time
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

  // Pengalihan halaman otomatis pasca verifikasi token selesai
  return user ? <CoreDashboardLayout /> : <Login />;
}

export default App;
