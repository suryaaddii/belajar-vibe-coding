# Feature: User Logout (Endpoint DELETE /api/users/logout)

## 1. Ringkasan & Tujuan
Dokumen ini merupakan panduan spesifikasi dan tahapan implementasi (*implementation plan*) fitur logout user pada backend Bun + ElysiaJS + Drizzle ORM (MySQL). 

Ketika user melakukan logout, token session yang dikirimkan melalui header `Authorization` harus divalidasi dan dihapus secara permanen dari tabel `sessions` di database.

Dokumen ini disusun secara terstruktur agar mudah diimplementasikan oleh **junior programmer** atau **model AI**.

---

## 2. Spesifikasi Database (Drizzle ORM)

### Operasi pada Tabel `sessions`
Fitur ini menggunakan tabel `sessions` yang sudah ada pada `src/db/schema.ts`:
- **Tabel**: `sessions`
- **Operasi**: Menghapus baris record session berdasarkan kolom `token`.
- **Query Drizzle**:
  ```ts
  await db.delete(sessions).where(eq(sessions.token, token));
  ```

---

## 3. Spesifikasi API

### Endpoint Logout
- **URL**: `/api/users/logout`
- **Method**: `DELETE`
- **Headers**:
  - `Authorization`: `Bearer <token>` *(atau `Bearer<token>`)*

### Request Body
*Tidak ada (kosong)*.

### Response

#### 1. Berhasil (Success - HTTP 200)
Jika token valid dan session berhasil dihapus dari database:
```json
{
  "data": "OK"
}
```

#### 2. Gagal: Tidak Terautentikasi / Token Tidak Valid (Error - HTTP 401)
Kondisi saat:
- Header `Authorization` tidak dikirimkan.
- Format `Authorization` tidak sesuai (bukan Bearer token).
- Token tidak ditemukan di tabel `sessions`.

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
│   └── users-route.ts    # Definisi route ElysiaJS (tambahkan handler DELETE /users/logout)
├── services/
│   └── users-service.ts  # Logic bisnis: verifikasi keberadaan session & delete session
└── index.ts              # Entrypoint server Elysia (mount routing /api)
```

> **Catatan Konvensi Penamaan:**
> - Folder `src/routes/`: menggunakan format nama file `users-route.ts`
> - Folder `src/services/`: menggunakan format nama file `users-service.ts`

---

## 5. Tahapan Implementasi

Pelaksana (programmer / AI) harus mengerjakan fitur ini secara berurutan:

### Langkah 1: Buat Logic Logout di Service (`src/services/users-service.ts`)
1. Buka file `src/services/users-service.ts`.
2. Buat fungsi `logoutUser(token: string)`:
   - **Validasi Token**: Jika token kosong, tidak berupa string, atau string kosong setelah di-trim, lempar error:
     ```ts
     throw new UserError("Unauthorized", 401);
     ```
   - **Cari Session**: Query tabel `sessions` untuk memastikan token ada di database:
     ```ts
     const foundSession = await db
       .select({ id: sessions.id })
       .from(sessions)
       .where(eq(sessions.token, token.trim()))
       .limit(1);
     ```
   - Jika session tidak ditemukan, lempar:
     ```ts
     throw new UserError("Unauthorized", 401);
     ```
   - **Hapus Session**: Jalankan operasi delete pada tabel `sessions`:
     ```ts
     await db.delete(sessions).where(eq(sessions.token, token.trim()));
     ```
   - Kembalikan status sukses `{ success: true }`.

### Langkah 2: Tambahkan Route Handler di (`src/routes/users-route.ts`)
1. Buka file `src/routes/users-route.ts`.
2. Import fungsi `logoutUser` dari `../services/users-service`.
3. Tambahkan handler route untuk `DELETE /users/logout`:
   - Ambil header `authorization` dari request context (`headers["authorization"] || headers["Authorization"]`).
   - Ekstrak token dari header:
     - Gunakan regex: `authHeader.match(/^Bearer\s*(.+)$/i)`.
     - Jika header tidak ada atau format tidak valid, kembalikan HTTP `401` dengan body:
       ```json
       {
         "error": "Unauthorized"
       }
       ```
   - Panggil `await logoutUser(token)`.
   - Atur HTTP status `200` dan kembalikan body:
     ```json
     {
       "data": "OK"
     }
     ```
   - Tangkap `UserError` dengan status `401` dan kembalikan `{ "error": "Unauthorized" }`.

### Langkah 3: Verifikasi Routing di `src/index.ts`
Pastikan route terhubung ke server utama sehingga endpoint dapat diakses melalui URL:
`DELETE http://localhost:3001/api/users/logout`.

### Langkah 4: Pengujian & Validasi
1. Jalankan type checking:
   ```bash
   bun run typecheck
   ```
2. Buat automated test di `test/logout.test.ts`:
   - **Test 1**: Request tanpa header `Authorization` mengembalikan HTTP `401` `{ "error": "Unauthorized" }`.
   - **Test 2**: Request dengan format header bukan Bearer mengembalikan HTTP `401` `{ "error": "Unauthorized" }`.
   - **Test 3**: Request dengan token yang tidak terdaftar di database mengembalikan HTTP `401` `{ "error": "Unauthorized" }`.
   - **Test 4**: Request dengan token valid mengembalikan HTTP `200` `{ "data": "OK" }` dan memicu penghapusan session.
3. Jalankan pengujian test suite:
   ```bash
   bun test
   ```
4. Pengujian manual via `curl`:
   - **Logout Berhasil**:
     ```bash
     curl -i -X DELETE http://localhost:3001/api/users/logout \
       -H "Authorization: Bearer <valid-token-uuid>"
     ```
     *Ekspektasi*: HTTP 200 OK dengan `{"data": "OK"}`.
   - **Logout Ulang dengan Token yang Sama (Harus Gagal karena sudah terhapus)**:
     ```bash
     curl -i -X DELETE http://localhost:3001/api/users/logout \
       -H "Authorization: Bearer <valid-token-uuid>"
     ```
     *Ekspektasi*: HTTP 401 Unauthorized dengan `{"error": "Unauthorized"}`.

---

## 6. Kriteria Keberhasilan (Acceptance Criteria Checklist)
- [x] Service `logoutUser` di `src/services/users-service.ts` memverifikasi token dan menghapus session dari tabel `sessions`.
- [x] Route `DELETE /api/users/logout` terimplementasi di `src/routes/users-route.ts`.
- [x] Parsing header `Authorization: Bearer <token>` berjalan dengan baik dan mendukung format variasi spasi.
- [x] Mengembalikan response HTTP 401 `{ "error": "Unauthorized" }` jika token tidak disertakan atau tidak valid.
- [x] Mengembalikan response HTTP 200 `{ "data": "OK" }` jika logout berhasil.
- [x] Data token sesi benar-benar terhapus dari database setelah logout.
- [x] Lolos pengujian otomatis (`bun test`) dan type checking (`bun run typecheck`).
