/** @type {import('tailwindcss').Config} */
export default {
  // 1. Memastikan pencarian utility class mencakup seluruh sub-folder di dalam src
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  // 2. Mengaktifkan kendali manual tema gelap via manipulasi kelas HTML (<html class="dark">)
  darkMode: 'class',
  
  theme: {
    extend: {
      colors: {
        // Skema Warna Terpadu Korporat RayanX (MDM Matrix Colors)
        enterprise: {
          50: '#f0f4ff',
          100: '#d9e2ff',
          200: '#bbf7d0', // Untuk badge status sukses/online
          500: '#3b82f6', // Biru Utama Brand
          600: '#2563eb',
          900: '#1e3a8a',
          slateDark: '#020617', // Latar belakang utama dashboard ultra-dark (Flicker-Free)
          darkBg: '#0f172a',
          darkCard: '#1e293b',
          terminalBg: '#030712' // Latar hitam pekat khusus emulator ADB Shell
        }
      },
      
      // Aksentuasi Blur Kustom untuk Efek Glassmorphism di Atas Peta / Grafik
      backdropBlur: {
        xs: '2px',
        emulated: '20px',
      },
      
      // Matriks Animasi Tambahan untuk Sinyal Darurat, Ping Agen, dan Loading State
      animation: {
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-radar': 'radar 3s linear infinite',
      },
      
      // Definisi Keyframes untuk Animasi Custom SIEM Alert
      keyframes: {
        radar: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(3)', opacity: '0' },
        }
      },
      
      // Konfigurasi Bayangan (Box Shadows) untuk Panel Melayang / Modals
      boxShadow: {
        'glass-surface': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-border': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'neon-blue': '0 0 15px rgba(59, 130, 246, 0.5)',
        'neon-red': '0 0 15px rgba(239, 68, 68, 0.6)',
      }
    },
  },
  
  // Membuka jalan untuk ekspansi plugin Tailwind tambahan di masa depan
  plugins: [],
}
