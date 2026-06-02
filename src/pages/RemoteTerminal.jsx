import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSocketStore } from '../store/useSocketStore';
import { Terminal, ShieldAlert, Play, Trash2 } from 'lucide-react';

export default function RemoteTerminal() {
  const { deviceId } = useParams();
  const { socket } = useSocketStore();
  const [commandInput, setCommandInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState([
    { type: 'system', text: `Initializing secure upstream pipe to device: ${deviceId}` },
    { type: 'system', text: 'Type "help" to list available RayanX binary vectors.' }
  ]);
  const terminalBottomRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleTerminalOutput = (payload) => {
      if (payload.deviceId !== deviceId) return;
      setTerminalHistory((prev) => [...prev, { type: payload.status === 'SUCCESS' ? 'stdout' : 'stderr', text: payload.output }]);
    };

    socket.on('adb_shell_output', handleTerminalOutput);
    return () => {
      socket.off('adb_shell_output', handleTerminalOutput);
    };
  }, [socket, deviceId]);

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const executeShellCommand = (e) => {
    e.preventDefault();
    if (!commandInput.trim() || !socket) return;

    const cmd = commandInput.trim();
    // Tambahkan perintah lokal ke riwayat terminal
    setTerminalHistory((prev) => [...prev, { type: 'stdin', text: `$ ${cmd}` }]);

    // Emit payload ke server backend MDM untuk dieksekusi via ADB
    socket.emit('execute_adb_shell', {
      deviceId,
      command: cmd,
      timestamp: Date.now()
    });

    setCommandInput('');
  };

  return (
    <div className="space-y-6 text-xs font-mono text-white">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Terminal size={18} className="text-blue-500" /> Secure Shell Terminal Emulator
          </h3>
          <p className="text-slate-400 font-sans mt-0.5">Target Node Node Session: <span className="text-blue-400">{deviceId}</span></p>
        </div>
        <button 
          onClick={() => setTerminalHistory([{ type: 'system', text: 'Terminal logs flushed.' }])}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10 transition"
        >
          <Trash2 size={14} /> Flush Output Logs
        </button>
      </div>

      {/* WINDOW BUFFER DISPLAY TERMINAL */}
      <div className="w-full h-96 bg-slate-950 border border-white/10 rounded-xl p-4 overflow-y-auto space-y-1.5 shadow-2xl">
        {terminalHistory.map((log, index) => (
          <div key={index} className={`leading-relaxed break-all ${
            log.type === 'stdin' ? 'text-blue-400 font-bold' : 
            log.type === 'stderr' ? 'text-red-400 font-semibold' : 
            log.type === 'system' ? 'text-amber-500 italic' : 'text-slate-200'
          }`}>
            {log.text}
          </div>
        ))}
        <div ref={terminalBottomRef} />
      </div>

      {/* INPUT FORM EXECUTIVE */}
      <form onSubmit={executeShellCommand} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 font-bold">$</span>
          <input 
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="pm list packages -3 / dumpsys battery / input keyevent 26..."
            className="w-full rounded-lg border border-white/10 bg-slate-900 py-3 pl-8 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white"
          />
        </div>
        <button 
          type="submit"
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
        >
          <Play size={14} /> RUN
        </button>
      </form>

      <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4 text-slate-400 font-sans flex gap-3 items-start">
        <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={16} />
        <div>
          <span className="text-red-400 font-bold block mb-0.5">CRITICAL SECURITY WARNING</span>
          Perintah shell dieksekusi dengan hak istimewa (*elevated privileges*) tingkat sistem. Penyalahgunaan perintah shell seperti `rm -rf` dapat menyebabkan kerusakan data permanen atau hilangnya enkripsi partisi pada perangkat Android target.
        </div>
      </div>
    </div>
  );
      }
