import { useEffect } from 'react';
import { useSocketStore } from '../store/useSocketStore';

export const useSocketEvent = (eventName, callback) => {
  const { socket, connectSocket } = useSocketStore();

  useEffect(() => {
    // Pastikan koneksi socket aktif jika belum terhubung
    if (!socket) {
      connectSocket();
      return;
    }

    socket.on(eventName, callback);

    // Fungsi pembersihan untuk mencegah kebocoran memori (memory leak) akibat duplikasi listener
    return () => {
      socket.off(eventName, callback);
    };
  }, [socket, eventName, callback, connectSocket]);
};
