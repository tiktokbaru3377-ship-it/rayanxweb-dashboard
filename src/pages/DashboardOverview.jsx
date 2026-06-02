import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useThrottledSocketEvent } from '../hooks/useThrottledSocketEvent';
import { Smartphone, Radio, PowerOff, Shield, Activity } from 'lucide-react';

export default function DashboardOverview() {
  const [liveMetricsFeed, setLiveMetricsFeed] = useState([]);

  const { data: serverKpiStats } = useQuery({
    queryKey: ['dashboardKpiMetrics'],
    queryFn: async () => {
      const response = await api.get('/analytics/overview');
      return response.data;
    },
    refetchInterval: 30000 
  });

  // Pemrosesan Kumpulan Paket Telemetri Ter-throttle (Optimasi RAM Peramban)
  const handleBatchedMetrics = useCallback((payloadBatch) => {
    setLiveMetricsFeed((prevFeed) => {
      // Hitung nilai rata-rata dari seluruh paket data dalam jendela interval untuk akurasi data grafik
      const totalItems = payloadBatch.length;
      const sumCpu = payloadBatch.reduce((sum, item) => sum + item.metrics.CPU, 0);
      const sumRam = payloadBatch.reduce((sum, item) => sum + item.metrics.RAM, 0);
      
      const averageCpu = Math.round(sumCpu / totalItems);
      const averageRam = Math.round(sumRam / totalItems);
      const latestTimestamp = payloadBatch[totalItems - 1].timestamp;

      const updatedFeed = [...prevFeed, {
        name: new Date(latestTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        cpu: averageCpu,
        ram: averageRam
      }];

      // Pertahankan batas ketat max 20 titik data di memori untuk mencegah memory leaks
      if (updatedFeed.length > 20) {
        return updatedFeed.slice(updatedFeed.length - 20);
      }
      return updatedFeed;
    });
  }, []);

  // Hubungkan ke mesin throttle event stream dengan jendela interval 2 detik
  useThrottledSocketEvent('live_dashboard_render', handleBatchedMetrics, 2000);

  const kpiCards = [
    { title: 'Total Handsets Managed', value: serverKpiStats?.totalDevices || 0, icon: <Smartphone className="text-blue-500" /> },
    { title: 'Active Node Online', value: serverKpiStats?.onlineDevices || 0, icon: <Radio className="text-emerald-500" /> },
    { title: 'Dormant Sockets', value: serverKpiStats?.offlineDevices || 0, icon: <PowerOff className="text-slate-400" /> },
    { title: 'Pending Approval', value: serverKpiStats?.pendingEnrollment || 0, icon: <Shield className="text-amber-500" /> },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.title}</span>
              {card.icon}
            </div>
            <div className="mt-2 text-3xl font-extrabold tracking-tight">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
          <Activity className="text-blue-500 animate-pulse" size={16} />
          <h4 className="font-bold text-xs uppercase tracking-wider">Throttled Core Telemetry Matrix (2000ms Window Data Ingestion)</h4>
        </div>
        <div className="h-72 w-full">
          {liveMetricsFeed.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-dashed border-slate-200 dark:border-white/5">
              Sinkronisasi pipa data sedang berlangsung...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liveMetricsFeed}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.05} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontMono />
                <YAxis stroke="#64748b" fontSize={10} fontMono domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="cpu" name="CPU Load Avg" stroke="#3b82f6" fillOpacity={0.05} fill="#3b82f6" strokeWidth={2} />
                <Area type="monotone" dataKey="ram" name="RAM Load Avg" stroke="#10b981" fillOpacity={0.05} fill="#10b981" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
