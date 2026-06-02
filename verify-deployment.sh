#!/bin/bash

# ==============================================================================
# RAYANXWEB DASHBOARD PRODUCTION READINESS VERIFIER
# ==============================================================================

COLOR_RESET="\033[0m"
COLOR_SUCCESS="\033[32m"
COLOR_ERROR="\033[31m"
COLOR_INFO="\033[34m"

echo -e "${COLOR_INFO}[INFO] Memulai audit kelayakan distribusi RayanXWeb Dashboard...${COLOR_RESET}"

# 1. Validasi Keberadaan Berkas Variabel Lingkungan (.env)
if [ ! -f .env ]; then
    echo -e "${COLOR_ERROR}[ERROR] Berkas .env tidak ditemukan! Salin dari .env.example terlebih dahulu.${COLOR_RESET}"
    exit 1
else
    echo -e "${COLOR_SUCCESS}[SUCCESS] Berkas manifest .env terdeteksi.${COLOR_RESET}"
fi

# 2. Audit Kunci Enkripsi Firebase didalam lingkungan .env
if grep -q "VITE_FIREBASE_API_KEY=\"\"" .env || ! grep -q "VITE_FIREBASE_API_KEY" .env; then
    echo -e "${COLOR_ERROR}[ERROR] Kunci VITE_FIREBASE_API_KEY masih kosong atau tidak valid!${COLOR_RESET}"
    exit 1
fi

# 3. Uji Proses Kompilasi Bundel Statis Vite
echo -e "${COLOR_INFO}[INFO] Menjalankan uji kompilasi aset statis (npm run build)...${COLOR_RESET}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${COLOR_SUCCESS}[SUCCESS] Kompilasi selesai. Folder /dist siap didistribusikan ke Vercel CDN Node Cluster.${COLOR_RESET}"
    exit 0
else
    echo -e "${COLOR_ERROR}[ERROR] Kompilasi gagal! Periksa kembali kesalahan sintaks atau dependensi kode.${COLOR_RESET}"
    exit 1
fi
