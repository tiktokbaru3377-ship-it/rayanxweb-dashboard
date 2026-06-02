import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

export default function DeviceEnrollmentWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  const requestADBActivationPairing = async () => {
    setLoading(true);
    try {
      const res = await api.post('/enrollment/adb/generate');
      setPairingCode(res.data.pairingCode); // Mengambil 6 digit token kode unik
      setStep(2);
    } catch (err) {
      alert('Gagal generate token pairing ADB: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-white bg-slate-900 min-h-screen">
      <div className="max-w-xl mx-auto rounded-xl border border-white/10 bg-slate-800 p-8">
        <h3 className="text-2xl font-bold tracking-tight text-blue-400">Wireless ADB Device Enrollment Wizard</h3>
        <p className="text-slate-400 text-sm mt-1">Daftarkan perangkat enterprise baru secara legal menggunakan Wireless Debugging Node.</p>
        
        {/* Progress Bar Indicators */}
        <div className="mt-6 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span className={step >= 1 ? "text-blue-500" : ""}>STEP 1: INITIALIZATION</span>
          <div className="h-0.5 w-12 bg-slate-700"></div>
          <span className={step >= 2 ? "text-blue-500" : ""}>STEP 2: WIRELESS PAIRING</span>
          <div className="h-0.5 w-12 bg-slate-700"></div>
          <span className={step >= 3 ? "text-blue-500" : ""}>STEP 3: COMPLIANCE AUDIT</span>
        </div>

        <div className="mt-8">
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-sm text-slate-300 leading-relaxed">
                Sebelum memulai, pastikan perangkat Android target telah mengaktifkan mode **Developer Options**, masuk ke menu **Wireless Debugging**, lalu pilih opsi **Pair device with pairing code**.
              </p>
              <button
                onClick={requestADBActivationPairing}
                disabled={loading}
                className="mt-6 w-full rounded-lg bg-blue-600 p-3 font-semibold hover:bg-blue-700 transition"
              >
                {loading ? 'Initializing Secure Node...' : 'Generate Wireless Pairing Token'}
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <p className="text-sm text-slate-400">Masukkan kode 6 digit numerik ini pada jendela verifikasi perangkat Android Client Agent Anda:</p>
              <div className="my-6 tracking-widest text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                {pairingCode || '------'}
              </div>
              <div className="rounded-lg bg-slate-900 p-4 border border-white/5 text-left text-xs space-y-1 text-slate-400">
                <p className="font-semibold text-white">Status WebSocket Connection Listener:</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500"></span>
                  <span>Awaiting device pipeline response handshake...</span>
                </div>
              </div>
              <button
                onClick={() => setStep(3)}
                className="mt-6 text-sm text-slate-400 hover:text-white transition underline"
              >
                Simulasi bypass ke tahap verifikasi metadata
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-400 text-sm">
                ✔ Perangkat berhasil diidentifikasi & lolos enkripsi token pairing ADB.
              </div>
              <div className="mt-4 space-y-2 text-sm border-t border-white/10 pt-4">
                <div className="flex justify-between"><span className="text-slate-400">Model Perangkat:</span> <span>RayanX Pro Tablet (RX-2026)</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Android OS Node:</span> <span>Android 14 (API Level 34)</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Hardware Serial Fingerprint:</span> <span className="font-mono text-xs">A19B-882C-FF12-990X</span></div>
              </div>
              <button
                onClick={() => { setStep(1); setPairingCode(''); }}
                className="mt-6 w-full rounded-lg bg-emerald-600 p-3 font-semibold hover:bg-emerald-700 transition"
              >
                Selesaikan Pendaftaran & Otorisasi Armada Perangkat
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
                  }
