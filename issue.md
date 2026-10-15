# Feature: Get Current User (Endpoint GET /api/users/current)

## 1. Ringkasan & Tujuan
Dokumen ini merupakan panduan spesifikasi dan tahapan implementasi (*implementation plan*) fitur untuk mengambil data profil user yang sedang login (*current user*) berdasarkan session token pada backend Bun + ElysiaJS + Drizzle ORM (MySQL).

Dokumen ini disusun secara terstruktur agar mudah diimplementasikan oleh **junior programmer** atau **model AI**.

---

## 2. Spesifikasi Database (Drizzle ORM)

### Verifikasi Skema: Tabel `sessions` & `users`
Pastikan skema pada `src/db/schema.ts` memiliki tabel `users` dan `sessions` dengan struktur berikut:

#### Tabel `users`:
- `id`: integer / serial (Primary Key)
- `name`: varchar(255) not null
- `email`: varchar(255) not null unique
- `password`: varchar(255) not null
- `created_at`: timestamp not null default current_timestamp

#### Tabel `sessions`:
- `id`: integer / serial (Primary Key)
- `token`: varchar(255) not null (UUID session token)
- `user_id`: integer not null (Foreign Key merujuk ke `users.id`)
- `created_at`: timestamp not null default current_timestamp

*(Catatan: Jika skema sudah terdefinisi dari fitur sebelumnya, pastikan relasi antar tabel telah sesuai).*

---

## 3. Spesifikasi API

### Endpoint Get Current User
- **URL**: `/api/users/current`
- **Method**: `GET`
- **Headers**:
  - `Authorization`: `Bearer <token>` *(atau `Bearer<token>`)*

### Request Body
*Tidak ada (kosong)*.

### Response

#### 1. Berhasil (Success - HTTP 200)
Mengembalikan data profil user yang sesuai dengan token sesi (kolom `password` **WAJIB** dihilangkan demi keamanan):
```json
{
  "data": {
    "id": 1,
    "name": "Surya",
    "email": "surya@localhost",
    "created_at": "2026-10-15T07:49:00.000Z"
  }
}
```

#### 2. Gagal: Tidak Terautentikasi / Token Tidak Valid (Error - HTTP 401)
Kondisi saat:
- Header `Authorization` tidak dikirimkan.
- Format `Authorization` tidak sesuai (bukan Bearer token).
- Token tidak ditemukan di tabel `sessions`.
- User pemilik token tidak ditemukan di tabel `users`.

Response body:
```json
{
  "error": "Unauthorized"
}
```

---

## 4. Struktur Arsitektur Folder & File

Pemisahan tanggung jawab (*separation of concerns*) mengikuti standar arsitektur proyek:

```text
src/
├── db/
│   ├── index.ts          # Client Drizzle & koneksi pool MySQL
│   └── schema.ts         # Skema tabel users & sessions
├── routes/
│   └── users-route.ts    # Definisi route ElysiaJS (GET /users/current)
├── services/
│   └── users-service.ts  # Logic bisnis: verifikasi token sesi & query data user
└── index.ts              # Entrypoint server Elysia (mount routing /api)
```

> **Catatan Konvensi Penamaan:**
> - Folder `src/routes/`: menggunakan format nama file `users-route.ts`
> - Folder `src/services/`: menggunakan format nama file `users-service.ts`

---

## 5. Tahapan Implementasi

Pelaksana (programmer / AI) harus mengerjakan fitur ini secara berurutan:

### Langkah 1: Buat Logic Get Current User di Service (`src/services/users-service.ts`)
1. Buka file `src/services/users-service.ts`.
2. Buat fungsi `getCurrentUser(token: string)`:
   - **Validasi Token**: Jika token kosong atau tidak diberikan, lempar error:
     ```ts
     throw new UserError("Unauthorized", 401);
     ```
   - **Cari Session**: Query tabel `sessions` berdasarkan `token`:
     ```ts
     const foundSession = await db
       .select()
       .from(sessions)
       .where(eq(sessions.token, token))
       .limit(1);
     ```
   - Jika sesi tidak ditemukan, lempar:
     ```ts
     throw new UserError("Unauthorized", 401);
     ```
   - **Cari User**: Query tabel `users` berdasarkan `userId` dari session:
     ```ts
     const foundUser = await db
       .select({
         id: users.id,
         name: users.name,
         email: users.email,
         created_at: users.createdAt,
       })
       .from(users)
       .where(eq(users.id, foundSession[0].userId))
       .limit(1);
     ```
   - Jika user tidak ditemukan, lempar `UserError("Unauthorized", 401)`.
   - **Kembalikan Data**: Return `{ user: foundUser[0] }`.

### Langkah 2: Tambahkan Route Handler di (`src/routes/users-route.ts`)
1. Buka file `src/routes/users-route.ts`.
2. Import fungsi `getCurrentUser` dari `../services/users-service`.
3. Tambahkan route `GET /users/current`:
   - Ambil header `authorization` dari request context (`headers.authorization`).
   - Ekstrak token dari string authorization:
     - Header biasanya berformat: `Bearer <token>` atau `Bearer<token>`.
     - Gunakan regex atau replace: `const token = authorization.replace(/^Bearer\s*/i, "").trim()`.
     - Jika header `authorization` tidak ada atau kosong, langsung kembalikan status `401` dengan `{ "error": "Unauthorized" }`.
   - Panggil `getCurrentUser(token)`.
   - Jika berhasil, kembalikan status `200` dengan:
     ```json
     {
       "data": {
         "id": user.id,
         "name": user.name,
         "email": user.email,
         "created_at": user.created_at
       }
     }
     ```
   - Jika terjadi `UserError` dengan status `401`, atur HTTP status `401` dan kembalikan `{ "error": "Unauthorized" }`.

### Langkah 3: Verifikasi Routing di `src/index.ts`
Pastikan route terhubung ke server utama sehingga endpoint dapat diakses melalui URL:
`http://localhost:3001/api/users/current`.

### Langkah 4: Pengujian & Validasi
1. Jalankan type checking:
   ```bash
   bun run typecheck
   ```
2. Buat automated test di `test/current-user.test.ts`:
   - **Test 1**: Request tanpa header `Authorization` mengembalikan HTTP `401` `{ "error": "Unauthorized" }`.
   - **Test 2**: Request dengan token yang tidak ada di database mengembalikan HTTP `401` `{ "error": "Unauthorized" }`.
   - **Test 3**: Request dengan token valid mengembalikan HTTP `200` dengan data user (dan tanpa field `password`).
3. Jalankan pengujian test suite:
   ```bash
   bun test
   ```
4. Pengujian manual via `curl`:
   - **Tanpa Token (Gagal)**:
     ```bash
     curl -i http://localhost:3001/api/users/current
     ```
     *Ekspektasi*: HTTP 401 Unauthorized dengan `{"error": "Unauthorized"}`.
   - **Dengan Token Valid (Berhasil)**:
     ```bash
     curl -i http://localhost:3001/api/users/current \
       -H "Authorization: Bearer <token-uuid>"
     ```
     *Ekspektasi*: HTTP 200 OK dengan `{"data": {"id": 1, "name": "Surya", "email": "surya@localhost", "created_at": "..."}}`.

---

## 6. Kriteria Keberhasilan (Acceptance Criteria Checklist)
- [x] Service `getCurrentUser` di `src/services/users-service.ts` memvalidasi token dari tabel `sessions` dan mengambil data user tanpa mengikutsertakan kolom `password`.
- [x] Route `GET /api/users/current` terimplementasi di `src/routes/users-route.ts`.
- [x] Parsing header `Authorization: Bearer <token>` berjalan dengan baik.
- [x] Mengembalikan response HTTP 401 `{ "error": "Unauthorized" }` jika token tidak valid atau tidak disertakan.
- [x] Mengembalikan response HTTP 200 `{ "data": { ... } }` jika autentikasi berhasil.
- [x] Lolos pengujian otomatis (`bun test`) dan type checking (`bun run typecheck`).
