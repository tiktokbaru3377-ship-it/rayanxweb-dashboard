import React from 'react';
import { useToastStore } from '../../store/useToastStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShieldAlert, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-5 right-5 z-[9999] space-y-2.5 w-full max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            className={`flex items-start gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-md text-xs font-medium text-white ${toast.type === 'panic' ? 'border-red-500/30 bg-red-950/80' : 'border-blue-500/30 bg-slate-900/80'}`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'panic' ? <ShieldAlert className="text-red-400 animate-bounce" size={16} /> : <Bell className="text-blue-400" size={16} />}
            </div>
            <div className="flex-1 leading-relaxed">
              <span className="font-bold block mb-0.5">{toast.type === 'panic' ? 'CRITICAL HARDWARE FAULT' : 'AGENT SIGNAL'}</span>
              {toast.message}
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-white shrink-0">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
