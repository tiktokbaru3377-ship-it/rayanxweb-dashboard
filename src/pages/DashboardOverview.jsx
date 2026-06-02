import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { Shield, Radio, PowerOff, Smartphone, Activity } from 'lucide-react';

export default function DashboardOverview() {
  const [liveMetricsFeed, setLiveMetricsFeed] = useState([]);

  // Fetch data awal statis agregasi server menggunakan react-query cache engine
  const { data: serverKpiStats, refetch } = useQuery({
    queryKey: ['dashboardKpiMetrics'],
    queryFn: async () => {
      const response = await api.get('/analytics/overview');
      return response.data;
    },
    refetchInterval: 60000 // Sinkronisasi ulang database setiap 60 detik
  });

  // Saluran Ingest Realtime Event Stream via WebSocket
  useSocketEvent('live_dashboard_render', (payload) => {
    setLiveMetricsFeed((prevFeed) => {
      const filteredFeed = prevFeed.slice(-14); // Batasi grafik real-time hanya menampilkan 15 titik data terakhir
      return [...filteredFeed, {
        name: new Date(payload.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        cpu: payload.metrics.CPU,
        ram: payload.metrics.RAM
      }];
    });
  });

  useSocketEvent('dashboard_stats_refresh', () => {
    refetch(); // Otomatis trigger refresh total data jika ada penambahan atau pengurangan device session online secara global
  });

  const kpiCards = [
    { title: 'Total Handsets Managed', value: serverKpiStats?.totalDevices || 0, icon: <Smartphone className="text-blue-500" /> },
    { title: 'Active Node Online', value: serverKpiStats?.onlineDevices || 0, icon: <Radio className="text-emerald-500" /> },
    { title: 'Dormant Sockets (Offline)', value: serverKpiStats?.offlineDevices || 0, icon: <PowerOff className="text-slate-400" /> },
    { title: 'Pending Approval', value: serverKpiStats?.pendingEnrollment || 0, icon: <Shield className="text-amber-500" /> },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Infrastruktur Metrik</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Pemantauan performa real-time ekosistem MDM.</p>
      </div>

      {/* KPI GRID METRICS ROW */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</span>
              {card.icon}
            </div>
            <div className="mt-2 text-3xl font-bold tracking-tight">{card.value}</div>
          </div>
        ))}
      </div>

      {/* SYSTEM TELEMETRY DYNAMIC CHART PLATFORM */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="text-blue-500" size={18} />
          <h4 className="font-semibold text-sm">Real-time Node Performance Grid (CPU vs Memory Load Engine)</h4>
        </div>
        <div className="h-80 w-full">
          {liveMetricsFeed.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-950 rounded-lg border border-dashed border-slate-200 dark:border-white/5">
              Menunggu transmisi frame telemetri dari Android Agent Client...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liveMetricsFeed}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                <Area type="monotone" dataKey="cpu" name="CPU Load (%)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" />
                <Area type="monotone" dataKey="ram" name="RAM Usage (%)" stroke="#10b981" fillOpacity={1} fill="url(#colorRam)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
          }
