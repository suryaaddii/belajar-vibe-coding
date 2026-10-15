# Feature: Registrasi User Baru (Endpoint POST /api/register)

## 1. Ringkasan & Tujuan
Dokumen ini merupakan panduan spesifikasi dan tahapan implementasi (*implementation plan*) fitur registrasi user baru untuk backend Bun + ElysiaJS + Drizzle ORM (MySQL). 

Dokumen ini disusun secara terstruktur agar mudah diimplementasikan oleh **junior programmer** atau **model AI**.

---

## 2. Spesifikasi Database (Drizzle ORM)

### Perubahan Skema: Tabel `users`
Perbarui skema tabel `users` pada `src/db/schema.ts` dengan struktur kolom berikut:

| Nama Kolom | Tipe Data MySQL | Keterangan |
| :--- | :--- | :--- |
| `id` | `serial` / `int auto_increment` | Primary Key |
| `name` | `varchar(255)` | Not Null |
| `email` | `varchar(255)` | Not Null, Unique |
| `password` | `varchar(255)` | Not Null, menampung hash bcrypt |
| `created_at` | `timestamp` | Default: `current_timestamp`, Not Null |

---

## 3. Spesifikasi API

### Endpoint Registrasi
- **URL**: `/api/register`
- **Method**: `POST`
- **Content-Type**: `application/json`

### Request Body
```json
{
  "name": "Surya",
  "email": "surya@localhost",
  "password": "rahasia"
}
```

#### Validasi Input:
- `name`: String, minimal 1 karakter, tidak boleh kosong.
- `email`: String, format email valid.
- `password`: String, minimal 6 karakter.

### Response

#### 1. Berhasil (Success - HTTP 200 / 201)
```json
{
  "data": "OK"
}
```

#### 2. Gagal: Email Sudah Terdaftar (Error - HTTP 400)
```json
{
  "error": "Email sudah terdaftar"
}
```

#### 3. Gagal: Validasi Input Tidak Sesuai (Error - HTTP 400 / 422)
```json
{
  "error": "Data yang dikirimkan tidak valid"
}
```

---

## 4. Struktur Arsitektur Folder & File

Pemisahan tanggung jawab (*separation of concerns*) wajib mengikuti struktur berikut:

```text
src/
├── db/
│   ├── index.ts          # Client Drizzle & koneksi pool MySQL
│   └── schema.ts         # Skema tabel users (tambahkan field password)
├── routes/
│   └── users-route.ts    # Definisi route ElysiaJS untuk user (handling request & response)
├── services/
│   └── users-service.ts  # Logic bisnis: cek duplikasi email, hashing password, query db
└── index.ts              # Entrypoint server Elysia (mount users-route)
```

> **Catatan Konvensi Penamaan:**
> - Folder `src/routes/` menggunakan format nama file: `users-route.ts`
> - Folder `src/services/` menggunakan format nama file: `users-service.ts`

---

## 5. Tahapan Implementasi

Pelaksana (programmer / AI) harus mengerjakan fitur ini secara berurutan:

### Langkah 1: Update Skema Database & Migrasi
1. Buka file `src/db/schema.ts`.
2. Tambahkan kolom `password: varchar("password", { length: 255 }).notNull()`.
3. Jalankan perintah migrasi skema:
   ```bash
   bun run db:generate
   ```
   *(Opsional: jalankan `bun run db:push` jika terhubung langsung ke database aktif)*.

### Langkah 2: Buat Service Layer (`src/services/users-service.ts`)
1. Buat file baru `src/services/users-service.ts`.
2. Buat fungsi registrasi (misal: `registerUser({ name, email, password })`).
3. Logika bisnis di dalam service:
   - **Cek duplikasi email**: Lakukan query ke database menggunakan Drizzle ORM untuk mencari user berdasarkan email.
   - **Validasi duplikasi**: Jika email sudah ada di database, lempar error atau kembalikan response kegagalan (`"Email sudah terdaftar"`).
   - **Hashing password**: Gunakan fitur hashing bcrypt bawaan Bun:
     ```ts
     const hashedPassword = await Bun.password.hash(password, {
       algorithm: "bcrypt",
       cost: 10,
     });
     ```
     *(Atau gunakan library bcrypt jika ditentukan lain)*.
   - **Simpan ke database**: Insert record baru ke tabel `users` dengan `name`, `email`, dan `password` (hasil hash).
   - Kembalikan status sukses.

### Langkah 3: Buat Route Layer (`src/routes/users-route.ts`)
1. Buat file baru `src/routes/users-route.ts`.
2. Inisialisasi route menggunakan sub-instance `Elysia`.
3. Definisikan endpoint `POST /register`:
   - Pasang skema validasi body menggunakan TypeBox bawaan Elysia (`t.Object({ ... })`).
   - Panggil service `registerUser` dari `src/services/users-service.ts`.
   - Jika service berhasil, atur HTTP status `200` atau `201` dan return `{ "data": "OK" }`.
   - Jika service mengembalikan error (misal email sudah terdaftar), atur HTTP status `400` dan return `{ "error": "Email sudah terdaftar" }`.

### Langkah 4: Hubungkan Route ke Server Utama (`src/index.ts`)
1. Buka file `src/index.ts`.
2. Import `usersRoute` dari `./routes/users-route`.
3. Pasang route ke aplikasi dengan prefix `/api`:
   ```ts
   app.group("/api", (app) => app.use(usersRoute))
   ```

### Langkah 5: Pengujian & Validasi
1. Jalankan pengecekan TypeScript:
   ```bash
   bun run typecheck
   ```
2. Jalankan server dev:
   ```bash
   bun run dev
   ```
3. Uji coba dengan `curl` atau REST Client:
   - **Test 1 (Registrasi Berhasil):**
     ```bash
     curl -X POST http://localhost:3001/api/register \
       -H "Content-Type: application/json" \
       -d '{"name": "Surya", "email": "surya@localhost", "password": "rahasia"}'
     ```
     *Ekspektasi*: HTTP 200/201 dengan body `{"data": "OK"}`.
   - **Test 2 (Email Duplikat):**
     Kirim request yang sama untuk kedua kalinya.
     *Ekspektasi*: HTTP 400 dengan body `{"error": "Email sudah terdaftar"}`.

---

## 6. Kriteria Keberhasilan (Acceptance Criteria Checklist)
- [x] Kolom `password` bertipe `varchar(255)` telah ditambahkan ke skema `users` di `src/db/schema.ts`.
- [x] File migrasi Drizzle telah digenerate.
- [x] Service `src/services/users-service.ts` terimplementasi dengan logika hashing bcrypt dan pengecekan email duplikat.
- [x] Route `src/routes/users-route.ts` menangani `POST /api/register` dengan format response sukses dan error yang sesuai.
- [x] Endpoint terpasang di `src/index.ts`.
- [x] Lolos type checking (`bun run typecheck`).
