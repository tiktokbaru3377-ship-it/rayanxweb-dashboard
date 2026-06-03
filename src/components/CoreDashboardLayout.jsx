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
  Sliders, Smartphone, CheckCircle2, AlertTriangle, Play,
  PlusCircle, CpuCore, SmartphoneCharging, QrCode, Code2, Link2, CheckSquare, Layers, ArrowRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/v1';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:5000';

function CoreDashboardLayout() {
  const user = useAuthStore((state) => state.user);
  const logoutSecurely = useAuthStore((state) => state.logoutSecurely);
  const navigate = useNavigate();
  
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('overview');
  const [enrollmentMethod, setEnrollmentMethod] = useState('client-app');
  const [wizardStep, setWizardStep] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Data States
  const [deviceStatus, setDeviceStatus] = useState([]);
  const [systemStats, setSystemStats] = useState({ bandwidth: '0 Gbps', cpuLoad: '0%', storage: '0 TB', activeRelays: '0 / 0' });
  const [networkData, setNetworkData] = useState([]);
  const [adbLogs, setAdbLogs] = useState(['[SYSTEM] ADB Shell Pipeline initialized.']);
  const [adbCommand, setAdbCommand] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  
  // Form & Workflow States (Device Registration)
  const [clientForm, setClientForm] = useState({ deviceId: '', model: '', osVersion: '', status: 'Pending Verification' });
  const [adbPairingForm, setAdbPairingForm] = useState({ ipAddress: '', port: '', pairingCode: '' });
  const [wizardForm, setWizardForm] = useState({ deviceName: '', serialNumber: '', platform: 'Android', dept: 'Operations' });

  const terminalEndRef = useRef(null);

  useEffect(() => {
    if (!user) navigate('/', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [adbLogs]);

  // REST API Fetching
  const fetchBackendData = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const deviceRes = await axios.get(`${API_URL}/devices`, { headers: { Authorization: `Bearer ${user?.uid}` } });
      setDeviceStatus(deviceRes.data || []);
      if (deviceRes.data?.length > 0 && !selectedDevice) setSelectedDevice(deviceRes.data[0]);

      const statsRes = await axios.get(`${API_URL}/stats`, { headers: { Authorization: `Bearer ${user?.uid}` } });
      setSystemStats(statsRes.data || { bandwidth: '0 Gbps', cpuLoad: '0%', storage: '0 TB', activeRelays: '0 / 0' });
    } catch (error) {
      console.error("REST API Error:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) fetchBackendData();
  }, [user]);

  // WebSocket Telemetry Stream
  useEffect(() => {
    if (!user) return;
    const socket = io(SOCKET_URL, { transports: ['websocket'], secure: true, auth: { token: user.uid } });

    socket.on('telemetry-stream', (incomingData) => {
      setNetworkData((prev) => [...prev, incomingData].length > 12 ? [...prev, incomingData].slice(1) : [...prev, incomingData]);
    });

    socket.on('adb-terminal-output', (logLine) => setAdbLogs((prev) => [...prev, logLine]));
    socket.on('node-status-change', (updatedNode) => {
      setDeviceStatus((prev) => prev.map((d) => d.id === updatedNode.id ? { ...d, ...updatedNode } : d));
    });

    return () => { socket.disconnect(); };
  }, [user]);

  // ADB Shell execution
  const handleSendAdbCommand = async (e) => {
    e.preventDefault();
    if (!adbCommand.trim() || !selectedDevice) return;
    const cmd = adbCommand;
    setAdbLogs((prev) => [...prev, `$ ${selectedDevice.id}: ${cmd}`]);
    setAdbCommand('');
    try {
      await axios.post(`${API_URL}/adb/execute`, { deviceId: selectedDevice.id, command: cmd }, { headers: { Authorization: `Bearer ${user?.uid}` } });
    } catch (error) {
      setAdbLogs((prev) => [...prev, `[ERROR] Failed to dispatch pipeline packet.`]);
    }
  };

  // HANDLERS FOR DEVICE ENROLLMENT METHODS
  const handleClientAppRegister = async (e) => {
    e.preventDefault();
    try {
      setAdbLogs((prev) => [...prev, `[CLIENT REGISTRATION] Initiating pipeline workflow for ${clientForm.deviceId}`]);
      const res = await axios.post(`${API_URL}/enrollment/client-app`, clientForm, { headers: { Authorization: `Bearer ${user?.uid}` } });
      setAdbLogs((prev) => [...prev, `[SUCCESS] Device authorized, enrolled, verified, and synchronized.`]);
      fetchBackendData();
    } catch (err) {
      setAdbLogs((prev) => [...prev, `[ERROR] Client App Registration sequence failed.`]);
    }
  };

  const handleAdbPairingConnect = async (type) => {
    try {
      setAdbLogs((prev) => [...prev, `[ADB PAIRING] Triggering protocol: ${type}`]);
      const res = await axios.post(`${API_URL}/enrollment/adb-pair`, { ...adbPairingForm, methodType: type }, { headers: { Authorization: `Bearer ${user?.uid}` } });
      setAdbLogs((prev) => [...prev, `[SUCCESS] Wireless pairing handshake approved. Validation completed.`]);
      fetchBackendData();
    } catch (err) {
      setAdbLogs((prev) => [...prev, `[ERROR] ADB pairing workflow rejected by remote node.`]);
    }
  };

  const handleWizardSubmit = async () => {
    try {
      setAdbLogs((prev) => [...prev, `[WIZARD ENROLLMENT] Dispatched step-by-step device manifest values.`]);
      await axios.post(`${API_URL}/enrollment/wizard`, wizardForm, { headers: { Authorization: `Bearer ${user?.uid}` } });
      setWizardStep(4); // Move to completion status
      fetchBackendData();
    } catch (err) {
      setAdbLogs((prev) => [...prev, `[ERROR] Wizard validation or approval process timed out.`]);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans antialiased flex flex-col md:flex-row">
      
      {/* ================= SIDEBAR NAVIGASI ================= */}
      <aside className="w-full md:w-64 bg-slate-900/60 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/10 p-5 flex flex-col justify-between">
        <div>
          <div className="mb-8 border-b border-white/5 pb-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-widest text-white uppercase">RayanXWeb</h3>
              <p className="text-[10px] text-blue-400 font-mono font-bold tracking-wider">ENTERPRISE MDM</p>
            </div>
          </div>
          
          <nav className="space-y-1.5">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
              <LayoutDashboard className="h-4 w-4" />
              <span>Infrastructure</span>
            </button>
            <button onClick={() => setActiveTab('enrollment')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'enrollment' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
              <PlusCircle className="h-4 w-4" />
              <span>Device Enrollment</span>
            </button>
            <button onClick={() => setActiveTab('devices')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'devices' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
              <Server className="h-4 w-4" />
              <span>Node Manifest</span>
            </button>
            <button onClick={() => setActiveTab('terminal')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'terminal' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
              <Terminal className="h-4 w-4" />
              <span>ADB Shell Pipe</span>
            </button>
          </nav>
        </div>

        <div className="border-t border-white/10 pt-4 mt-6 md:mt-0 bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <p className="text-xs font-semibold text-slate-300 truncate font-mono">{user.email}</p>
          </div>
          <button onClick={async () => { await logoutSecurely(); navigate('/', { replace: true }); }} className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl py-2 text-xs font-bold transition-all">
            <LogOut className="h-3.5 w-3.5" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* ================= AREA UTAMA OPERASIONAL ================= */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">System Infrastructure Command</h1>
            <p className="text-xs text-slate-400 mt-1">REST Endpoint Server dan Sinkronisasi WebSocket Cluster aktif.</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 anonymity animate-ping"></span>
            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider">Live Bridge Connected</span>
          </div>
        </header>

        {/* ================= TAB 1: OVERVIEW METRICS ================= */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl flex items-center gap-4"><Activity className="h-5 w-5 text-blue-400" /><div><p className="text-[10px] font-bold text-slate-400 uppercase">Network Bandwidth</p><p className="text-2xl font-black text-white font-mono">{systemStats.bandwidth}</p></div></div>
              <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl flex items-center gap-4"><Cpu className="h-5 w-5 text-indigo-400" /><div><p className="text-[10px] font-bold text-slate-400 uppercase">Cluster CPU Load</p><p className="text-2xl font-black text-white font-mono">{systemStats.cpuLoad}</p></div></div>
              <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl flex items-center gap-4"><HardDrive className="h-5 w-5 text-purple-400" /><div><p className="text-[10px] font-bold text-slate-400 uppercase">Storage Array</p><p className="text-2xl font-black text-white font-mono">{systemStats.storage}</p></div></div>
              <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl flex items-center gap-4"><Radio className="h-5 w-5 text-emerald-400" /><div><p className="text-[10px] font-bold text-slate-400 uppercase">Active Relays</p><p className="text-2xl font-black text-emerald-400 font-mono">{systemStats.activeRelays}</p></div></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl">
                <div className="w-full h-[280px] text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={networkData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs><linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" /><XAxis dataKey="time" stroke="#64748b" /><YAxis stroke="#64748b" /><Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      <Area type="monotone" dataKey="traffic" stroke="#2563eb" fillOpacity={1} fill="url(#colorTraffic)" name="Traffic (Mbps)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl">
                <div className="w-full h-[280px] text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={networkData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" /><XAxis dataKey="time" stroke="#64748b" /><YAxis stroke="#64748b" /><Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} /><Legend />
                      <Bar dataKey="cpu" fill="#6366f1" name="CPU (%)" /><Bar dataKey="memory" fill="#a855f7" name="Memory (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ================= TAB 2: DEVICE REGISTRATION & ENROLLMENT ================= */}
        {activeTab === 'enrollment' && (
          <div className="space-y-6">
            <div className="bg-slate-900/40 p-4 border border-white/10 rounded-2xl flex flex-wrap gap-2">
              <button onClick={() => setEnrollmentMethod('client-app')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${enrollmentMethod === 'client-app' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
                <SmartphoneCharging className="h-4 w-4" /> 1. Client App Registration
              </button>
              <button onClick={() => setEnrollmentMethod('adb-pairing')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${enrollmentMethod === 'adb-pairing' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
                <Terminal className="h-4 w-4" /> 2. ADB Pairing Registration
              </button>
              <button onClick={() => setEnrollmentMethod('wizard')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${enrollmentMethod === 'wizard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
                <Layers className="h-4 w-4" /> 3. Enrollment Wizard
              </button>
            </div>

            {/* METODE 1: CLIENT APP REGISTRATION PIPELINE */}
            {enrollmentMethod === 'client-app' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form onSubmit={handleClientAppRegister} className="bg-slate-900/30 border border-white/5 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Register Remote Device</h3>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Target Device ID</label>
                    <input type="text" value={clientForm.deviceId} onChange={(e)=>setClientForm({...clientForm, deviceId: e.target.value})} className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl font-mono text-xs text-white outline-none focus:border-blue-500" placeholder="e.g. MDM-NODE-99X" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Device Model</label>
                    <input type="text" value={clientForm.model} onChange={(e)=>setClientForm({...clientForm, model: e.target.value})} className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl font-mono text-xs text-white outline-none focus:border-blue-500" placeholder="e.g. Sony Xperia 1 VI" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Firmware OS Version</label>
                    <input type="text" value={clientForm.osVersion} onChange={(e)=>setClientForm({...clientForm, osVersion: e.target.value})} className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl font-mono text-xs text-white outline-none focus:border-blue-500" placeholder="e.g. Android 15.0.0" required />
                  </div>
                  <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all">
                    Execute Pipeline Sync
                  </button>
                </form>

                <div className="lg:col-span-2 bg-slate-950 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Pipeline Workflow Status</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    <div className="p-4 bg-slate-900/40 border border-blue-500/30 rounded-xl text-center"><CheckCircle2 className="h-5 w-5 mx-auto text-blue-400 mb-2" /><p className="text-[10px] font-bold text-white uppercase">1. Register</p></div>
                    <div className="p-4 bg-slate-900/40 border border-blue-500/30 rounded-xl text-center"><Shield className="h-5 w-5 mx-auto text-indigo-400 mb-2" /><p className="text-[10px] font-bold text-white uppercase">2. Authorize</p></div>
                    <div className="p-4 bg-slate-900/40 border border-blue-500/30 rounded-xl text-center"><Smartphone className="h-5 w-5 mx-auto text-purple-400 mb-2" /><p className="text-[10px] font-bold text-white uppercase">3. Enroll</p></div>
                    <div className="p-4 bg-slate-900/40 border border-blue-500/30 rounded-xl text-center"><CheckSquare className="h-5 w-5 mx-auto text-pink-400 mb-2" /><p className="text-[10px] font-bold text-white uppercase">4. Verify</p></div>
                    <div className="p-4 bg-slate-900/40 border border-blue-500/30 rounded-xl text-center"><RefreshCw className="h-5 w-5 mx-auto text-emerald-400 mb-2" /><p className="text-[10px] font-bold text-white uppercase">5. Sync</p></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-4 font-mono leading-relaxed bg-slate-900 p-3 rounded-xl border border-white/5">
                    * Jalur ini mengotomatisasi pengiriman profil keamanan kustom murni ke agen MDM Client App di node tujuan.
                  </p>
                </div>
              </div>
            )}

            {/* METODE 2: ADB PAIRING REGISTRATION WORKFLOW */}
            {enrollmentMethod === 'adb-pairing' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900/30 border border-white/5 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Wireless Telemetry Specs</h3>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Target Network IP Address</label>
                    <input type="text" value={adbPairingForm.ipAddress} onChange={(e)=>setAdbPairingForm({...adbPairingForm, ipAddress: e.target.value})} className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl font-mono text-xs text-white outline-none focus:border-blue-500" placeholder="192.168.1.100" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Port</label>
                    <input type="text" value={adbPairingForm.port} onChange={(e)=>setAdbPairingForm({...adbPairingForm, port: e.target.value})} className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl font-mono text-xs text-white outline-none focus:border-blue-500" placeholder="5555" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">ADB Pairing Code</label>
                    <input type="text" value={adbPairingForm.pairingCode} onChange={(e)=>setAdbPairingForm({...adbPairingForm, pairingCode: e.target.value})} className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl font-mono text-xs text-white outline-none focus:border-blue-500" placeholder="6-Digit Code" />
                  </div>
                </div>

                <div className="lg:col-span-2 bg-slate-950 border border-white/10 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Trigger Handshake Protocol</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={()=>handleAdbPairingConnect('Wireless')} className="p-4 bg-slate-900/60 border border-white/5 hover:border-blue-500 text-left rounded-xl flex items-start gap-3 transition-all">
                      <Radio className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div><h4 className="text-xs font-bold text-white uppercase">Wireless Debugging</h4><p className="text-[10px] text-slate-400 mt-1">Suntikkan parameter otentikasi nirkabel adb pair.</p></div>
                    </button>
                    <button onClick={()=>handleAdbPairingConnect('QR')} className="p-4 bg-slate-900/60 border border-white/5 hover:border-blue-500 text-left rounded-xl flex items-start gap-3 transition-all">
                      <QrCode className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <div><h4 className="text-xs font-bold text-white uppercase">QR Pairing Scan</h4><p className="text-[10px] text-slate-400 mt-1">Kirim payload QR matriks terenkripsi ke layar kamera node.</p></div>
                    </button>
                    <button onClick={()=>handleAdbPairingConnect('Code')} className="p-4 bg-slate-900/60 border border-white/5 hover:border-blue-500 text-left rounded-xl flex items-start gap-3 transition-all">
                      <Code2 className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div><h4 className="text-xs font-bold text-white uppercase">Pairing Code Sync</h4><p className="text-[10px] text-slate-400 mt-1">Otentikasi jabat tangan kode pin numerik lokal.</p></div>
                    </button>
                    <button onClick={()=>handleAdbPairingConnect('Connect')} className="p-4 bg-slate-900/60 border border-white/5 hover:border-blue-500 text-left rounded-xl flex items-start gap-3 transition-all">
                      <Link2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div><h4 className="text-xs font-bold text-white uppercase">ADB Connect Pipeline</h4><p className="text-[10px] text-slate-400 mt-1">Paksa buka soket ADB TCP/IP Over-the-Air secara murni.</p></div>
                    </button>
                  </div>
                  <div className="border-t border-white/5 pt-4 flex flex-wrap gap-4 justify-between items-center">
                    <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                      Status: Validation & Approval Workflow Active
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* METODE 3: STEP BY STEP ENROLLMENT WIZARD */}
            {enrollmentMethod === 'wizard' && (
              <div className="bg-slate-900/30 border border-white/5 p-6 rounded-2xl max-w-2xl mx-auto">
                {/* Wizard Steps Header Indicator */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className={`h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center ${wizardStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>1</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Manifest Spec</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-slate-600" />
                  <div className="flex items-center gap-2">
                    <span className={`h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center ${wizardStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>2</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Validation</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-slate-600" />
                  <div className="flex items-center gap-2">
                    <span className={`h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center ${wizardStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>3</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Approval</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-slate-600" />
                  <div className="flex items-center gap-2">
                    <span className={`h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center ${wizardStep === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>4</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Status</span>
                  </div>
                </div>

                {/* Wizard Dynamic Content */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Step 1: Device Specs Configuration</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Custom Name</label><input type="text" value={wizardForm.deviceName} onChange={(e)=>setWizardForm({...wizardForm, deviceName: e.target.value})} className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl font-mono text-xs text-white" placeholder="Production Node A" /></div>
                      <div><label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Serial Number</label><input type="text" value={wizardForm.serialNumber} onChange={(e)=>setWizardForm({...wizardForm, serialNumber: e.target.value})} className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl font-mono text-xs text-white" placeholder="SN-892301931" /></div>
                    </div>
                    <button onClick={()=>setWizardStep(2)} className="py-2.5 px-5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl ml-auto block">Proceed to Validation</button>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4 text-center py-6">
                    <Sliders className="h-10 w-10 text-indigo-400 mx-auto animate-pulse" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Step 2: Core Device Validation</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">Sistem sedang memverifikasi integritas nomor seri kluster terhadap manifestasi global.</p>
                    <div className="flex gap-3 justify-center">
                      <button onClick={()=>setWizardStep(1)} className="py-2 px-4 bg-slate-800 rounded-xl text-xs font-bold text-slate-400">Back</button>
                      <button onClick={()=>setWizardStep(3)} className="py-2 px-4 bg-blue-600 rounded-xl text-xs font-bold text-white">Approve Validation</button>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-4 text-center py-6">
                    <Shield className="h-10 w-10 text-purple-400 mx-auto" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Step 3: Security Approval Process</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">Konfirmasi hak akses penuh operator sebelum menyuntikkan sertifikat MDM.</p>
                    <div className="flex gap-3 justify-center">
                      <button onClick={()=>setWizardStep(2)} className="py-2 px-4 bg-slate-800 rounded-xl text-xs font-bold text-slate-400">Back</button>
                      <button onClick={handleWizardSubmit} className="py-2 px-4 bg-emerald-600 rounded-xl text-xs font-bold text-white">Inject MDM Profile</button>
                    </div>
                  </div>
                )}

                {wizardStep === 4 && (
                  <div className="space-y-4 text-center py-6">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto"><CheckCircle2 className="h-6 w-6" /></div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Step 4: Enrollment Success</h4>
                    <p className="text-xs text-slate-400 font-mono">Node ID: {wizardForm.serialNumber || 'COMPLETED'} is fully functional.</p>
                    <button onClick={() => { setWizardStep(1); setWizardForm({deviceName:'', serialNumber:'', platform:'Android', dept:'Operations'}); }} className="py-2.5 px-5 bg-slate-900 border border-white/10 text-xs font-bold rounded-xl text-white">Enroll Another Device</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: NODE MANIFEST (TABLE) ================= */}
        {activeTab === 'devices' && (
          <div className="bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">Active Edge Cluster Nodes</h3>
                <p className="text-[11px] text-slate-400">Database manifes perangkat MDM operasional terpantau.</p>
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
                    <tr><td colSpan="6" className="p-8 text-center text-slate-500">Tidak ada kluster terdeteksi di server database API.</td></tr>
                  ) : (
                    deviceStatus.map((node, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] text-slate-300">
                        <td className="p-4 font-bold text-blue-400">{node.id}</td>
                        <td className="p-4 text-white font-sans font-semibold">{node.name}</td>
                        <td className="p-4 text-slate-400">{node.type}</td>
                        <td className="p-4">{node.ip}</td>
                        <td className="p-4">{node.load}</td>
                        <td className="p-4 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${node.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
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

        {/* ================= TAB 4: ADB SHELL COMMAND INTERACTION ================= */}
        {activeTab === 'terminal' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl h-fit">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Target Node Selector</h3>
              <div className="space-y-2">
                {deviceStatus.map((dev) => (
                  <button key={dev.id} onClick={() => setSelectedDevice(dev)} className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${selectedDevice?.id === dev.id ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-slate-950/40 border-white/5 text-slate-400 hover:border-white/10'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Smartphone className="h-5 w-5 text-slate-500" />
                      <div className="overflow-hidden"><p className="text-xs font-bold text-white truncate">{dev.name}</p><p className="text-[10px] font-mono text-slate-500 mt-0.5">{dev.id} • {dev.ip}</p></div>
                    </div>
                    <span className={`h-2 w-2 rounded-full ${dev.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-950 border border-white/10 rounded-2xl flex flex-col h-[520px] overflow-hidden shadow-2xl">
              <div className="bg-slate-900/80 px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400">adb_pipeline@{selectedDevice ? selectedDevice.id.toLowerCase() : 'node_offline'}: ~</span>
                <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono">WSS ACTIVE</span>
              </div>
              <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-slate-300 space-y-1.5">
                {adbLogs.map((log, index) => (
                  <div key={index} className={`whitespace-pre-wrap leading-relaxed ${log.startsWith('$') ? 'text-blue-400 font-bold' : log.startsWith('[ERROR]') ? 'text-red-400' : log.startsWith('[SYSTEM]') ? 'text-purple-400' : 'text-slate-300'}`}>{log}</div>
                ))}
                <div ref={terminalEndRef} />
              </div>
              <form onSubmit={handleSendAdbCommand} className="p-4 bg-slate-900/40 border-t border-white/5 flex gap-3">
                <div className="flex-1 bg-slate-950 rounded-xl border border-white/10 px-4 flex items-center focus-within:border-blue-500">
                  <span className="text-blue-500 font-mono text-xs font-bold mr-2">$</span>
                  <input type="text" value={adbCommand} onChange={(e) => setAdbCommand(e.target.value)} disabled={!selectedDevice} placeholder={selectedDevice ? `Masukkan perintah ADB untuk ${selectedDevice.id}...` : "Silakan pilih target node."} className="w-full bg-transparent border-none outline-none py-3 font-mono text-xs text-white outline-none" />
                </div>
                <button type="submit" disabled={!selectedDevice || !adbCommand.trim()} className="px-5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl flex items-center justify-center transition-all active:scale-95"><Play className="h-4 w-4 fill-current" /></button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default CoreDashboardLayout;