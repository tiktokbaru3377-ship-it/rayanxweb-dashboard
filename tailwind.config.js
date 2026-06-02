/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        enterprise: {
          50: '#f0f4ff',
          100: '#d9e2ff',
          500: '#3b82f6',
          900: '#1e3a8a',
          darkBg: '#0f172a',
          darkCard: '#1e293b'
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
