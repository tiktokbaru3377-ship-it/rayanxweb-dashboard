import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import LoginScreen from './pages/Login'; // Komponen form Anda
import DashboardLayout from './components/DashboardLayout'; // Halaman utama dashboard

function App() {
  const { isAuthenticated, isAuthenticating, initAuthListener } = useAuthStore();

  useEffect(() => {
    // Jalankan listener pemantau token Firebase begitu aplikasi di-boot
    const unsubscribe = initAuthListener();
    return () => unsubscribe(); // Bersihkan listener saat unmount untuk mencegah memory leak
  }, [initAuthListener]);

  // RENDER LOADING SPIN ULTRA LIGHT (Mencegah tampilan HTML kosong saat memproses token)
  if (isAuthenticating) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-enterprise-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-400 animate-pulse">Menghubungkan ke Jaringan MDM...</p>
        </div>
      </div>
    );
  }

  // Jika terverifikasi, langsung lempar ke Dashboard. Jika tidak, kunci di halaman Login.
  return isAuthenticated ? <DashboardLayout /> : <LoginScreen />;
}

export default App;
