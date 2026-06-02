import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Shield, ShieldAlert, ShieldCheck, Clock, UserX, UserCheck } from 'lucide-react';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('USERS'); // USERS | AUDIT_LOGS

  // Fetch daftar pengguna internal konsol
  const { data: usersData = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['consoleUsersRegistry'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.users;
    },
    enabled: activeTab === 'USERS'
  });

  // Fetch catatan forensik audit log
  const { data: auditLogs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['securityAuditTrails'],
    queryFn: async () => {
      const res = await api.get('/audit-logs');
      return res.data.logs;
    },
    enabled: activeTab === 'AUDIT_LOGS'
  });

  // Mutasi pembaruan Role Pengguna secara real-time
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }) => {
      return await api.patch(`/users/${userId}/role`, { role: newRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['consoleUsersRegistry']);
      alert('Hak akses otorisasi pengguna berhasil diperbarui.');
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Identity & Access Management (IAM)</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Kelola hierarki otorisasi pengguna dan pantau jejak audit forensik.</p>
      </div>

      {/* TAB CONTROLLERS */}
      <div className="flex border-b border-slate-200 dark:border-white/10">
        <button 
          onClick={() => setActiveTab('USERS')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${activeTab === 'USERS' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Console Administrators
        </button>
        <button 
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${activeTab === 'AUDIT_LOGS' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Security Audit Trails
        </button>
      </div>

      {/* VIEW PANEL CONFIGURATOR */}
      {activeTab === 'USERS' ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-400">
                  <th className="p-4">User Operator</th>
                  <th className="p-4">Assigned Role Privilege</th>
                  <th className="p-4">Last Console Handshake</th>
                  <th className="p-4 text-center">Action Framework</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm dark:divide-white/10">
                {isLoadingUsers ? (
                  <tr><td colSpan="4" className="p-8 text-center text-slate-400 italic">Fetching cluster IAM accounts...</td></tr>
                ) : usersData.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="p-4">
                      <div className="font-semibold">{usr.name || 'Anonymous Admin'}</div>
                      <div className="text-xs text-slate-400 font-mono">{usr.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${usr.role === 'Admin' ? 'bg-red-500/10 text-red-500' : usr.role === 'Operator' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-400'}`}>
                        {usr.role === 'Admin' ? <ShieldAlert size={12} /> : usr.role === 'Operator' ? <Shield size={12} /> : <ShieldCheck size={12} />}
                        {usr.role}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400 font-mono">
                      {usr.lastLogin ? new Date(usr.lastLogin).toLocaleString() : 'N/A'}
                    </td>
                    <td className="p-4 text-center">
                      <select 
                        value={usr.role}
                        onChange={(e) => updateUserRoleMutation.mutate({ userId: usr.id, newRole: e.target.value })}
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs font-medium dark:border-white/10 dark:bg-slate-800 focus:outline-none"
                      >
                        <option value="Admin">Elevate to Admin</option>
                        <option value="Operator">Set to Operator</option>
                        <option value="Viewer">Restrict to Viewer</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="p-4 font-mono text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-white/10 flex items-center gap-2">
            <Clock size={14} /> Immutable Audit Logs Ledger (SIEM Compliance)
          </div>
          <div className="divide-y divide-slate-200 dark:divide-white/10">
            {isLoadingLogs ? (
              <div className="p-8 text-center text-slate-400 italic">Streaming compliance records...</div>
            ) : auditLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 italic">No critical mutation events logged within this lifecycle session.</div>
            ) : auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold text-blue-400 uppercase">{log.action}</span>
                    <span className="text-slate-400 font-medium">by {log.executedBy}</span>
                  </div>
                  <p className="text-slate-300 font-sans">{log.details}</p>
                </div>
                <div className="text-right font-mono text-slate-500 shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
