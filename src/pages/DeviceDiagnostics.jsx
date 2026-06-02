import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { useSocketStore } from '../store/useSocketStore';
import { Heart, Battery, Wifi, Cpu, ShieldCheck, PlayCircle } from 'lucide-react';

export default function DeviceDiagnostics() {
  const { deviceId } = useParams();
  const { socket } = useSocketStore();
  const [telemetry, setTelemetry] = useState(null);
  const [testSuite, setTestSuite] = useState({
    hardwareScreen: 'IDLE', // IDLE | TESTING | PASSED | FAILED
    storageIO: 'IDLE',
    cryptoChip: 'IDLE'
  });

  // Dengarkan siaran metrik diagnostik mendalam dari Android Agent Client
  useSocketEvent('device_diagnostics_packet', (payload) => {
    if (payload.deviceId !== deviceId) return;
    setTelemetry(payload.diagnostics);
  });

  const triggerSubsystemTest = (testType) => {
    if (!socket) return;
    
    setTestSuite(prev => ({ ...prev, [testType]: 'TESTING' }));
    
    socket.emit('trigger_agent_hardware_test', {
      deviceId,
      testName: testType,
      timestamp: Date.now()
    });
  };

  // Dengarkan hasil pengujian subsistem dari agen perangkat
  useSocketEvent('hardware_test_result', (payload) => {
    if (payload.deviceId !== deviceId) return;
    setTestSuite(prev => ({ ...prev, [payload.testName]: payload.result }));
  });

  return (
    <div className="space-y-6 text-xs text-white">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Interactive Diagnostics Sandbox</h3>
          <p className="text-sm text-slate-400 font-sans">Uji fungsionalitas komponen fisik, modul enkripsi perangkat keras, dan kalibrasi sensor Android.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TELEMETRY STATE DISPLAY PANEL */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-slate-900 p-6 space-y-4">
          <h4 className="text-sm font-bold tracking-tight text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <Heart size={14} className="animate-pulse" /> Real-time Subsystem Matrix
          </h4>
          
          {!telemetry ? (
            <div className="text-center py-12 italic text-slate-500 font-sans">
              Menunggu instruksi jabat tangan (*handshake*) dari Android Agent...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-white/5 flex items-center gap-3">
                <Battery className="text-emerald-400" size={18} />
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[10px]">Power Management</span>
                  <span className="text-slate-200 font-medium font-mono text-sm">{telemetry.batteryTemp}°C | Health: {telemetry.batteryHealth}</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-white/5 flex items-center gap-3">
                <Wifi className="text-blue-400" size={18} />
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[10px]">Signal Attenuation</span>
                  <span className="text-slate-200 font-medium font-mono text-sm">{telemetry.rssiSignal} dBm ({telemetry.carrierName})</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-white/5 flex items-center gap-3">
                <Cpu className="text-purple-400" size={18} />
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[10px]">Kernel Architecture</span>
                  <span className="text-slate-200 font-medium font-mono text-sm">{telemetry.cpuGovernor} | Cores: {telemetry.activeCores}</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-white/5 flex items-center gap-3">
                <ShieldCheck className="text-amber-400" size={18} />
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[10px]">Google Play Integrity</span>
                  <span className="text-slate-200 font-medium font-mono text-sm uppercase">{telemetry.playIntegrityVerdict}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* REMOTE MANUAL ACTION SUITE TESTING */}
        <div className="lg:col-span-1 rounded-xl border border-white/10 bg-slate-900 p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold tracking-tight mb-4 text-amber-500 uppercase tracking-wider">Automated Target Test Suite</h4>
            <div className="space-y-3">
              {[
                { id: 'hardwareScreen', label: 'Display Panel Calibration & Dead Pixel Test' },
                { id: 'storageIO', label: 'EMMC/UFS Flash Memory Read/Write I/O Test' },
                { id: 'cryptoChip', label: 'Hardware KeyStore TEE Enclave Cryptographic Validation' }
              ].map((test) => (
                <div key={test.id} className="p-3 bg-slate-950 border border-white/5 rounded-lg flex items-center justify-between">
                  <div className="max-w-[70%]">
                    <span className="font-bold text-slate-200 block truncate">{test.label}</span>
                    <span className={`text-[10px] font-mono ${
                      testSuite[test.id] === 'PASSED' ? 'text-emerald-400 font-bold' :
                      testSuite[test.id] === 'FAILED' ? 'text-red-400 font-bold' :
                      testSuite[test.id] === 'TESTING' ? 'text-amber-400 animate-pulse' : 'text-slate-500'
                    }`}>{testSuite[test.id]}</span>
                  </div>
                  <button 
                    disabled={testSuite[test.id] === 'TESTING'}
                    onClick={() => triggerSubsystemTest(test.id)}
                    className="p-1.5 rounded bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white transition disabled:opacity-30"
                  >
                    <PlayCircle size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
