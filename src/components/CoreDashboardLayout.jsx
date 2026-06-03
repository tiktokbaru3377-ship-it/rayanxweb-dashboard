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
  Sliders, Smartphone, CheckCircle2, Play,
  PlusCircle, SmartphoneCharging, QrCode, Code2, Link2, CheckSquare, Layers, ArrowRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/v1';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:5000';

function CoreDashboardLayout() {
  const user = useAuthStore((state) => state.user);
  const logoutSecurely = useAuthStore((state) => state.logoutSecurely);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [enrollmentMethod, setEnrollmentMethod] = useState('client-app');
  const [wizardStep, setWizardStep] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [deviceStatus, setDeviceStatus] = useState([]);
  const [systemStats, setSystemStats] = useState({ bandwidth: '0 Gbps', cpuLoad: '0%', storage: '0 TB', activeRelays: '0 / 0' });
  const [networkData, setNetworkData] = useState([]);
  const [adbLogs, setAdbLogs] = useState(['[SYSTEM] ADB Shell Pipeline initialized. Node encryption handshake complete.']);
  const [adbCommand, setAdbCommand] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  
  const [clientForm, setClientForm] = useState({ deviceId: '', model: '', osVersion: '', status: 'Active' });
  const [adbPairingForm, setAdbPairingForm] = useState({ ipAddress: '', port: '5555', pairingCode: '' });
  const [wizardForm, setWizardForm] = useState({ deviceName: '', serialNumber: '' });

  const terminalEndRef = useRef(null);

  useEffect(() => {
    if (!user) navigate('/', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [adbLogs]);

  const fetchBackendData = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const deviceRes = await axios.get(`${API_URL}/devices`);
      setDeviceStatus(deviceRes.data || []);
      if (deviceRes.data?.length > 0 && !selectedDevice) {
        setSelectedDevice(deviceRes.data[0]);
      }
      const statsRes = await axios.get(`${API_URL}/stats`);
      setSystemStats(statsRes.data);
    } catch (error) {
      console.error("Failure Syncing with Cluster:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) fetchBackendData();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true
    });

    socket.on('telemetry-stream', (incomingData) => {
      setNetworkData((prev) => {
        const updatedData = [...prev, incomingData];
        return updatedData.length > 12 ? updatedData.slice(1) : updatedData;
      });
    });

    socket.on('adb-terminal-output', (logLine) => {
      setAdbLogs((prev) => [...prev, logLine]);
    });

    socket.on('node-status-change', (updatedNode) => {
      setDeviceStatus((prev) => {
        const exists = prev.some((d) => d.id === updatedNode.id);
        if (!exists) return [updatedNode, ...prev];
        return prev.map((d) => d.id === updatedNode.id ? updatedNode : d);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);
  
  const handleSendAdbCommand = async (e) => {
    e.preventDefault();
    if (!adbCommand.trim() || !selectedDevice) return;

    const cmd = adbCommand;
    setAdbCommand('');

    try {
      await axios.post(`${API_URL}/adb/execute`, {
        deviceId: selectedDevice.id,
        command: cmd
      });
    } catch (error) {
      setAdbLogs((prev) => [...prev, `[ERROR] Failed to send execution packet.`]);
    }
  };

  const handleClientAppRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/enrollment/client-app`, clientForm);
      setClientForm({ deviceId: '', model: '', osVersion: '', status: 'Active' });
      fetchBackendData();
    } catch (err) {
      setAdbLogs((prev) => [...prev, `[ERROR] Client registration workflow failed.`]);
    }
  };

  const handleAdbPairingConnect = async (type) => {
    try {
      await axios.post(`${API_URL}/enrollment/adb-pair`, {
        ...adbPairingForm,
        pairingMethod: type
      });
      fetchBackendData();
    } catch (err) {
      setAdbLogs((prev) => [...prev, `[ERROR] Secure wireless debugging handshake failed.`]);
    }
  };

  const handleWizardSubmit = async () => {
    try {
      await axios.post(`${API_URL}/enrollment/wizard`, wizardForm);
      setWizardStep(4);
      fetchBackendData();
    } catch (err) {
      setAdbLogs((prev) => [...prev, `[ERROR] Wizard enrollment step failed.`]);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans antialiased flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900/60 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/10 p-5 flex flex-col justify-between">
        <div>
          <div className="mb-8 border-b border-white/5 pb-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-widest text-white uppercase">RayanXWeb</h3>
              <p className="text-[10px] text-blue-400 font-mono font-bold tracking-wider">ENTERPRISE COMMAND</p>
            </div>
          </div>
          <nav className="space-y-1.5">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
              <LayoutDashboard className="h-4 w-4" /><span>Core Infrastructure</span>
            </button>
            <button onClick={() => setActiveTab('enrollment')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'enrollment' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
              <PlusCircle className="h-4 w-4" /><span>Device Enrollment</span>
            </button>
            <button onClick={() => setActiveTab('devices')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'devices' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
              <Server className="h-4 w-4" /><span>Node Manifest</span>
            </button>
            <button onClick={() => setActiveTab('terminal')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'terminal' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
              <Terminal className="h-4 w-4" /><span>ADB Shell Pipe</span>
            </button>
          </nav>
        </div>
        <div className="border-t border-white/10 pt-4 bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <p className="text-xs font-semibold text-slate-300 truncate font-mono">{user.email}</p>
          </div>
          <button onClick={async () => { await logoutSecurely(); navigate('/', { replace: true }); }} className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl py-2 text-xs font-bold transition-all">
            <LogOut className="h-3.5 w-3.5" /><span>Terminate Session</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">System Infrastructure Command</h1>
            <p className="text-xs text-slate-400 mt-1">Interkoneksi MongoDB & WebSockets Stateful Aktif.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchBackendData} className="p-2.5 bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 rounded-xl transition-all">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

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

        {activeTab === 'enrollment' && (
          <div className="space-y-6">
            <div className="bg-slate-900/40 p-4 border border-white/10 rounded-2xl flex flex-wrap gap-2">
              <button onClick={() => setEnrollmentMethod('client-app')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${enrollmentMethod === 'client-app' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>1. Client App</button>
              <button onClick={() => setEnrollmentMethod('adb-pairing')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${enrollmentMethod === 'adb-pairing' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>2. ADB Pairing</button>
              <button onClick={() => setEnrollmentMethod('wizard')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${enrollmentMethod === 'wizard' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>3. Enrollment Wizard</button>
            </div>

            {enrollmentMethod === 'client-app' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form onSubmit={handleClientAppRegister} className="bg-slate-900/30 border border-white/5 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Register Remote Device</h3>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Target Device ID</label>
                    <input type="text" value={clientForm.deviceId} onChange={(e)=>setClientForm({...clientForm, deviceId: e.target.value})} className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl font-mono text-xs text-white" placeholder="e.g. MDM-X18-NODE3" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Device Model</label>
                    <input type="text" value={clientForm.model} onChange={(e)=>setClientForm({...clientForm, model: e.target.value})} className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl font-mono text-xs text-white" placeholder="e.g. Sony Xperia 1 VI" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">OS Version</label>
                    <input type="text" value={clientForm.osVersion} onChange={(e)=>setClientForm({...clientForm, osVersion: e.target.value})} className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl font-mono text-xs text-white" placeholder="e.g. Android 14.0" required />
                  </div>
                  <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold text-xs uppercase rounded-xl">Execute Pipeline Sync</button>
                </form>
                <div className="lg:col-span-2 bg-slate-950 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Pipeline Workflow Status</h3>
                  <div className="grid grid-cols-5 gap-3 text-center">
                    <div className="p-2 bg-slate-900/40 rounded-xl"><CheckCircle2 className="h-4 w-4 mx-auto text-blue-400 mb-1" /><span className="text-[9px] text-white">1. Reg</span></div>
                    <div className="p-2 bg-slate-900/40 rounded-xl"><Shield className="h-4 w-4 mx-auto text-indigo-400 mb-1" /><span className="text-[9px] text-white">2. Auth</span></div>
                    <div className="p-2 bg-slate-900/40 rounded-xl"><Smartphone className="h-4 w-4 mx-auto text-purple-400 mb-1" /><span className="text-[9px] text-white">3. Enroll</span></div>
                    <div className="p-2 bg-slate-900/40 rounded-xl"><CheckSquare className="h-4 w-4 mx-auto text-pink-400 mb-1" /><span className="text-[9px] text-white">4. Verif</span></div>
                    <div className="p-2 bg-slate-900/40 rounded-xl"><RefreshCw className="h-4 w-4 mx-auto text-emerald-400 mb-1" /><span className="text-[9px] text-white">5. Sync</span></div>
                  </div>
                </div>
              </div>
            )}

            {enrollmentMethod === 'adb-pairing' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900/30 border border-white/5 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Wireless Telemetry Specs</h3>
                  <input type="text" value={adbPairingForm.ipAddress} onChange={(e)=>setAdbPairingForm({...adbPairingForm, ipAddress: e.target.value})} className="w-full bg-slate-950 border p-3 rounded-xl text-xs text-white" placeholder="IP Address (e.g. 192.168.10.110)" />
                  <input type="text" value={adbPairingForm.port} onChange={(e)=>setAdbPairingForm({...adbPairingForm, port: e.target.value})} className="w-full bg-slate-950 border p-3 rounded-xl text-xs text-white" placeholder="Port (e.g. 5555)" />
                  <input type="text" value={adbPairingForm.pairingCode} onChange={(e)=>setAdbPairingForm({...adbPairingForm, pairingCode: e.target.value})} className="w-full bg-slate-950 border p-3 rounded-xl text-xs text-white" placeholder="6-Digit Pairing Code" />
                </div>
                <div className="lg:col-span-2 bg-slate-950 border border-white/10 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Trigger Handshake</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={()=>handleAdbPairingConnect('Wireless')} className="p-4 bg-slate-900 rounded-xl flex items-start gap-3"><Radio className="text-blue-400" /><div><h4 className="text-xs text-white font-bold">Wireless</h4></div></button>
                    <button onClick={()=>handleAdbPairingConnect('QR')} className="p-4 bg-slate-900 rounded-xl flex items-start gap-3"><QrCode className="text-indigo-400" /><div><h4 className="text-xs text-white font-bold">QR Scan</h4></div></button>
                    <button onClick={()=>handleAdbPairingConnect('Code')} className="p-4 bg-slate-900 rounded-xl flex items-start gap-3"><Code2 className="text-purple-400" /><div><h4 className="text-xs text-white font-bold">Pair Code</h4></div></button>
                    <button onClick={()=>handleAdbPairingConnect('Connect')} className="p-4 bg-slate-900 rounded-xl flex items-start gap-3"><Link2 className="text-emerald-400" /><div><h4 className="text-xs text-white font-bold">Force Connect</h4></div></button>
                  </div>
                </div>
              </div>
            )}

            {enrollmentMethod === 'wizard' && (
              <div className="bg-slate-900/30 border border-white/5 p-6 rounded-2xl max-w-2xl mx-auto">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                  <span className={`h-6 w-6 rounded-full text-xs flex items-center justify-center ${wizardStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-800'}`}>1</span><ArrowRight className="h-3 w-3 text-slate-600" />
                  <span className={`h-6 w-6 rounded-full text-xs flex items-center justify-center ${wizardStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-800'}`}>2</span><ArrowRight className="h-3 w-3 text-slate-600" />
                  <span className={`h-6 w-6 rounded-full text-xs flex items-center justify-center ${wizardStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-800'}`}>3</span><ArrowRight className="h-3 w-3 text-slate-600" />
                  <span className={`h-6 w-6 rounded-full text-xs flex items-center justify-center ${wizardStep === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-800'}`}>4</span>
                </div>
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <input type="text" value={wizardForm.deviceName} onChange={(e)=>setWizardForm({...wizardForm, deviceName: e.target.value})} className="w-full bg-slate-950 border p-3 rounded-xl text-xs text-white" placeholder="Device Name" />
                    <input type="text" value={wizardForm.serialNumber} onChange={(e)=>setWizardForm({...wizardForm, serialNumber: e.target.value})} className="w-full bg-slate-950 border p-3 rounded-xl text-xs text-white" placeholder="Serial Number" />
                    <button onClick={()=>setWizardStep(2)} className="py-2 px-4 bg-blue-600 text-white rounded-xl text-xs uppercase font-bold ml-auto block">Proceed</button>
                  </div>
                )}
                {wizardStep === 2 && (
                  <div className="text-center py-4 space-y-3">
                    <Sliders className="mx-auto text-indigo-400" /><p className="text-xs">Automated Verification Layer</p>
                    <button onClick={()=>setWizardStep(3)} className="py-2 px-4 bg-blue-600 text-white rounded-xl text-xs">Verify Profile</button>
                  </div>
                )}
                {wizardStep === 3 && (
                  <div className="text-center py-4 space-y-3">
                    <Shield className="mx-auto text-purple-400" /><p className="text-xs">Administrative Approval Guard</p>
                    <button onClick={handleWizardSubmit} className="py-2 px-4 bg-emerald-600 text-white rounded-xl text-xs">Authorize Link</button>
                  </div>
                )}
                {wizardStep === 4 && (
                  <div className="text-center py-4 space-y-3">
                    <CheckCircle2 className="mx-auto text-emerald-400" /><p className="text-xs font-mono">Device Cluster Enrolled.</p>
                    <button onClick={()=>{setWizardStep(1); setWizardForm({deviceName:'', serialNumber:''})}} className="py-2 px-4 bg-slate-800 text-white rounded-xl text-xs">Enroll Another</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'devices' && (
          <div className="bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-white/5 text-slate-400 uppercase font-mono font-bold">
                    <th className="p-4">Node ID</th><th className="p-4">Identity</th><th className="p-4">Spec</th><th className="p-4">Network IP</th><th className="p-4">Load</th><th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {deviceStatus.map((node, i) => (
                    <tr key={i} className="hover:bg-white/[0.01] text-slate-300">
                      <td className="p-4 font-bold text-blue-400">{node.id}</td><td className="p-4 font-sans text-white">{node.name}</td><td className="p-4 text-slate-400">{node.type}</td><td className="p-4">{node.ip}</td><td className="p-4">{node.load}</td>
                      <td className="p-4 text-right"><span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{node.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl">
              <h3 className="text-xs font-bold text-white uppercase mb-4">Select Target Node</h3>
              <div className="space-y-2">
                {deviceStatus.map((dev) => (
                  <button key={dev.id} onClick={() => setSelectedDevice(dev)} className={`w-full p-3 rounded-xl border text-left flex items-center justify-between ${selectedDevice?.id === dev.id ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-950/40 border-white/5'}`}>
                    <div className="truncate"><p className="text-xs text-white font-bold truncate">{dev.name}</p><p className="text-[10px] text-slate-500 font-mono mt-0.5">{dev.id}</p></div>
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2 bg-slate-950 border border-white/10 rounded-2xl flex flex-col h-[500px] overflow-hidden">
              <div className="bg-slate-900 px-4 py-2 border-b border-white/5 flex justify-between font-mono text-[11px] text-slate-400">
                <span>adb_pipeline@{selectedDevice ? selectedDevice.id.toLowerCase() : 'offline'}: ~</span>
              </div>
              <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
                {adbLogs.map((log, index) => (
                  <div key={index} className={`whitespace-pre-wrap ${log.startsWith('$') ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>{log}</div>
                ))}
                <div ref={terminalEndRef} />
              </div>
              <form onSubmit={handleSendAdbCommand} className="p-3 bg-slate-900/40 border-t border-white/5 flex gap-2">
                <input type="text" value={adbCommand} onChange={(e) => setAdbCommand(e.target.value)} disabled={!selectedDevice} placeholder={selectedDevice ? `Run ADB Command on ${selectedDevice.id}...` : "Select a device first."} className="flex-1 bg-slate-950 border border-white/10 p-2 rounded-xl font-mono text-xs text-white outline-none" />
                <button type="submit" disabled={!selectedDevice || !adbCommand.trim()} className="px-4 bg-blue-600 text-white rounded-xl flex items-center justify-center"><Play className="h-3 w-3" /></button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CoreDashboardLayout;