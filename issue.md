# Planning: Setup Project Backend dengan Bun, ElysiaJS, Drizzle & MySQL

## 1. Overview & Tujuan
Dokumen ini merupakan panduan tingkat tinggi (*high-level plan*) untuk inisialisasi dan konfigurasi proyek backend baru di direktori ini. Dokumen ini ditujukan sebagai acuan bagi programmer atau model LLM untuk mengimplementasikan proyek langkah demi langkah.

### Tech Stack
- **Runtime & Package Manager**: [Bun](https://bun.sh/)
- **Web Framework**: [ElysiaJS](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database Driver**: MySQL (driver `mysql2`)
- **Database Engine**: MySQL

---

## 2. Rencana Tahapan Implementasi

### Tahap 1: Inisialisasi Proyek
- Inisialisasi proyek Bun di direktori root.
- Konfigurasi `package.json` dan `tsconfig.json` standar untuk TypeScript di lingkungan Bun.
- Instalasi dependensi utama:
  - `elysia`
  - `drizzle-orm`
  - `mysql2`
- Instalasi dependensi pendukung / dev:
  - `drizzle-kit` (CLI untuk migrasi dan inspeksi skema)
  - `@types/bun`

### Tahap 2: Manajemen Environment & Konfigurasi
- Buat file template `.env.example` dan `.env` lokal untuk konfigurasi koneksi database:
  - `DATABASE_HOST`
  - `DATABASE_PORT`
  - `DATABASE_USER`
  - `DATABASE_PASSWORD`
  - `DATABASE_NAME`
  - `PORT` (untuk server Elysia, misal: 3000)
- Pastikan file `.env` diabaikan dalam `.gitignore`.

### Tahap 3: Konfigurasi Database & Drizzle ORM
- **Struktur Folder**: Siapkan direktori sumber (misal: `src/` atau `src/db/`).
- **Konfigurasi Drizzle Kit**:
  - Buat file `drizzle.config.ts` untuk mengarahkan path skema dan konfigurasi koneksi database MySQL.
- **Koneksi Database**:
  - Buat modul inisialisasi client database menggunakan instance `drizzle` dan koneksi pool `mysql2`.
- **Skema Awal**:
  - Buat contoh skema tabel awal (misal: tabel `users` atau tabel entitas dasar lainnya) untuk memvalidasi integrasi Drizzle dengan MySQL.
- **Script Migrasi di package.json**:
  - Tambahkan script untuk migrasi atau push skema (seperti `drizzle-kit push` atau `drizzle-kit generate`).

### Tahap 4: Setup Server ElysiaJS
- **Entrypoint Server**:
  - Buat file entrypoint utama (misal: `src/index.ts`).
  - Inisialisasi instance ElysiaJS.
- **Route & Controller Dasar**:
  - Buat endpoint health check (`GET /` atau `GET /health`).
  - Buat endpoint contoh yang berinteraksi dengan database via Drizzle (misal: endpoint CRUD sederhana atau pembacaan data sederhana).
- **Jalankan Server**:
  - Konfigurasi listen port sesuai environment variable.

### Tahap 5: Pengujian & Validasi
- Jalankan migrasi atau sinkronisasi skema ke database MySQL lokal/development.
- Jalankan server menggunakan command `bun run dev` atau `bun --watch src/index.ts`.
- Verifikasi bahwa:
  1. Server berjalan lancar tanpa error kompilasi/runtime.
  2. Endpoint health check merespons dengan status 200 OK.
  3. Query ke database menggunakan Drizzle ORM berhasil dijalankan.

---

## 3. Kriteria Keberhasilan (Acceptance Criteria)
- [x] Proyek terinisialisasi rapi dengan Bun dan file konfigurasi TypeScript yang valid.
- [x] Dependensi `elysia`, `drizzle-orm`, `mysql2`, dan `drizzle-kit` terpasang.
- [x] Terdapat file `.env.example` dan konfigurasi environment yang jelas.
- [x] Koneksi Drizzle ORM ke MySQL terhubung dengan benar dan memiliki contoh skema.
- [x] Server ElysiaJS dapat dijalankan dan merespons request HTTP.
- [x] Dokumentasi singkat cara menjalankan proyek tersedia di `README.md`.
