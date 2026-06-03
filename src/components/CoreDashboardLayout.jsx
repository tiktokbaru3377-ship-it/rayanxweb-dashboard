import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useNavigate } from 'react-router-dom';

function CoreDashboardLayout() {
  const user = useAuthStore((state) => state.user);
  const logoutSecurely = useAuthStore((state) => state.logoutSecurely);
  const navigate = useNavigate();

  // Validasi Sesi Aktif: Antisipasi kebocoran state lokal
  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null; 

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans antialiased flex">
      
      {/* PANEL NAVIGASI KIRI (SIDEBAR) */}
      <aside className="w-66 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="mb-8 border-b border-white/5 pb-4">
            <h3 className="text-sm font-black tracking-widest text-white uppercase bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              RayanXWeb Core
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">MDM ENGINE v1.0.0</p>
          </div>
          
          <nav className="space-y-1">
            <div className="px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-bold tracking-wide uppercase cursor-default">
              Control Console
            </div>
          </nav>
        </div>

        {/* IDENTITAS OPERATOR AKTIF */}
        <div className="border-t border-white/10 pt-4 bg-slate-950/40 p-4 rounded-xl border border-white/5">
          <div className="mb-3">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Operator Node</p>
            <p className="text-xs font-semibold text-slate-300 truncate font-mono">{user.email}</p>
          </div>
          <button
            onClick={async () => {
              await logoutSecurely();
              navigate('/', { replace: true });
            }}
            className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg py-2 text-xs font-bold transition-all active:scale-[0.98]"
          >
            Terminate Session
          </button>
        </div>
      </aside>

      {/* AREA UTAMA MONITORING KONSOL */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Enterprise MDM Panel</h1>
            <p className="text-xs text-slate-400 mt-1">Sistem pemantauan node jaringan dan enkripsi perangkat keras secara langsung.</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full w-fit">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">All Systems Operational</span>
          </div>
        </header>

        {/* METRIK STATISTIK SISTEM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/30 border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Monitored Nodes</p>
            <p className="text-3xl font-black text-white font-mono tracking-tight">2,481</p>
          </div>
          <div className="bg-slate-900/30 border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gateway Sync Rate</p>
            <p className="text-3xl font-black text-blue-400 font-mono tracking-tight">99.98%</p>
          </div>
          <div className="bg-slate-900/30 border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Firewall Integrity</p>
            <p className="text-3xl font-black text-indigo-400 font-mono tracking-tight">SECURE</p>
          </div>
        </div>

        {/* AREA TAMPILAN DASHBOARD KOSONG (TEMPAT GRAFIK/TABEL BERADA) */}
        <div className="bg-slate-900/10 border border-white/5 rounded-2xl p-8 text-center border-dashed border-2 flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-sm font-bold text-slate-400 mb-1">Data Stream Active</p>
          <p className="text-xs text-slate-500 max-w-sm">Siap menerima suntikan data visualisasi core dari server backend Socket.io.</p>
        </div>

      </main>
    </div>
  );
}

export default CoreDashboardLayout;
