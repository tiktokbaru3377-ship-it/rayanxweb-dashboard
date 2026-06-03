import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // 1. Memastikan base path terkunci pada akar domain untuk CDN Vercel
  base: '/',

  plugins: [react()],
  
  resolve: {
    alias: {
      // Shortcut alias '@' untuk merujuk langsung ke folder 'src'
      '@': resolve(__dirname, 'src'),
    },
  },
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets', // Folder utama penampung aset statis hasil build
    sourcemap: false,    // Mematikan sourcemap untuk menghemat RAM Server Vercel saat kompilasi
    minify: 'terser',    // Menggunakan kompresor Terser untuk ukuran bundel terkecil
    terserOptions: {
      compress: {
        drop_console: true,  // Menghapus console.log di produksi agar data MDM tidak bocor ke publik
        drop_debugger: true, // Menghapus debugger runtime
      },
    },
    rollupOptions: {
      output: {
        // 2. Mengatur Pola Penamaan File JavaScript (.js)
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        
        // 3. Ekstraktor & Pemetaan Aset Statis (Termasuk src/index.css)
        assetFileNames: ({ name }) => {
          // Jika file berakhiran .css, paksa masuk ke folder assets/css/
          if (/\.(css)$/.test(name ?? '')) {
            return 'assets/css/[name]-[hash].[ext]';
          }
          // Aset lain (gambar, font, svg) masuk ke folder default assets/
          return 'assets/[name]-[hash].[ext]';
        },

        // 4. Optimasi Chunk Splitting (Mencegah Bundel Tunggal Terlalu Besar)
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('recharts') || id.includes('d3')) return 'vendor-charts';
            if (id.includes('socket.io-client')) return 'vendor-socket';
            return 'vendor-core'; // Menampung react, react-dom, zustand, react-router, dll.
          }
        },
      },
    },
  },
  
  server: {
    port: 3000, // Port lokal pengembangan frontend
  }
});
