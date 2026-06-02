import { useEffect, useRef } from 'react';
import { useSocketStore } from '../store/useSocketStore';

export const useThrottledSocketEvent = (eventName, callback, delay = 1500) => {
  const { socket } = useSocketStore();
  const bufferRef = useRef([]);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingStream = (payload) => {
      bufferRef.current.push(payload);
    };

    socket.on(eventName, handleIncomingStream);

    // Timer Batching Interval: Menguras buffer dan mengirimkannya secara berkala
    const flushBatchTimer = setInterval(() => {
      if (bufferRef.current.length === 0) return;
      
      // Kirim seluruh kumpulan data terkumpul ke komponen visual
      callbackRef.current([...bufferRef.current]);
      bufferRef.current = [];
    }, delay);

    return () => {
      socket.off(eventName, handleIncomingStream);
      clearInterval(flushBatchTimer);
    };
  }, [socket, eventName, delay]);
};
