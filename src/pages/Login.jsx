import { useState } from 'react';
// Mundur satu direktori menggunakan ../ menuju file useAuthStore.js
import { 
  useAuthStore, 
  useAuthLoading, 
  useAuthError 
} from '../store/useAuthStore.js';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const loginWithEmail = useAuthStore((state) => state.loginWithEmail);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const isLoading = useAuthLoading();
  const authError = useAuthError();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || isLoading) return;
    await loginWithEmail(email, password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans antialiased">
      <div className="w-full max-w-md bg-enterprise-darkCard/40 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-8">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black tracking-tight text-white mb-1">
            RayanXWeb MDM Core
          </h2>
          <p className="text-xs font-medium text-slate-400 tracking-wide">
            Enterprise Device Management Console
          </p>
        </div>

        {authError && (
          <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium rounded-lg p-3 text-center animate-pulse">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Email Address
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-enterprise-500 focus:ring-1 focus:ring-enterprise-500 transition-all disabled:opacity-50"
              placeholder="admin@rayanxweb.app"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Security Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-enterprise-500 focus:ring-1 focus:ring-enterprise-500 transition-all disabled:opacity-50"
              placeholder="••••••••"
              disabled={isLoading}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-enterprise-500 hover:bg-enterprise-600 disabled:bg-slate-800 text-white font-semibold rounded-lg py-2.5 text-sm transition-all shadow-lg active:scale-[0.99] disabled:pointer-events-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Verifying Credentials...</span>
              </div>
            ) : (
              'Authenticate Access'
            )}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <span className="absolute inset-x-0 top-1/2 h-px bg-white/10 -translate-y-1/2"></span>
          <span className="relative bg-[#0d1527] px-3 text-[10px] text-slate-500 uppercase tracking-widest font-black">
            Or Federated Auth
          </span>
        </div>

        <button
          onClick={loginWithGoogle}
          disabled={isLoading}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-slate-900 border border-white/10 hover:bg-slate-800 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google Provider" 
            className="w-4 h-4" 
          />
          <span>Identity Provider Google</span>
        </button>

      </div>
    </div>
  );
}

export default Login;
