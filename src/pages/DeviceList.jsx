import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Search, SlidersHorizontal, Download, Trash2, ShieldCheck } from 'lucide-react';

export default function DeviceList() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDevices, setSelectedDevices] = useState([]);

  // React Query Fetch Data Array List dari API Backend
  const { data: devicesList = [], isLoading } = useQuery({
    queryKey: ['devicesCollection', statusFilter],
    queryFn: async () => {
      const response = await api.get(`/devices?status=${statusFilter}`);
      return response.data.devices;
    }
  });

  // Pipeline Mutasi Aksi Massal (Bulk Action Engine)
  const bulkWipeMutation = useMutation({
    mutationFn: async (deviceIds) => {
      return await api.post('/devices/bulk-action', { action: 'WIPE_METADATA', targets: deviceIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['devicesCollection']);
      setSelectedDevices([]);
      alert('Aksi massal berhasil dikirim ke antrean worker.');
    }
  });

  // Filter Client-Side untuk pencarian instan berbasis teks
  const filteredDevices = devicesList.filter(device => 
    device.deviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.deviceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.model?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelectAllDevices = () => {
    if (selectedDevices.length === filteredDevices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(filteredDevices.map(d => d.deviceId));
    }
  };

  const toggleSelectDevice = (deviceId) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) ? prev.filter(id => id !== deviceId) : [...prev, deviceId]
    );
  };

  const executeExportToCSVFormat = () => {
    const headers = ['Device ID,Device Name,Brand,Model,OS,Status\n'];
    const rows = filteredDevices.map(d => `${d.deviceId},${d.deviceName},${d.brand},${d.model},Android ${d.androidVersion},${d.statusOnline ? 'ONLINE' : 'OFFLINE'}`);
    const blob = new Blob([headers.concat(rows.join('\n'))], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rayanx_armada_export_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Armada Perangkat Terdaftar</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manajemen perizinan, pemantauan status, dan eksekusi perintah massal.</p>
        </div>
        <button onClick={executeExportToCSVFormat} className="flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold shadow-sm border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-800 transition">
          <Download size={16} /> Export Fleet Data (CSV)
        </button>
      </div>

      {/* SEARCH AND FILTER BAR COMPONENT BAR */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari ID perangkat, nama alias, atau spesifikasi model..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm dark:border-white/10 dark:bg-slate-900 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-slate-400" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white p-2 text-sm dark:border-white/10 dark:bg-slate-900 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Status Koneksi</option>
            <option value="ONLINE">Hanya Perangkat Online</option>
            <option value="OFFLINE">Hanya Perangkat Offline</option>
          </select>
        </div>
      </div>

      {/* BULK ACTIONS HUD STATUS INTERCEPTOR */}
      {selectedDevices.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-blue-600/10 border border-blue-500/20 p-4 text-sm text-blue-600 dark:text-blue-400">
          <div className="font-medium">Terpilih {selectedDevices.length} Perangkat dari hasil filter</div>
          <div className="flex gap-2">
            <button 
              onClick={() => bulkWipeMutation.mutate(selectedDevices)}
              className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition"
            >
              <Trash2 size={14} /> Wipe Session Records
            </button>
          </div>
        </div>
      )}

      {/* DATA ARCHITECTURE DATA TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="p-4 w-12 text-center">
                  <input type="checkbox" checked={selectedDevices.length === filteredDevices.length && filteredDevices.length > 0} onChange={toggleSelectAllDevices} className="rounded" />
                </th>
                <th className="p-4 text-sm font-semibold">Device Identity</th>
                <th className="p-4 text-sm font-semibold">Brand & Hardware</th>
                <th className="p-4 text-sm font-semibold">OS Architecture</th>
                <th className="p-4 text-sm font-semibold">Network Pipeline</th>
                <th className="p-4 text-sm font-semibold text-center">Status Matrix</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm dark:divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 italic">Menghubungkan ke kluster basis data...</td>
                </tr>
              ) : filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 italic">Tidak ada catatan data perangkat yang sesuai dengan kriteria pencarian.</td>
                </tr>
              ) : (
                filteredDevices.map((device) => (
                  <tr key={device.deviceId} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 text-center">
                      <input type="checkbox" checked={selectedDevices.includes(device.deviceId)} onChange={() => toggleSelectDevice(device.deviceId)} className="rounded" />
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{device.deviceName || 'Android Device Node'}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{device.deviceId}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{device.brand}</span>
                      <div className="text-xs text-slate-400">{device.model}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-blue-500" />
                        <span>Android {device.androidVersion}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">API Level {device.apiLevel || 'N/A'}</div>
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                      {device.networkType || 'WIFI'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${device.statusOnline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-500/10 border-slate-500/20 text-slate-400'}`}>
                        {device.statusOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
          }
