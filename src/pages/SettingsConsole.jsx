import React from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { Save, RefreshCw, Cpu } from 'lucide-react';

export default function SettingsConsole() {
  const { register, handleSubmit, reset } = useForm();

  // Fetch konfigurasi infrastruktur runtime server
  const { isLoading } = useQuery({
    queryKey: ['systemClusterConfig'],
    queryFn: async () => {
      const res = await api.get('/settings/cluster');
      reset(res.data.config);
      return res.data.config;
    }
  });

  // Mutasi pembaruan runtime parameter server
  const saveConfigMutation = useMutation({
    mutationFn: async (formData) => {
      return await api.put('/settings/cluster', formData);
    },
    onSuccess: () => {
      alert('Konfigurasi kluster kluster berhasil dimutasi ke memori Redis.');
    }
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-xs text-white">
      <div>
        <h3 className="text-2xl font-bold tracking-tight text-white">Infrastructure Core Console</h3>
        <p className="text-sm text-slate-400">Modifikasi parameter sistem, ambang batas I/O, dan toleransi pemulihan kegagalan koneksi.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900 p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-6 text-blue-400 font-bold border-b border-white/5 pb-3">
          <Cpu size={16} /> ENGINE CRITICAL POLICIES
        </div>

        {isLoading ? (
          <div className="text-center py-6 italic text-slate-500">Decrypting core environment registers...</div>
        ) : (
          <form onSubmit={handleSubmit((data) => saveConfigMutation.mutate(data))} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold uppercase text-slate-400">Express API Rate Limiter Window (ms)</label>
                <input 
                  {...register('apiRateLimitWindow')}
                  type="number" 
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold uppercase text-slate-400">Max Requests / Target IP Window</label>
                <input 
                  {...register('apiMaxRequests')}
                  type="number" 
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold uppercase text-slate-400">Socket Flood Max Evaluated Packets</label>
                <input 
                  {...register('socketMaxPackets')}
                  type="number" 
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold uppercase text-slate-400">Node Container Memory Threshold (MB)</label>
                <input 
                  {...register('memoryRecycleThreshold')}
                  type="number" 
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => queryClient.invalidateQueries(['systemClusterConfig'])}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-semibold hover:bg-white/10 transition"
              >
                <RefreshCw size={14} /> Rollback
              </button>
              <button 
                type="submit"
                disabled={saveConfigMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Save size={14} /> {saveConfigMutation.isPending ? 'Committing...' : 'Commit System Alteration'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
                  }
