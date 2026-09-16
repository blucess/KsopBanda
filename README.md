# Sistem Otomasi Surat Persetujuan Bongkar / Muat Barang Berbahaya
### Kantor Kesyahbandaran dan Otoritas Pelabuhan (KSOP) Kelas IV Banda Naira
Kementerian Perhubungan Republik Indonesia — Direktorat Jenderal Perhubungan Laut

Aplikasi web modern berbasis klien (*client-side standalone*) untuk mengotomasi pembuatan, penomoran, pratinjau langsung (*live preview*), dan ekspor resmi dokumen **Surat Persetujuan Bongkar / Muat Barang Berbahaya** dengan standar ukuran kertas **A4 (Pas 1 Lembar)** yang 100% presisi sesuai format kedinasan `template.doc` asli.

---

## 🌟 Fitur Utama

- **100% Presisi Format Template Resmi:**
  - Kop surat resmi Kementerian Perhubungan dengan logo beresolusi tinggi dan struktur tabel 3 kolom simetris.
  - Tipografi sesuai regulasi kedinasan: Judul & isi teks menggunakan **Times New Roman** (11pt & 12pt), kop menggunakan **Arial** (9pt, 12pt, 14pt, 16pt), dan nomor surat menggunakan **Courier New Bold** (11.5pt).
  - Garis pembatas kop surat resmi ganda (tebal 2.25pt & tipis 0.75pt).
  - Area tanda tangan lega (jarak ~68pt / 2.5 cm) untuk stempel cap dinas dan tanda tangan basah Kepala Kantor.
- **Standar Ukuran Kertas A4 (Tepat 1 Halaman):**
  - Dikonfigurasi dengan metrik halaman `size: 21.0cm 841.95pt` (`wdPaperA4`), diuji langsung menggunakan Microsoft Word COM engine pas tepat 1 halaman tanpa meluap ke halaman kedua.
- **Generator Nomor Surat Otomatis & Manual:**
  - Otomatis merakit nomor surat standar KSOP Banda Naira (misal: `KL.206/02/IX/KSOP.BND-2026`) berdasarkan input nomor urut, bulan Romawi, dan tahun, atau input teks bebas jika diinginkan.
- **Database Kapal & Agen Interaktif:**
  - Dilengkapi fitur **Tambah Kapal Baru**, **Penyimpanan Lokal (localStorage)**, dan **Kelola Preset Kapal** (hapus/reset ke default).
  - Memilih kapal otomatis mengisi jenis kapal, GT, LOA, nahkoda, agen pelayaran, dan nomor permohonan.
- **Riwayat Surat (History Manager):**
  - Menyimpan draf surat yang telah dibuat sehingga bisa dibuka kembali kapan saja tanpa takut data hilang.
- **Multi-Format Export:**
  - **Unduh Word (.doc):** Menghasilkan dokumen Microsoft Word murni (Word MSO HTML) dengan tata letak Print Layout.
  - **Cetak Langsung / Simpan PDF:** Siap dicetak langsung dari peramban dengan pengaturan `@media print` yang bersih dan rapi.
- **Arsip Otomatis ke Google Drive (Tahun / Bulan):**
  - Mengarsipkan salinan PDF dokumen secara otomatis ke Google Drive setiap kali tombol **Cetak / PDF** diklik.
  - Pengelompokan folder otomatis bertingkat: `[Folder Utama] > [Tahun] > [Bulan]` (contoh: `Arsip Surat KSOP Banda Naira > 2026 > 09 - September`).
  - Menggunakan Google Apps Script Web App gratis tanpa perlu server berbayar, aman, dan langsung aktif di akun Google kantor.
- **Responsif di HP / Smartphone (Mobile Optimized):**
  - Navigasi tab khusus mobile (`Formulir Input` & `Pratinjau Surat A4`).
  - Fitur **Auto-Fit Layar HP**: Lembar surat A4 otomatis diskalakan agar pas dengan lebar layar ponsel tanpa perlu geser horizontal.
  - Bilah tombol aksi mengambang (*Floating Action Bar*) untuk mengunduh Word dan mencetak langsung dari smartphone.

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Langsung dari Komputer (Tanpa Server)
Buka file `index.html` langsung menggunakan peramban Google Chrome, Microsoft Edge, atau Mozilla Firefox.

### 2. Akses dari HP / Smartphone via Wi-Fi Lokal
1. Pastikan HP dan komputer terhubung ke jaringan **Wi-Fi yang sama**.
2. Double-click file `buka_di_hp.bat` pada komputer.
3. Buka browser di HP Anda dan ketikkan alamat IP yang muncul di layar terminal (misal: `http://192.168.1.8:3000`), atau scan QR Code yang tersedia.

---

## 🌐 Publikasi ke GitHub Pages (Akses Online Bebas dari Mana Saja)

Aplikasi ini dapat diakses secara publik dan gratis melalui **GitHub Pages**:

1. Buat repository baru di [GitHub](https://github.com/new).
2. Unggah/push kode project ini ke GitHub:
   ```bash
   git remote add origin https://github.com/<username-anda>/<nama-repo>.git
   git branch -M main
   git push -u origin main
   ```
3. Di repository GitHub Anda, buka menu **Settings** > **Pages**.
4. Pada bagian **Build and deployment** > **Branch**, pilih branch `main` dan folder `/(root)`, lalu klik **Save**.
5. Dalam beberapa saat, link website publik Anda akan aktif (misal: `https://<username-anda>.github.io/<nama-repo>/`).

---

## 📁 Struktur File Project

```text
├── index.html                           # Aplikasi utama (Frontend SPA, Vue 3, Tailwind CSS, Base64 Logo)
├── google_drive_script.gs               # Backend skrip Google Apps Script untuk arsip otomatis ke Google Drive
├── server.js                            # HTTP server lokal ringan untuk akses jaringan HP / LAN
├── buka_di_hp.bat                       # Script 1-klik untuk memulai server HP di Windows
├── template.doc                         # Template dokumen referensi resmi KSOP
├── surat_persetujuan_banda_naira.doc   # Contoh hasil ekspor Word terverifikasi pas 1 lembar A4
├── README.md                            # Dokumentasi lengkap proyek
└── .gitignore                           # Filter file sementara Word & log
```

---

## 🏛️ Instansi Terkait
**Kementerian Perhubungan Republik Indonesia**  
**Direktorat Jenderal Perhubungan Laut**  
**Kantor Kesyahbandaran dan Otoritas Pelabuhan Kelas IV Banda Naira**  
*Jln. Pelabuhan, Kompleks Pelabuhan, Banda Naira (97593)*  
*Telepon: (0910) 21172 | Email: ksop_bandaneira@yahoo.com*
