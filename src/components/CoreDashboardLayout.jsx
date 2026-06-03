import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area
} from 'recharts';
import { 
  LayoutDashboard, Server, Shield, Radio, Power, LogOut, 
  RefreshCw, Terminal, Activity, Cpu, HardDrive
} from 'lucide-react';

// DATA SIMULASI TELEMETRI MDM (Aman untuk Rendering Awal / No-SSR / Client Production)
const networkDataMock = [
  { time: '09:00', traffic: 120, cpu: 45, memory: 62 },
  { time: '09:05', traffic: 240, cpu: 55, memory: 64 },
  { time: '09:10', traffic: 180, cpu: 48, memory: 61 },
  { time: '09:15', traffic: 380, cpu: 78, memory: 75 },
  { time: '09:20', traffic: 410, cpu: 85, memory: 80 },
  { time: '09:25', traffic: 320, cpu: 65, memory: 72 },
  { time: '09:30', traffic: 490, cpu: 92, memory: 88 },
];

const deviceStatusMock = [
  { id: 'NODE-0X91', name: 'Singapore Gateway Edge', type: 'Relay Router', status: 'Active', load: '12%', ip: '139.99.12.82' },
  { id: 'NODE-0X45', name: 'US-East Core Server', type: 'Mainframe Compute', status: 'Active', load: '68%', ip: '142.250.74.46' },
  { id: 'NODE-0X23', name: 'Jakarta Database Relay', type: 'SQL Replication', status: 'Syncing', load: '45%', ip: '103.247.22.10' },
  { id: 'NODE-0X88', name: 'Backup Storage Area', type: 'Encrypted NAS', status: 'Standby', load: '2%', ip: '192.168.40.15' },
];

function CoreDashboardLayout() {
  const user = useAuthStore((state) => state.user);
  const logoutSecurely = useAuthStore((state) => state.logoutSecurely);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Proteksi Keras Sesi Login
  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans antialiased flex flex-col md:flex-row">
      
      {/* ================= REKAYASA SIDEBAR NAVIGASI ================= */}
      <aside className="w-full md:w-64 bg-slate-900/60 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/10 p-5 flex flex-col justify-between">
        <div>
          {/* Header Console Identity */}
          <div className="mb-8 border-b border-white/5 pb-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-widest text-white uppercase">
                RayanXWeb
              </h3>
              <p className="text-[10px] text-blue-400 font-mono font-bold tracking-wider">MDM CORE CONSOLE</p>
            </div>
          </div>
          
          {/* Menu Items */}
          <nav className="space-y-1.5">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'overview' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Core Overview</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('devices')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'devices' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Server className="h-4 w-4" />
              <span>Node Management</span>
            </button>
          </nav>
        </div>

        {/* Info Operator & Sakelar Sesi Keluar */}
        <div className="border-t border-white/10 pt-4 mt-6 md:mt-0 bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <div className="overflow-hidden">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Operator</p>
              <p className="text-xs font-semibold text-slate-300 truncate font-mono">{user.email}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await logoutSecurely();
              navigate('/', { replace: true });
            }}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl py-2 text-xs font-bold transition-all active:scale-[0.98]"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* ================= AREA KONTEN UTAMA OPERASIONAL ================= */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        
        {/* Top Floating Dashboard Bar */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">System Infrastructure Command</h1>
            <p className="text-xs text-slate-400 mt-1">Monitoring dan kontrol kluster infrastruktur global secara terenkripsi.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh}
              className="p-2.5 bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 rounded-xl transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Secure State</span>
            </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <>
            {/* GRID TELEMETRI UTAMA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl backdrop-blur-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network Bandwidth</p>
                  <p className="text-2xl font-black text-white font-mono mt-0.5">4.9 Gbps</p>
                </div>
              </div>
              <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl backdrop-blur-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cluster CPU Load</p>
                  <p className="text-2xl font-black text-white font-mono mt-0.5">64.2%</p>
                </div>
              </div>
              <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl backdrop-blur-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Storage Array</p>
                  <p className="text-2xl font-black text-white font-mono mt-0.5">81.4 TB</p>
                </div>
              </div>
              <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl backdrop-blur-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Radio className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Relays</p>
                  <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">182 / 182</p>
                </div>
              </div>
            </div>

            {/* SEKTOR ANALISIS GRAFIK VISUALISASI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Grafik Garis - Lalu Lintas Jaringan */}
              <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl backdrop-blur-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase">Core Network Real-Time Stream</h3>
                  <p className="text-[11px] text-slate-400">Data lalu lintas kilas balik 30 menit terakhir.</p>
                </div>
                {/* PRO-TIP PRODUCTION: Tinggi kaku h-[280px] mencegah Recharts crash atau mengalami blank rendering */}
                <div className="w-full h-[280px] text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={networkDataMock} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="traffic" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorTraffic)" name="Traffic (Mbps)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Grafik Batang - Beban CPU & Memori */}
              <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl backdrop-blur-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase">Node Computing Telemetry</h3>
                  <p className="text-[11px] text-slate-400">Beban komputasi CPU berbanding alokasi memori kluster.</p>
                </div>
                <div className="w-full h-[280px] text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={networkDataMock} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                      <Legend />
                      <Bar dataKey="cpu" fill="#6366f1" radius={[4, 4, 0, 0]} name="CPU (%)" />
                      <Bar dataKey="memory" fill="#a855f7" radius={[4, 4, 0, 0]} name="Memory (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {/* PANEL MANIFEST NODE PERANGKAT (TABEL DATA) */}
        {(activeTab === 'overview' || activeTab === 'devices') && (
          <div className="bg-slate-900/30 border border-white/5 rounded-2xl backdrop-blur-sm overflow-hidden border border-white/5">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">Active Edge Cluster Nodes</h3>
                <p className="text-[11px] text-slate-400">Daftar perangkat gateway MDM operasional terpantau.</p>
              </div>
              <div className="p-1.5 bg-slate-950 border border-white/10 text-slate-400 rounded-lg text-xs font-mono flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-blue-400" />
                <span>Status: Synced</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-white/5 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="p-4 font-black">Node ID</th>
                    <th className="p-4 font-black">Cluster Identity</th>
                    <th className="p-4 font-black">Hardware Spec</th>
                    <th className="p-4 font-black">Network IP</th>
                    <th className="p-4 font-black">Load Rate</th>
                    <th className="p-4 font-black text-right">Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {deviceStatusMock.map((node, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors text-slate-300">
                      <td className="p-4 font-bold text-blue-400">{node.id}</td>
                      <td className="p-4 text-white font-sans font-semibold">{node.name}</td>
                      <td className="p-4 text-slate-400">{node.type}</td>
                      <td className="p-4">{node.ip}</td>
                      <td className="p-4">{node.load}</td>
                      <td className="p-4 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          node.status === 'Active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {node.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default CoreDashboardLayout;
