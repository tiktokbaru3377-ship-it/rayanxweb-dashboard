import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area
} from 'recharts';
import { 
  LayoutDashboard, Server, Shield, Radio, LogOut, 
  RefreshCw, Terminal, Activity, Cpu, HardDrive,
  Sliders, Smartphone, CheckCircle2, AlertTriangle, Play
} from 'lucide-react';

// =========================================================================
// MAPPING VARIABEL LINGKUNGAN VITE (DIINJEKSI LANGSUNG DARI DASBOR VERCEL)
// =========================================================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/v1';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:5000';

function CoreDashboardLayout() {
  const user = useAuthStore((state) => state.user);
  const logoutSecurely = useAuthStore((state) => state.logoutSecurely);
  const navigate = useNavigate();
  
  // Tab Navigation State
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // State Data HTTP (Axios)
  const [deviceStatus, setDeviceStatus] = useState([]);
  const [systemStats, setSystemStats] = useState({
    bandwidth: '0 Gbps',
    cpuLoad: '0%',
    storage: '0 TB',
    activeRelays: '0 / 0'
  });

  // State Data Real-time (Socket.io)
  const [networkData, setNetworkData] = useState([]);
  const [adbLogs, setAdbLogs] = useState(['[SYSTEM] ADB Shell Pipeline initialized. Waiting for device connection...']);
  const [adbCommand, setAdbCommand] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  
  const terminalEndRef = useRef(null);

  // Proteksi Keamanan Sesi Sisi Klien
  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Autoscroll untuk Terminal ADB Shell
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [adbLogs]);

  // =========================================================================
  // 1. PIPELINE REST API FETCHING (AXIOS)
  // =========================================================================
  const fetchBackendData = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      // Fetch Manifest Device List
      const deviceRes = await axios.get(`${API_URL}/devices`, {
        headers: { Authorization: `Bearer ${user?.uid}` }
      });
      setDeviceStatus(deviceRes.data || []);
      if (deviceRes.data && deviceRes.data.length > 0 && !selectedDevice) {
        setSelectedDevice(deviceRes.data[0]);
      }

      // Fetch Global Infrastructure Statistics Metrics
      const statsRes = await axios.get(`${API_URL}/stats`, {
        headers: { Authorization: `Bearer ${user?.uid}` }
      });
      setSystemStats(statsRes.data || {
        bandwidth: '0 Gbps',
        cpuLoad: '0%',
        storage: '0 TB',
        activeRelays: '0 / 0'
      });
    } catch (error) {
      console.error("REST Execution Error:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBackendData();
    }
  }, [user]);

  // =========================================================================
  // 2. PIPELINE WEBSOCKET DATA STREAM (SOCKET.IO)
  // =========================================================================
  useEffect(() => {
    if (!user) return;

    // Inisialisasi Handshake Secure WebSocket
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      secure: true,
      auth: { token: user.uid }
    });

    // Mendengarkan Aliran Data Telemetri Real-time (Charts)
    socket.on('telemetry-stream', (incomingData) => {
      setNetworkData((prevData) => {
        const updatedData = [...prevData, incomingData];
        // Batasi maksimal 12 baris data di memori untuk menjaga performa rendering
        return updatedData.length > 12 ? updatedData.slice(1) : updatedData;
      });
    });

    // Mendengarkan Log Keluaran Eksekusi ADB Shell
    socket.on('adb-terminal-output', (logLine) => {
      setAdbLogs((prevLogs) => [...prevLogs, logLine]);
    });

    // Mendengarkan Perubahan Mutasi Status Node dari Server
    socket.on('node-status-change', (updatedNode) => {
      setDeviceStatus((prevDevices) => 
        prevDevices.map((device) => 
          device.id === updatedNode.id ? { ...device, ...updatedNode } : device
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // =========================================================================
  // 3. FUNGSI EKSEKUSI UTST (ADB COMMAND INJECTION)
  // =========================================================================
  const handleSendAdbCommand = async (e) => {
    e.preventDefault();
    if (!adbCommand.trim() || !selectedDevice) return;

    const cmd = adbCommand;
    setAdbLogs((prev) => [...prev, `$ ${selectedDevice.id}: ${cmd}`]);
    setAdbCommand('');

    try {
      await axios.post(`${API_URL}/adb/execute`, {
        deviceId: selectedDevice.id,
        command: cmd
      }, {
        headers: { Authorization: `Bearer ${user?.uid}` }
      });
    } catch (error) {
      setAdbLogs((prev) => [...prev, `[ERROR] Failed to dispatch payload command to network node.`]);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans antialiased flex flex-col md:flex-row">
      
      {/* ================= SIDEBAR NAVIGASI PANEL ================= */}
      <aside className="w-full md:w-64 bg-slate-900/60 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/10 p-5 flex flex-col justify-between">
        <div>
          {/* Brand Identity */}
          <div className="mb-8 border-b border-white/5 pb-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-widest text-white uppercase">RayanXWeb</h3>
              <p className="text-[10px] text-blue-400 font-mono font-bold tracking-wider">ENTERPRISE CONSOLE</p>
            </div>
          </div>
          
          {/* Navigasi Bilah Samping */}
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
              <span>Core Infrastructure</span>
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
              <span>Node Manifest</span>
            </button>

            <button 
              onClick={() => setActiveTab('terminal')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'terminal' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Terminal className="h-4 w-4" />
              <span>ADB Shell Pipeline</span>
            </button>
          </nav>
        </div>

        {/* Info Aktif Sesi Operator */}
        <div className="border-t border-white/10 pt-4 mt-6 md:mt-0 bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <div className="overflow-hidden">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Operator Node</p>
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

      {/* ================= AREA UTAMA OPERASIONAL CONTROLLER ================= */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        
        {/* Floating Top Bar Dashboard */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">System Infrastructure Command</h1>
            <p className="text-xs text-slate-400 mt-1">Terhubung murni menggunakan REST API Kluster & Secure WebSocket Link.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchBackendData}
              className="p-2.5 bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 rounded-xl transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping"></span>
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider">Live API Tunnel</span>
            </div>
          </div>
        </header>

        {/* ================= VIEW: OVERVIEW (METRICS + CHARTS) ================= */}
        {activeTab === 'overview' && (
          <>
            {/* GRID TELEMETRI STATISTIK KONSOL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl backdrop-blur-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network Bandwidth</p>
                  <p className="text-2xl font-black text-white font-mono mt-0.5">{systemStats.bandwidth}</p>
                </div>
              </div>
              <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl backdrop-blur-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cluster CPU Load</p>
                  <p className="text-2xl font-black text-white font-mono mt-0.5">{systemStats.cpuLoad}</p>
                </div>
              </div>
              <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl backdrop-blur-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Storage Array</p>
                  <p className="text-2xl font-black text-white font-mono mt-0.5">{systemStats.storage}</p>
                </div>
              </div>
              <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl backdrop-blur-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Radio className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Relays</p>
                  <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{systemStats.activeRelays}</p>
                </div>
              </div>
            </div>

            {/* SEKTOR SEBARAN VISUALISASI GRAFIK REAL-TIME */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Grafik Aliran Bandwidth Jaringan */}
              <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl backdrop-blur-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase">Core Network Real-Time Stream</h3>
                  <p className="text-[11px] text-slate-400">Injeksi data langsung per detik dari WebSocket pipeline.</p>
                </div>
                <div className="w-full h-[280px] text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={networkData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

              {/* Grafik Alokasi Beban Hardware Komputasi */}
              <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl backdrop-blur-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase">Node Computing Telemetry</h3>
                  <p className="text-[11px] text-slate-400">Fluktuasi beban CPU kluster dan ketersediaan memori server.</p>
                </div>
                <div className="w-full h-[280px] text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={networkData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

        {/* ================= VIEW: MANIFEST DATA DEVICES (TABEL REST) ================= */}
        {(activeTab === 'overview' || activeTab === 'devices') && (
          <div className="bg-slate-900/30 border border-white/5 rounded-2xl backdrop-blur-sm overflow-hidden mb-8">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">Active Edge Cluster Nodes</h3>
                <p className="text-[11px] text-slate-400">Manifes pemantauan perangkat keras MDM terhubung database.</p>
              </div>
              <div className="p-1.5 bg-slate-950 border border-white/10 text-slate-400 rounded-lg text-xs font-mono flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-blue-400" />
                <span>REST Status: Synced</span>
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
                  {deviceStatus.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500 font-sans">
                        Tidak ada kluster perangkat keras terhubung. Jalankan refresh REST API.
                      </td>
                    </tr>
                  ) : (
                    deviceStatus.map((node, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors text-slate-300">
                        <td className="p-4 font-bold text-blue-400">{node.id}</td>
                        <td className="p-4 text-white font-sans font-semibold">{node.name}</td>
                        <td className="p-4 text-slate-400">{node.type}</td>
                        <td className="p-4">{node.ip}</td>
                        <td className="p-4">{node.load}</td>
                        <td className="p-4 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            node.status === 'Active' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {node.status === 'Active' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                            {node.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= VIEW: LIVE ADB SHELL COMMAND INTERACTION ================= */}
        {activeTab === 'terminal' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Kolom Kiri: Pilihan Target Perangkat Node */}
            <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl backdrop-blur-sm h-fit">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-3">Target Node Selector</h3>
              <p className="text-xs text-slate-400 mb-4">Pilih perangkat keras MDM aktif sebelum melakukan injeksi payload ADB shell script.</p>
              
              <div className="space-y-2">
                {deviceStatus.map((dev) => (
                  <button
                    key={dev.id}
                    onClick={() => setSelectedDevice(dev)}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                      selectedDevice?.id === dev.id
                        ? 'bg-blue-600/10 border-blue-500 text-white shadow-lg'
                        : 'bg-slate-950/40 border-white/5 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Smartphone className={`h-5 w-5 ${selectedDevice?.id === dev.id ? 'text-blue-400' : 'text-slate-500'}`} />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">{dev.name}</p>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">{dev.id} • {dev.ip}</p>
                      </div>
                    </div>
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dev.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  </button>
                ))}
              </div>
            </div>

            {/* Kolom Kanan: Jendela Konsol Terminal Interaktif */}
            <div className="lg:col-span-2 bg-slate-950 border border-white/10 rounded-2xl flex flex-col h-[520px] shadow-2xl overflow-hidden">
              {/* Header Terminal */}
              <div className="bg-slate-900/80 px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-500/40 border border-red-500/50"></span>
                    <span className="h-3 w-3 rounded-full bg-amber-500/40 border border-amber-500/50"></span>
                    <span className="h-3 w-3 rounded-full bg-emerald-500/40 border border-emerald-500/50"></span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400 ml-2">
                    adb_pipeline@{selectedDevice ? selectedDevice.id.toLowerCase() : 'node_offline'}: ~
                  </span>
                </div>
                <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono">
                  WSS ENCRYPTED
                </span>
              </div>

              {/* Log Output Jendela Terminal */}
              <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-slate-300 space-y-1.5 selection:bg-blue-500/30">
                {adbLogs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`whitespace-pre-wrap leading-relaxed ${
                      log.startsWith('$') ? 'text-blue-400 font-bold' : 
                      log.startsWith('[ERROR]') ? 'text-red-400' : 
                      log.startsWith('[SYSTEM]') ? 'text-purple-400' : 'text-slate-300'
                    }`}
                  >
                    {log}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>

              {/* Baris Input Perintah Shell Injection */}
              <form onSubmit={handleSendAdbCommand} className="p-4 bg-slate-900/40 border-t border-white/5 flex gap-3">
                <div className="flex-1 bg-slate-950 rounded-xl border border-white/10 px-4 flex items-center focus-within:border-blue-500 transition-colors">
                  <span className="text-blue-500 font-mono text-xs font-bold mr-2 select-none">$</span>
                  <input
                    type="text"
                    value={adbCommand}
                    onChange={(e) => setAdbCommand(e.target.value)}
                    disabled={!selectedDevice}
                    placeholder={selectedDevice ? `Masukkan perintah ADB untuk shell ${selectedDevice.id}...` : "Silakan pilih target perangkat."}
                    className="w-full bg-transparent border-none outline-none py-3 font-mono text-xs text-white placeholder-slate-600 disabled:cursor-not-allowed"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!selectedDevice || !adbCommand.trim()}
                  className="px-5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white disabled:text-slate-600 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:scale-100"
                >
                  <Play className="h-4 w-4 fill-current" />
                </button>
              </form>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default CoreDashboardLayout;