import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'wss://api.rayanx.internal';

// Buat instance socket tetapi MATIKAN fungsi otomatis terkoneksi (autoConnect: false)
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket'], // Paksa menggunakan WebSocket murni tanpa HTTP Polling untuk efisiensi kecepatan
  reconnectionAttempts: 5,
  timeout: 10000
});

// Pemicu koneksi manual yang hanya dipanggil SETELAH operator berhasil masuk dashboard
export const connectSocketSecurely = (token) => {
  socket.auth = { token };
  if (!socket.connected) {
    socket.connect();
    console.log('[SOCKET] Security tunnel connected via token elevation.');
  }
};

// Pemutus koneksi saat logout
export const disconnectSocketSecurely = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log('[SOCKET] Tunnel safely closed.');
  }
};
