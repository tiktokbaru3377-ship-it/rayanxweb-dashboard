import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useAuthLoading, useAuthUser } from './store/useAuthStore.js';

import Login from './pages/Login'; 
import CoreDashboardLayout from './components/CoreDashboardLayout'; 

function App() {
  const user = useAuthUser();
  const isLoading = useAuthLoading();
  const initAuthListener = useAuthStore((state) => state.initAuthListener);

  useEffect(() => {
    // Mengaktifkan radar pemantau status sesi otentikasi Firebase
    const unsubscribe = initAuthListener();
    return () => unsubscribe(); 
  }, [initAuthListener]);

  // Skema Layar Tunggu Otentikasi Sentral
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

  return (
    <BrowserRouter>
      <Routes>
        {/* RUTE GERBANG UTAMA: Jika sudah login, paksa lempar ke /dashboard */}
        <Route 
          path="/" 
          element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
        />
        
        {/* RUTE KONSOL MANAGEMENT: Jika belum login, tendang balik ke halaman awal */}
        <Route 
          path="/dashboard" 
          element={user ? <CoreDashboardLayout /> : <Navigate to="/" replace />} 
        />

        {/* PROTEKSI EXTRA: Alihkan rute tidak dikenal ke halaman root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
