# Panduan Testing API Yoonjaespace (Step-by-Step)

Panduan ini dirancang khusus agar Anda tidak bingung. Kita akan melakukan **Skenario Testing Lengkap** dari awal sampai akhir.

## Persiapan

1.  **Pastikan Server Jalan**: `npm run dev` di terminal.
2.  **Import Collection**: Import file `yoonjaespace_api_collection.json` ke Postman.
3.  **Environment**: Pastikan `baseUrl` di Postman adalah `http://localhost:3000/api`.

---

## Skenario 1: Membuat Booking Baru (Flow Utama)

Kita akan membuat booking untuk klien, dari nol sampai jadi invoice.

### Langkah 1: Login (Wajib)

Semua request butuh login. Lakukan ini sekali saja saat buka Postman.

1.  Buka **Auth** -> **Login (Owner)**.
2.  Klik **Send**.
3.  **Ekspektasi Output**: Status `200 OK`.
    ```json
    { "user": { "id": "...", "email": "owner@..." } }
    ```

### Langkah 2: Lihat Daftar Paket (Opsional tapi Penting)

Sebelum booking, kita butuh `packageId` yang valid.

1.  Buka **7. Master Data** -> **Packages** -> **List Packages**.
2.  Atau, gunakan **ID Paket Nyata** yang sudah saya ambilkan dari database:
    - **Pas Photo Session (150rb)**: `"cmlnbkw8400052prpiyicrget"`
    - **Studio Only (200rb)**: `"cmlnbkw8400062prpo6ceywqt"`

### Langkah 3: Create Booking (Ini yang Tadi Error)

Disini kita akan input data booking lengkap.

1.  Buka **4. Bookings** -> **Create Booking**.
2.  Buka tab **Body** dan pilih **raw (JSON)**.
3.  **Paste JSON Berikut** (Saya sudah perbaiki, tambah `endTime` dan pakai `packageId` asli):

    ```json
    {
      "clientName": "Test Client",
      "clientPhone": "08123456789",
      "clientEmail": "test@example.com",
      "date": "2026-02-20",
      "startTime": "2026-02-20T10:00:00",
      "endTime": "2026-02-20T11:00:00",
      "packageId": "cmlnbkw8400052prpiyicrget",
      "totalAmount": 150000,
      "dpAmount": 50000,
      "notes": "Testing via Postman"
    }
    ```

    _Catatan: Format waktu `startTime` dan `endTime` sebaiknya ISO string lengkap, atau minimal `YYYY-MM-DDTHH:mm:ss` agar aman._

4.  Klik **Send**.
5.  **Ekspektasi Output**: Status `201 Created`. JSON berisi data booking yang baru dibuat.
    - **PENTING**: Copy `id` dari response ini! (Misal: `"id": "cm1..."`).
    - **PENTING**: Copy juga `publicSlug` dari response ini! (Misal: `"zQzK9A8_"`). Ini dipakai untuk cek status publik.

### Langkah 4: Cek Booking Tadi

1.  Buka **4. Bookings** -> **Get Booking Detail**.
2.  Ganti `:id` di URL dengan ID Booking yang barusan Anda copy.
3.  Klik **Send**.
4.  **Ekspektasi Output**: Data lengkap booking beserta client dan status pembayaran.

### Langkah 5: Buat Invoice

1.  Buka **5. Invoices** -> **Generate Invoice**.
2.  Ganti `:bookingId` di URL dengan ID Booking tadi.
3.  Klik **Send**.
4.  **Ekspektasi Output**: Status `201 Created`. Invoice Number akan muncul (misal: `"invoiceNumber": "INV-20260215-001"`).

---

## Skenario 2: Masalah Keuangan (Finance)

### Langkah 1: Catat Pengeluaran

1.  Buka **6. Finance** -> **Create Expense**.
2.  Paste Body JSON ini:
    ```json
    {
      "description": "Beli Token Listrik",
      "amount": 50000,
      "category": "OPERATIONAL",
      "date": "2026-02-20"
    }
    ```
3.  Klik **Send**.

### Langkah 2: Cek Laporan Bulanan

1.  Buka **6. Finance** -> **Get Summary**.
2.  Pastikan parameter `month` diisi (misal `2026-02`).
3.  Klik **Send**.
4.  **Ekspektasi Output**: Data `income` (pemasukan), `expense` (pengeluaran), dan `grossProfit` (laba kotor).

---

## Skenario 3: Cek Status Publik (Tanpa Login)

Skenario ini mensimulasikan klien yang mengecek status pesanan mereka via link publik.

1.  **Logout Dulu** (Opsional): Buka **Auth** -> **Logout** -> Send. (Ini untuk membuktikan link ini bisa diakses tanpa login).
2.  Buka folder **11. Public Status** -> **Check Status (Public)**.
3.  Ganti `:slug` di URL dengan **publicSlug** yang Anda dapatkan di **Skenario 1 - Langkah 3 (Create Booking)**.
    - _Contoh Slug_: `"zQzK9A8_"` (ini contoh dari database, tapi sebaiknya pakai yang baru Anda buat).
4.  Klik **Send**.
5.  **Ekspektasi Output**: Status `200 OK`. JSON berisi info terbatas (Nama Client, Tanggal, Status) tanpa data sensitif.

---

## Daftar Lengkap Folder API (Reference)

Berikut struktur folder di Postman Collection terbaru:

1.  **Auth** (Login, Logout, Me)
2.  **Users** (Staff CRUD)
3.  **Clients** (Customer CRUD) - _BARU_
4.  **Bookings** (Create, List, Update, Quick Status, Print, Delete)
5.  **Invoices** (Generate, View)
6.  **Finance** (Expense CRUD, Summary, Export)
7.  **Master Data** - _BARU_
    - **Packages** (CRUD Paket Foto)
    - **Backgrounds** (CRUD Opsi Background)
    - **Add-ons** (CRUD Template Tambahan)
    - **Vouchers** (CRUD & Validate Kode Diskon)
8.  **Settings & Tools** - _BARU_
    - **Settings** (Edit Jam Operasional, Nama Studio)
    - **Custom Fields** (Edit Input Tambahan)
    - **Reminders** (Generate link WA)
9.  **Commissions** (List & Manual Entry) - _BARU_
10. **Dashboard** (Stats)
11. **Public Status** (Cek Status Booking)
