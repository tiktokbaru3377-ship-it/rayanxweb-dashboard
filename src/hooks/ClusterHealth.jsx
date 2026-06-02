import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { Server, Activity, HardDrive, Cpu } from 'lucide-react';

export default function ClusterHealth() {
  const [socketPingMatrix, setSocketPingMatrix] = useState({});

  // Kueri parameter status kesehatan internal server backend
  const { data: nodeHealth } = useQuery({
    queryKey: ['clusterInternalHealthCheck'],
    queryFn: async () => {
      const res = await api.get('/system/health');
      return res.data.health;
    },
    refetchInterval: 10000 // Jajak pendapat status server berkala setiap 10 detik
  });

  // Saluran penangkap detak jantung latensi koneksi (Heartbeat Latency Packet)
  useSocketEvent('cluster_pong_heartbeat', (payload) => {
    setSocketPingMatrix((prev) => ({
      ...prev,
      [payload.nodeId]: payload.latencyMs
    }));
  });

  return (
    <div className="space-y-6 text-xs text-white">
      <div>
        <h3 className="text-2xl font-bold tracking-tight text-white">Cluster Infrastructure Nodes</h3>
        <p className="text-sm text-slate-400 font-sans">Monitor load balancer, konsumsi kluster memori database, dan latensi pipa WebSocket.</p>
      </div>

      {/* METRIC CORE HARDWARE ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-xl border border-white/10 bg-slate-900 p-5 flex items-center gap-4 shadow-md">
          <div className="p-3 bg-blue-600/10 rounded-lg text-blue-400"><Cpu size={18} /></div>
          <div>
            <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">API Server CPU Load</span>
            <span className="text-xl font-extrabold tracking-tight mt-0.5 block">{nodeHealth?.cpuLoad || 0}%</span>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900 p-5 flex items-center gap-4 shadow-md">
          <div className="p-3 bg-emerald-600/10 rounded-lg text-emerald-400"><HardDrive size={18} /></div>
          <div>
            <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Redis Cache Memory Heap</span>
            <span className="text-xl font-extrabold tracking-tight mt-0.5 block">{nodeHealth?.redisMemoryUsedMb || 0} MB</span>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900 p-5 flex items-center gap-4 shadow-md">
          <div className="p-3 bg-amber-600/10 rounded-lg text-amber-400"><Activity size={18} /></div>
          <div>
            <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Active WebSocket Pipes</span>
            <span className="text-xl font-extrabold tracking-tight mt-0.5 block">{nodeHealth?.webSocketConnections || 0} Open Tunnels</span>
          </div>
        </div>
      </div>

      {/* MATRIX DISPATCH VIEW NETWORK */}
      <div className="rounded-xl border border-white/10 bg-slate-900 p-5">
        <h4 className="text-sm font-bold tracking-tight mb-4 flex items-center gap-2"><Server size={14} className="text-blue-500" /> Active Load Balancing Nodes Mapping</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {nodeHealth?.nodesList?.map((node) => {
            const latency = socketPingMatrix[node.id] || 0;
            return (
              <div key={node.id} className="p-4 rounded-lg bg-slate-950 border border-white/5 flex flex-col justify-between h-28">
                <div>
                  <div className="font-bold text-slate-200 truncate">{node.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{node.ipAddress}</div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider ${node.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {node.active ? 'BALANCING' : 'DORMANT'}
                  </span>
                  <span className={`font-mono font-bold ${latency > 150 ? 'text-red-400' : latency > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {latency ? `${latency}ms` : 'Calculating...'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
