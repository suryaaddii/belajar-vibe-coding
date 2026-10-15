# Feature: User Login & Session Management (Endpoint POST /api/users/login)

## 1. Ringkasan & Tujuan
Dokumen ini merupakan panduan spesifikasi dan tahapan implementasi (*implementation plan*) fitur login user dan pembuatan session token untuk backend Bun + ElysiaJS + Drizzle ORM (MySQL).

Dokumen ini disusun secara terstruktur agar mudah diimplementasikan oleh **junior programmer** atau **model AI**.

---

## 2. Spesifikasi Database (Drizzle ORM)

### Pembuatan Skema Baru: Tabel `sessions`
Tambahkan skema tabel `sessions` pada `src/db/schema.ts` dengan struktur kolom berikut:

| Nama Kolom | Tipe Data MySQL | Keterangan |
| :--- | :--- | :--- |
| `id` | `serial` / `int auto_increment` | Primary Key |
| `token` | `varchar(255)` | Not Null, menampung UUID session token user |
| `user_id` | `int` | Foreign Key mengarah ke `users.id` |
| `created_at` | `timestamp` | Default: `current_timestamp`, Not Null |

#### Hubungan Relasi (Foreign Key):
- `user_id` pada tabel `sessions` merujuk ke kolom `id` pada tabel `users`.

---

## 3. Spesifikasi API

### Endpoint Login
- **URL**: `/api/users/login`
- **Method**: `POST`
- **Content-Type**: `application/json`

### Request Body
```json
{
  "email": "surya@localhost",
  "password": "rahasia"
}
```

#### Validasi Input:
- `email`: String, tidak boleh kosong, format email valid.
- `password`: String, tidak boleh kosong.

### Response

#### 1. Berhasil (Success - HTTP 200)
Mengembalikan token UUID yang baru dibuat:
```json
{
  "data": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 2. Gagal: Kredensial Salah (Error - HTTP 400)
Jika email tidak ditemukan ATAU password salah (gunakan pesan umum untuk keamanan):
```json
{
  "error": "Email atau password salah"
}
```

#### 3. Gagal: Validasi Input Tidak Sesuai (Error - HTTP 400)
```json
{
  "error": "Data yang dikirimkan tidak valid"
}
```

---

## 4. Struktur Arsitektur Folder & File

Pemisahan tanggung jawab (*separation of concerns*) mengikuti struktur yang ada:

```text
src/
├── db/
│   ├── index.ts          # Client Drizzle & koneksi pool MySQL
│   └── schema.ts         # Skema tabel users & sessions (tambahkan tabel sessions)
├── routes/
│   └── users-route.ts    # Definisi route ElysiaJS (registrasi, login user)
├── services/
│   └── users-service.ts  # Logic bisnis: verifikasi password bcrypt, generate UUID token, simpan session
└── index.ts              # Entrypoint server Elysia (mount routing /api)
```

> **Catatan Konvensi Penamaan:**
> - Folder `src/routes/`: menggunakan format nama file `users-route.ts`
> - Folder `src/services/`: menggunakan format nama file `users-service.ts`

---

## 5. Tahapan Implementasi

Pelaksana (programmer / AI) harus mengerjakan fitur ini secara berurutan:

### Langkah 1: Update Skema Database & Migrasi
1. Buka file `src/db/schema.ts`.
2. Import tipe `int` dari `drizzle-orm/mysql-core`.
3. Definisikan tabel `sessions`:
   ```ts
   export const sessions = mysqlTable("sessions", {
     id: serial("id").primaryKey(),
     token: varchar("token", { length: 255 }).notNull(),
     userId: int("user_id").notNull().references(() => users.id),
     createdAt: timestamp("created_at").defaultNow().notNull(),
   });
   ```
4. Export tipe inferensi `Session` dan `NewSession`.
5. Jalankan perintah untuk menghasilkan file migrasi:
   ```bash
   bun run db:generate
   ```

### Langkah 2: Tambahkan Logic Login di Service (`src/services/users-service.ts`)
1. Buka file `src/services/users-service.ts`.
2. Import `sessions` dari `../db/schema`.
3. Buat interface `LoginUserInput`:
   ```ts
   export interface LoginUserInput {
     email: string;
     password: string;
   }
   ```
4. Buat fungsi `loginUser(input: LoginUserInput)`:
   - **Cari User**: Query tabel `users` berdasarkan email.
   - **Cek User**: Jika user tidak ditemukan, lempar error:
     ```ts
     throw new UserError("Email atau password salah", 400);
     ```
   - **Verifikasi Password**: Verifikasi kecocokan password menggunakan `Bun.password.verify`:
     ```ts
     const isPasswordValid = await Bun.password.verify(input.password, user.password);
     if (!isPasswordValid) {
       throw new UserError("Email atau password salah", 400);
     }
     ```
   - **Generate Token**: Buat UUID baru menggunakan fungsi bawaan `crypto.randomUUID()`:
     ```ts
     const token = crypto.randomUUID();
     ```
   - **Simpan Session**: Insert record ke tabel `sessions` dengan `token` dan `userId: user.id`.
   - **Return**: Kembalikan `{ token }`.

### Langkah 3: Tambahkan Endpoint di Route (`src/routes/users-route.ts`)
1. Buka file `src/routes/users-route.ts`.
2. Import fungsi `loginUser` dari `../services/users-service`.
3. Tambahkan handler route untuk login:
   - Endpoint: `/users/login` (atau `/login` jika route dimount di `/api/users`).
   - Validasi body:
     - `email`: string format email
     - `password`: string
   - Logika handler:
     - Panggil `loginUser(body)`.
     - Atur HTTP status `200`.
     - Return `{ data: result.token }`.
   - Tangani `UserError` agar mengembalikan status `400` dengan `{ error: err.message }`.

### Langkah 4: Pastikan Routing di `src/index.ts`
Pastikan path endpoint yang terbentuk tepat `/api/users/login`.
Contoh konfigurasi routing:
- Jika di `src/index.ts` route diatur dengan prefix `/api`, maka di `usersRoute` path-nya adalah `/users/login`.
- Uji URL lengkapnya: `http://localhost:3001/api/users/login`.

### Langkah 5: Pengujian & Validasi
1. Jalankan type checking:
   ```bash
   bun run typecheck
   ```
2. Buat pengujian otomatis di `test/login.test.ts`:
   - Validasi input (gagal jika body kosong).
   - Login gagal saat password atau email salah (status 400).
   - Login berhasil saat email dan password cocok (status 200, mengembalikan `{ data: "<token>" }`).
3. Jalankan test:
   ```bash
   bun test
   ```
4. Pengujian manual via `curl`:
   ```bash
   curl -X POST http://localhost:3001/api/users/login \
     -H "Content-Type: application/json" \
     -d '{"email": "surya@localhost", "password": "rahasia"}'
   ```
   *Ekspektasi Berhasil*: HTTP 200 dengan `{ "data": "<uuid-token>" }`.
   
   ```bash
   curl -X POST http://localhost:3001/api/users/login \
     -H "Content-Type: application/json" \
     -d '{"email": "surya@localhost", "password": "passwordsalah"}'
   ```
   *Ekspektasi Gagal*: HTTP 400 dengan `{ "error": "Email atau password salah" }`.

---

## 6. Kriteria Keberhasilan (Acceptance Criteria Checklist)
- [x] Tabel `sessions` terdefinisi di `src/db/schema.ts` dengan relasi FK ke tabel `users`.
- [x] File migrasi SQL baru berhasil dibuat via `bun run db:generate`.
- [x] Service `loginUser` di `src/services/users-service.ts` memverifikasi password dengan `Bun.password.verify` dan menghasilkan UUID token.
- [x] Route `POST /api/users/login` terimplementasi di `src/routes/users-route.ts`.
- [x] Response sukses mengembalikan format `{ "data": "<token>" }`.
- [x] Response gagal mengembalikan format `{ "error": "Email atau password salah" }` dengan status HTTP 400.
- [x] Lolos pengujian otomatis (`bun test`) dan type checking (`bun run typecheck`).
