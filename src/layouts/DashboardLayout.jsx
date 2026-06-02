import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useSocketStore } from '../store/useSocketStore';
import { useTheme } from '../context/ThemeContext';
import { auth } from '../firebase/config';
import { 
  LayoutDashboard, 
  Smartphone, 
  UserCheck, 
  LogOut, 
  Sun, 
  Moon, 
  Radio, 
  ShieldAlert 
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, role, clearAuth } = useAuthStore();
  const { isConnected, disconnectSocket } = useSocketStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogoutSequence = async () => {
    if (window.confirm('Apakah Anda yakin ingin memutus sesi enkripsi dari console?')) {
      disconnectSocket();
      await auth.signOut();
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      
      {/* SIDEBAR NAVIGATION GRID */}
      <aside className="w-64 border-r border-slate-200 bg-white p-5 flex flex-col justify-between dark:border-white/10 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-3 px-2 py-4">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg">RX</div>
            <div>
              <h1 className="font-bold text-sm tracking-tight">RayanX Core</h1>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{role} Module</span>
            </div>
          </div>

          <nav className="mt-8 space-y-1.5">
            <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'}`}>
              <LayoutDashboard size={18} /> Dashboard Overview
            </NavLink>
            <NavLink to="/devices" className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'}`}>
              <Smartphone size={18} /> Managed Devices
            </NavLink>
            {['Admin', 'Operator'].includes(role) && (
              <NavLink to="/enrollment" className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'}`}>
                <UserCheck size={18} /> ADB Enrollment
              </NavLink>
            )}
          </nav>
        </div>

        {/* SIDEBAR BOTTOM PANEL */}
        <div className="border-t border-slate-200 pt-4 dark:border-white/10">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-xs text-slate-400 font-medium truncate max-w-[140px]">{user?.email}</span>
            <button onClick={toggleTheme} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-white/5">
              {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
            </button>
          </div>
          <button onClick={handleLogoutSequence} className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 transition">
            <LogOut size={18} /> Terminate Console
          </button>
        </div>
      </aside>

      {/* VIEW CONTENT STAGE */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* GLASSMORPHISM TOP BAR STATUS LAYER */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/80">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Control Center</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isConnected ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
              <Radio size={12} className={isConnected ? 'animate-pulse' : ''} />
              <span>{isConnected ? 'STREAM TUNNEL ACTIVE' : 'PIPE OFFLINE'}</span>
            </div>
          </div>
        </header>

        {/* SCROLLABLE ROUTE PAGE ELEMENT */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-950/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
              }
