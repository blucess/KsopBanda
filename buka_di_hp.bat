@echo off
title Server Akses HP - Otomasi Surat KSOP Banda Naira
color 0B
echo Memeriksa Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terpasang atau tidak ada di PATH!
    echo Silakan install Node.js terlebih dahulu.
    pause
    exit /b
)

echo Memulai Server Lokal untuk Akses Smartphone/HP...
start http://localhost:3000
node server.js
pause
