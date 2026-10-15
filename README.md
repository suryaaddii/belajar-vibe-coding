# Belajar Vibe Coding - Backend API

Proyek backend modern yang dibangun menggunakan **Bun**, **ElysiaJS**, **Drizzle ORM**, dan **MySQL**.

## 🚀 Tech Stack

- **Runtime & Package Manager**: [Bun](https://bun.sh/)
- **Web Framework**: [ElysiaJS](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database Driver**: [mysql2](https://github.com/sidorares/node-mysql2)
- **Database Engine**: MySQL

---

## 📁 Struktur Direktori

```text
├── drizzle/              # Folder file migrasi SQL hasil Drizzle Kit
├── src/
│   ├── db/
│   │   ├── index.ts      # Inisialisasi koneksi pool MySQL & Drizzle instance
│   │   └── schema.ts     # Definisi skema tabel database (Drizzle MySQL)
│   └── index.ts          # Entrypoint aplikasi Elysia & route definitions
├── .env.example          # Template environment variable
├── .env                  # Environment variable lokal (git-ignored)
├── drizzle.config.ts     # Konfigurasi Drizzle Kit untuk MySQL
├── package.json          # Manifest dependensi & script runner
└── tsconfig.json         # Konfigurasi TypeScript untuk Bun
```

---

## 🛠️ Persiapan & Instalasi

### 1. Prerequisites
- **Bun** (v1.0+)
- **MySQL Server** (lokal atau cloud instance)

### 2. Instalasi Dependensi
```bash
bun install
```

### 3. Konfigurasi Environment
Salin file `.env.example` menjadi `.env`, lalu sesuaikan kredensial database Anda:
```bash
cp .env.example .env
```

Contoh konfigurasi `.env`:
```env
PORT=3001
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=belajar_vibe_coding
```

---

## 🗄️ Database & Migrasi (Drizzle Kit)

- **Generate SQL Migration**:
  ```bash
  bun run db:generate
  ```
- **Push Skema Langsung ke Database (Development)**:
  ```bash
  bun run db:push
  ```
- **Jalankan Drizzle Studio (Database GUI)**:
  ```bash
  bun run db:studio
  ```

---

## 🏃 Menjalankan Aplikasi

- **Mode Development (Hot Reload)**:
  ```bash
  bun run dev
  ```
- **Mode Production**:
  ```bash
  bun run start
  ```
- **Type Checking**:
  ```bash
  bun run typecheck
  ```

---

## 📡 API Endpoints

| Method | Endpoint  | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/` | API status & welcome message |
| `GET` | `/health` | Health check & system uptime |
| `POST` | `/api/register` | Registrasi user baru (`name`, `email`, `password`) |
| `POST` | `/api/users/login` | Login user & generate session token (`email`, `password`) |
