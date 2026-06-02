import { create } from 'zustand';
import { io } from 'socket.io-client';
import { auth } from '../firebase/config';

export const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,
  
  connectSocket: async () => {
    if (get().socket?.connected) return;

    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const token = await currentUser.getIdToken();

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      secure: true
    });

    socket.on('connect', () => set({ isConnected: true }));
    socket.on('disconnect', () => set({ isConnected: false }));

    set({ socket });
  },

  disconnectSocket: () => {
    if (get().socket) {
      get().socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  }
}));
