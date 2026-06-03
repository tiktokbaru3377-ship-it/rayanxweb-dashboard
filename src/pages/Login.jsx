import { useState } from 'react';
// PERBAIKAN UTAMA: Menggunakan Path Alias '@/' untuk menjamin Vercel Linux mendeteksi file tanpa galat
import { 
  useAuthStore, 
  useAuthLoading, 
  useAuthError 
} from '@/store/authStore';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Mengambil fungsi aksi dan state terisolasi dari Zustand Store secara atomik
  const loginWithEmail = useAuthStore((state) => state.loginWithEmail);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const isLoading = useAuthLoading();
  const authError = useAuthError();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validasi dasar guard-clause sebelum melemparkan data ke jaringan internet
    if (!email || !password || isLoading) return;
    
    // Mengeksekusi pipa otentikasi Firebase
    await loginWithEmail(email, password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans antialiased selection:bg-enterprise-500 selection:text-white">
      {/* Container Card Glassmorphism */}
      <div className="w-full max-w-md bg-enterprise-darkCard/40 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-8 transition-all duration-300 hover:border-white/20">
        
        {/* Header Title Console */}
        <div className="text-center mb-6 select-none">
          <h2 className="text-2xl font-black tracking-tight text-white mb-1">
            RayanXWeb MDM Core
          </h2>
          <p className="text-xs font-medium text-slate-400 tracking-wide">
            Enterprise Device Management Console
          </p>
        </div>

        {/* Kotak Peringatan Galat / Alert System */}
        {authError && (
          <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg p-3 text-center animate-fade-in">
            {authError}
          </div>
        )}

        {/* Form Otentikasi Utama */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 select-none">
              Email Address
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-enterprise-500 focus:ring-1 focus:ring-enterprise-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              placeholder="admin@rayanxweb.app"
              disabled={isLoading}
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 select-none">
              Security Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-enterprise-500 focus:ring-1 focus:ring-enterprise-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              placeholder="••••••••"
              disabled={isLoading}
              required
              autoComplete="current-password"
            />
          </div>

          {/* Tombol Akses Utama */}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full h-10 bg-enterprise-500 hover:bg-enterprise-600 disabled:bg-slate-900 border border-transparent disabled:border-white/5 text-white font-semibold rounded-lg text-sm transition-all shadow-lg shadow-enterprise-500/10 active:scale-[0.99] disabled:pointer-events-none disabled:text-slate-500"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-white"></div>
                <span className="text-slate-400 font-medium">Verifying Credentials...</span>
              </div>
            ) : (
              'Authenticate Access'
            )}
          </button>
        </form>

        {/* Pembatas Jalur Otentikasi Federasi */}
        <div className="relative my-6 text-center select-none">
          <span className="absolute inset-x-0 top-1/2 h-px bg-white/10 -translate-y-1/2"></span>
          <span className="relative bg-[#0b1222] px-3 text-[10px] text-slate-500 uppercase tracking-widest font-black">
            Or Federated Auth
          </span>
        </div>

        {/* Tombol Penyedia Identitas Google Sign-In */}
        <button
          onClick={loginWithGoogle}
          disabled={isLoading}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-850 border border-white/10 text-white rounded-lg py-2.5 text-sm font-semibold transition-all active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google Provider Icon" 
            className="w-4 h-4 select-none" 
          />
          <span>Identity Provider Google</span>
        </button>

      </div>
    </div>
  );
}

export default Login;
