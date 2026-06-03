import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Matikan sourcemap untuk mempercepat proses build di Vercel & menghemat RAM
    minify: 'terser', // Menggunakan terser untuk kompresi tingkat tinggi
    terserOptions: {
      compress: {
        drop_console: true, // Menghapus console.log pada versi produksi agar data MDM tidak bocor
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        // Optimasi Chunk Splitting untuk mencegah penumpukan memori pada satu file besar
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('recharts') || id.includes('d3')) return 'vendor-charts';
            if (id.includes('socket.io-client')) return 'vendor-socket';
            return 'vendor-core'; // react, react-router, zustand, dll.
          }
        },
      },
    },
  },
  server: {
    port: 3000,
  }
});
