import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Send, CheckCircle, AlertTriangle } from 'lucide-react';

export default function NotificationCenter() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Fetch riwayat pengiriman notifikasi FCM
  const { data: dispatchLogs = [], isLoading } = useQuery({
    queryKey: ['fcmDeliveryLogs'],
    queryFn: async () => {
      const res = await api.get('/notifications/logs');
      return res.data.logs;
    }
  });

  // Mutasi pengiriman broadcast FCM payload
  const broadcastNotificationMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/notifications/broadcast', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fcmDeliveryLogs']);
      reset();
      alert('Sinyal push notification berhasil dipancarkan secara global.');
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* FORM DISPATCH NOTIFICATION CONTAINER */}
      <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 h-fit">
        <h4 className="text-md font-bold tracking-tight mb-4">Broadcast Dispatcher</h4>
        <form onSubmit={handleSubmit((data) => broadcastNotificationMutation.mutate(data))} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase text-slate-400">Notification Title</label>
            <input 
              {...register('title', { required: 'Judul notifikasi wajib diisi' })}
              type="text" 
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 dark:border-white/10 dark:bg-slate-800 text-white focus:outline-none focus:border-blue-500"
              placeholder="SYSTEM ALERT: Scheduled Maintenance"
            />
            {errors.title && <span className="text-red-400">{errors.title.message}</span>}
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-400">Message Body Context</label>
            <textarea 
              {...register('body', { required: 'Konten deskripsi wajib diisi' })}
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 dark:border-white/10 dark:bg-slate-800 text-white focus:outline-none focus:border-blue-500"
              placeholder="Harap simpan semua pekerjaan Anda. Agen MDM akan melakukan pembaruan keamanan berkala dalam waktu 5 menit."
            />
            {errors.body && <span className="text-red-400">{errors.body.message}</span>}
          </div>

          <button 
            disabled={broadcastNotificationMutation.isPending}
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 p-2.5 font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Send size={14} /> {broadcastNotificationMutation.isPending ? 'Spreading Signals...' : 'Transmit FCM Payload'}
          </button>
        </form>
      </div>

      {/* HISTORICAL DELIVERY REPORT STATUS */}
      <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <h4 className="text-md font-bold tracking-tight mb-4">FCM Infrastructure Delivery Logs</h4>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="text-center text-slate-400 text-sm italic">Polling delivery nodes matrix...</div>
          ) : dispatchLogs.length === 0 ? (
            <div className="text-center text-slate-400 text-sm italic">No broadcast vectors dispatched within this scope.</div>
          ) : dispatchLogs.map((log) => (
            <div key={log.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/30 text-xs">
              <div className="mt-0.5 shrink-0">
                {log.status === 'SUCCESS' ? <CheckCircle className="text-emerald-500" size={16} /> : <AlertTriangle className="text-red-500" size={16} />}
              </div>
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-200">{log.title}</span>
                  <span className="font-mono text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-slate-400 leading-relaxed">{log.body}</p>
                <div className="flex gap-4 pt-1 font-mono text-[10px] text-slate-500">
                  <div>Recipients: <span className="text-blue-400 font-bold">{log.targetCount} units</span></div>
                  <div>Ack Rate: <span className="text-emerald-400 font-bold">{log.successRate}%</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
