import { useEffect } from 'react';
// Jalur store baru yang sudah sukses
import { useAuthStore, useAuthLoading, useAuthUser } from './store/useAuthStore.js';

// PERBAIKAN: Impor tanpa ekstensi agar Vite yang mencarikan file aslinya di Vercel
import Login from './pages/Login'; 
import DashboardLayout from './components/CoreDashboardLayout'; 

function App() {
  const user = useAuthUser();
  const isLoading = useAuthLoading();
  const initAuthListener = useAuthStore((state) => state.initAuthListener);

  useEffect(() => {
    // Memantau token Firebase secara real-time
    const unsubscribe = initAuthListener();
    return () => unsubscribe(); 
  }, [initAuthListener]);

  // Loading Screen minimalis berkecepatan tinggi
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

  // Pintu gerbang pembagi halaman dashboard vs login
  return user ? <DashboardLayout /> : <Login />;
}

export default App;
