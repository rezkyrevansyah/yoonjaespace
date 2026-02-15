# YOONJAESPACE — Studio Management Web App

## Complete Project Documentation

---

# 1. PROJECT OVERVIEW

## 1.1 Tentang Client

**Yoonjaespace** adalah studio foto yang berlokasi di Indonesia. Studio ini melayani berbagai jenis sesi foto seperti birthday, graduation, family, group, LinkedIn profile, pas foto, dan studio only.

- **Instagram:** https://www.instagram.com/yoonjaespace
- **Jam Operasional:** 08:00 - 20:00 setiap hari
- **Hari Libur:** Selasa (kecuali jika Selasa adalah hari libur nasional, maka libur dipindahkan)
- **Logo:** File `logo_yoonjae.jpg` — bintang 4 sudut berwarna putih dengan background merah maroon metallic

## 1.2 Tujuan

Membuat internal web app untuk merapikan workflow studio:
**Booking → Sesi Foto → Kirim Foto (same day) → (opsional) Cetak Canvas → Kirim ke Client**

Fokus utama:

- Tracking order & status
- Follow-up canvas & pengiriman
- Operasional harian lebih rapi
- Menyatukan 3 link Notion yang terpisah (Calendar, Input Form, Reminder) ke dalam 1 dashboard

## 1.3 Kondisi Saat Ini (Before)

- Booking via WA → Admin kasih WA form → Admin input manual ke Notion → Info manual ke customer
- Menggunakan 3 link Notion terpisah:
  1. **Calendar** — melihat jadwal studio berdasarkan booking
  2. **Input Form** — memasukkan data customer, juga bisa generate invoice
  3. **Reminder** — meremind customer via wa.me link dengan auto text
- Sistem bonus/komisi staff dihitung manual (filter per bulan di Notion)
- Pernah pakai apps Zenwell dari Olsera yang ada sistem komisi

---

# 2. ARSITEKTUR SISTEM

## 2.1 Dua Web Terpisah

### Web A — Management Dashboard (Internal)

- Diakses oleh: Owner, Admin, Photographer/Staff, Packaging Staff
- **Login required** (Supabase Auth)
- Semua operasional ada di sini

### Web B — Halaman Status Client (Publik)

- **Tidak ada login**
- Setiap order punya **unique link** (misal `domain.com/status/XxY7kQ`)
- Satu link = satu order = satu client
- Sangat ringan — setiap request hanya query 1 data
- Bisa handle ribuan customer tanpa masalah

## 2.2 Tech Stack

| Layer        | Teknologi                         | Biaya  |
| ------------ | --------------------------------- | ------ |
| Framework    | Next.js 14+ (App Router)          | Gratis |
| Language     | TypeScript                        | Gratis |
| Database     | Supabase (PostgreSQL)             | Gratis |
| ORM          | Prisma 5                          | Gratis |
| Auth         | Supabase Auth                     | Gratis |
| UI           | shadcn/ui + Tailwind CSS          | Gratis |
| Calendar     | react-big-calendar / FullCalendar | Gratis |
| PDF          | @react-pdf/renderer               | Gratis |
| Excel Export | SheetJS (xlsx)                    | Gratis |
| Forms        | react-hook-form + zod             | Gratis |
| Date         | date-fns                          | Gratis |
| Icons        | lucide-react                      | Gratis |
| Deploy       | Vercel                            | Gratis |

## 2.3 Design Direction

- **Base color:** Putih
- **Aksen color:** Merah maroon/deep red dari logo Yoonjaespace
- **Vibes:** Clean, estetik, studio foto premium
- **Typography:** Modern, spacing lega
- **Feel:** Professional tapi warm

---

# 3. USER ROLES & ACCESS

## 3.1 Owner

Semua yang Admin bisa, plus:

- **Finance** (income, expense, monthly summary, export Excel)
- **Komisi Staff** (lihat per bulan siapa handle berapa booking, set nominal komisi)
- **User Management** (tambah/edit/hapus staff, assign role)
- **Settings** (package management, add-on templates, background options, jam operasional, hari libur, voucher management)
- **Reports/Analytics** (jumlah booking per bulan, revenue trend, paket terpopuler)
- **Delete booking** (hanya Owner)

## 3.2 Admin

- **Bookings** (create, edit, update status, cancel)
- **Calendar** (lihat jadwal harian/mingguan/bulanan)
- **Reminders** (lihat siapa perlu di-remind, tombol WA)
- **Client Database** (lihat data & history customer)
- **Invoice** (generate PDF per order, download, share)
- **Today's Overview** di halaman utama

## 3.3 Photographer/Staff

- **Today's Schedule** (jadwal hari ini dengan detail lengkap per sesi)
- **Order Detail** (view only, tidak bisa edit)

## 3.4 Packaging/Delivery Staff

- Hanya lihat order yang ada di **fase print/shipping** (Waiting Client Selection sampai Completed)
- Action terbatas

## 3.5 Customer (Publik, tanpa login)

- Halaman status order via unique link
- Status timeline, detail booking, info studio, social media links
- Branding Yoonjaespace

---

# 4. COMPLETE USER FLOW

## FASE 1 — Inquiry & Booking

**Apa yang terjadi:** Customer chat via WA → Admin jawab → Deal → Admin buka dashboard

**Admin ada di:** `Dashboard > Bookings > + New Booking`

**Yang admin isi:**

- Nama client, nomor WA, email (opsional)
- Tanggal & jam sesi
- Package (pilih dari daftar dinamis)
- Add-ons (MUA, extra person, extra duration, print/canvas)
- Background (Limbo, Spotlight, Mid-Century, Chrome, dll — bisa pilih lebih dari 1)
- Photo for (graduation, birthday, group, dll)
- Jumlah orang
- Notes dari customer
- BTS (yes/no)
- Custom fields (yang bisa di-setup admin)
- Voucher/discount (opsional)
- "Handled by" otomatis terisi nama admin yang login

**Setelah save:**

- Auto generate Booking ID (misal `YJ-20260215-001`)
- Status otomatis: **BOOKED**
- Auto generate unique link status untuk customer
- Admin copy link → kirim ke customer via WA
- Booking muncul di Calendar

**Customer buka link status:** Lihat logo, nama mereka, Booking ID, status timeline (step "Booked"), detail sesi, info studio, social icons

## FASE 2 — Payment

**Apa yang terjadi:** Customer transfer via bank → Konfirmasi ke admin via WA

**Admin ada di:** `Dashboard > Bookings > [klik order] > Update Status`

**Action:** Update payment: Unpaid → **PAID**

**Customer lihat:** Timeline bergerak ke **"Paid"**

## FASE 3 — Reminder (H-1 atau H-hari)

**Admin ada di:** `Dashboard > Reminders`

**Yang admin lihat:** Tabel berisi nama client, jam sesi, package, status, dan **tombol WA** yang klik langsung buka `wa.me/62xxxx?text=Halo [Nama], ini reminder...` — auto-generated text

## FASE 4 — Hari H: Sesi Foto

**Photographer/Staff ada di:** `Dashboard > Today's Schedule`

**Yang staff lihat:** Detail per sesi — nama client, jam, package, durasi, jumlah orang, background, photo for, add-ons, notes, BTS, custom fields

**Admin bisa:** Tambah add-on dadakan (fleksibel, kapan saja)

**Setelah selesai:** Admin update status → **SHOOT_DONE**

## FASE 5 — Kirim Foto (Same Day)

**Admin ada di:** `Dashboard > Bookings > [klik order] > Delivery`

**Action:** Input link Google Drive → Update status → **PHOTOS_DELIVERED**

**Customer lihat:** Timeline di **"Photos Delivered"** (link dikirim via WA, bukan di halaman publik)

## FASE 6A — Tanpa Print → Selesai

**Admin update:** → **CLOSED**

**Customer lihat:** Timeline lengkap. "Thank you!" + social icons + "Book Again" CTA

## FASE 6B — Dengan Print/Canvas

1. **WAITING_CLIENT_SELECTION** — Customer pilih foto mana
2. **SENT_TO_VENDOR** — Admin kirim ke vendor cetak
3. **PRINTING_IN_PROGRESS** (opsional) — Sedang dicetak
4. **PRINT_RECEIVED** — Cetakan sampai di studio
5. **PACKAGING** — Tim packaging
6. **SHIPPED** — Admin input nomor resi, kurir
7. **COMPLETED** — Customer terima, booking → CLOSED

## FASE 7 — Cancel / Reschedule

**Cancel:** Admin klik Cancel Order → Status: **CANCELLED** (tidak dihapus, untuk record)
**Reschedule:** Admin edit tanggal/jam di detail order
**Delete:** Hanya Owner, dengan konfirmasi ganda

---

# 5. FEATURES DETAIL

## 5.1 Payment

- No DP, full payment via transfer
- No payment gateway
- Status: Paid / Unpaid
- Default payment status bisa di-set di Settings (toggle)

## 5.2 Booking/Order

- Create & edit order
- Auto Booking ID (format: YJ-YYYYMMDD-XXX)
- Schedule (date & time)
- Package (dinamis, bisa CRUD)
- Add-ons fleksibel: bisa ditambah after booking, during session, after session
- Add-on item-based: item name, qty, unit price, subtotal, auto total calculation
- Discount/voucher
- Notes (customer notes + internal notes)
- Status tracking visual
- Cancel & reschedule
- "Handled by" tracking (untuk komisi)

## 5.3 Packages (Dinamis)

Owner/Admin bisa CRUD kapan saja:

- Birthday Smash Cake Session
- Graduation Session
- Family Session
- Group Session
- LinkedIn Profile Session
- Pas Photo Session
- Studio Only
- (bisa tambah lagi)

Setiap package punya: nama, deskripsi, harga, durasi (menit), max orang, isActive

## 5.4 Backgrounds (Dinamis)

- Limbo, Spotlight, Mid-Century, Chrome (bisa tambah lagi)
- Satu booking bisa pilih lebih dari 1 background

## 5.5 Client Database

- Nama, phone (WA), email, alamat pengiriman
- Booking history lengkap
- Summary: total bookings, total spent, last visit

## 5.6 Delivery & Print

- Photo delivery link (Google Drive, input manual)
- Print order terpisah dengan status sendiri
- Selected photo link/notes
- Print vendor (opsional)
- Shipping: alamat, kurir, nomor resi

## 5.7 Invoice

- Generate PDF per order
- Itemized: package + add-ons – discount = total
- Desain estetik dengan logo Yoonjaespace dan aksen merah
- Download / print / share link
- Invoice number format: INV-YYYYMMDD-XXX

## 5.8 Dashboard

- **Today's schedule** (jadwal hari ini)
- **Action items:** Waiting Client Selection, Sent to Vendor, Need Packaging, Need Shipping
- **Monthly stats:** Total bookings, revenue, unpaid bookings
- **Search order** (by nama, WA, booking ID)

## 5.9 Calendar

- View: harian, mingguan, bulanan
- Setiap card menampilkan: nama client, package, durasi, jumlah orang, background, photo for, add-ons, notes, BTS
- Mirip tampilan Notion calendar tapi lebih clean

## 5.10 Finance (Owner only)

- **Income:** Otomatis dari booking yang paid
- **Expense:** Manual input — kategori: print vendor, packaging, shipping, operational, other. Opsional link ke booking
- **Summary:** Monthly income, monthly expense, gross profit, expense breakdown per kategori
- **Export ke Excel** — ini sangat diminta client

## 5.11 Komisi/Bonus Staff

- Setiap booking tercatat "Handled by" siapa
- Owner bisa lihat per bulan: siapa handle berapa booking
- Owner set nominal komisi per staff per bulan
- Menggantikan cara lama yang harus filter manual di Notion

## 5.12 Voucher/Discount

- Owner/Admin bisa CRUD voucher
- Kode unik, tipe diskon (fixed/percentage)
- Min purchase, max usage, validity period
- Validasi saat booking

## 5.13 Reminder System

- Menampilkan booking hari ini & besok yang perlu di-remind
- Tombol WA dengan auto-generated text
- Format: `wa.me/[nomor]?text=[pesan otomatis]`
- Persis seperti sistem wa.me yang sudah dipakai, tapi terintegrasi

## 5.14 Custom Notes/Fields

- Admin bisa customize pertanyaan/field tambahan untuk staff
- Contoh: "Tema Warna", "Request Pose", dll
- Field type: text, select, boolean
- Muncul di form booking dan detail sesi staff

## 5.15 Halaman Status Client (Publik)

- Unique link per order (format: `domain.com/status/[slug]`)
- Tampilan: logo Yoonjaespace, nama client, Booking ID, status timeline visual
- Detail: tanggal, jam, paket, info studio
- Social media icons (Instagram dll)
- "Book Again" CTA (link ke WA studio)
- Pesan branding: "We're excited to see you!" / "Thank you for choosing Yoonjaespace!"
- Jika ada print: tracking status pengiriman (kurir, nomor resi)
- **Bukan cuma status** — juga touchpoint branding

## 5.16 User Management (Owner only)

- Tambah/edit/hapus user
- Assign role (Owner, Admin, Photographer, Packaging Staff)
- Activate/deactivate user
- Reset password

## 5.17 Settings (Owner/Admin)

- Studio name, address, phone, Instagram
- Jam operasional (open/close)
- Hari libur (default: Selasa)
- Default payment status (paid/unpaid)
- Package management (CRUD)
- Background management (CRUD)
- Add-on template management (CRUD)
- Custom field management (CRUD)

---

# 6. DATABASE SCHEMA (Prisma)

## Tables Overview (17 tables)

1. **users** — Staff studio (Owner, Admin, Photographer, Packaging Staff)
2. **clients** — Data customer (nama, phone, email, alamat)
3. **packages** — Paket foto (dinamis, CRUD)
4. **backgrounds** — Opsi background (dinamis)
5. **bookings** — Order utama (tabel paling penting)
6. **booking_backgrounds** — Many-to-many booking ↔ background
7. **addon_templates** — Template add-on (MUA, Extra Person, dll)
8. **booking_addons** — Add-on aktual per booking
9. **print_orders** — Tracking cetak/canvas
10. **invoices** — Data invoice per booking
11. **custom_field_definitions** — Field custom yang bisa ditambah admin
12. **booking_custom_fields** — Nilai field custom per booking
13. **expenses** — Input manual expense
14. **commissions** — Komisi staff per bulan
15. **vouchers** — Management voucher/diskon
16. **studio_settings** — Key-value settings

## Key Relationships

- Booking → Client (many-to-one)
- Booking → Package (many-to-one)
- Booking → User/HandledBy (many-to-one)
- Booking ↔ Background (many-to-many via booking_backgrounds)
- Booking → BookingAddOn (one-to-many)
- Booking → PrintOrder (one-to-one, optional)
- Booking → Invoice (one-to-one, optional)
- Booking → BookingCustomField (one-to-many)
- Booking → Expense (one-to-many, optional link)
- User → Commission (one-to-many)

## Enums

- **Role:** OWNER, ADMIN, PHOTOGRAPHER, PACKAGING_STAFF
- **BookingStatus:** BOOKED, PAID, SHOOT_DONE, PHOTOS_DELIVERED, CLOSED, CANCELLED
- **PaymentStatus:** UNPAID, PAID
- **PhotoFor:** BIRTHDAY, GRADUATION, FAMILY, GROUP, LINKEDIN, PAS_PHOTO, STUDIO_ONLY, OTHER
- **PrintStatus:** WAITING_CLIENT_SELECTION, SENT_TO_VENDOR, PRINTING_IN_PROGRESS, PRINT_RECEIVED, PACKAGING, SHIPPED, COMPLETED
- **ExpenseCategory:** PRINT_VENDOR, PACKAGING, SHIPPING, OPERATIONAL, OTHER

## Important Design Decisions

- **Price Snapshot:** `packagePrice` di booking menyimpan harga saat booking dibuat, jadi kalau harga paket berubah, order lama tidak terpengaruh
- **publicSlug:** Short unique code untuk URL status client
- **bookingCode:** Human-readable ID (YJ-YYYYMMDD-XXX)
- **Soft delete:** Packages, backgrounds, add-on templates, custom fields pakai `isActive` flag (tidak benar-benar dihapus karena booking lama masih reference)
- **User ID:** UUID dari Supabase Auth (bukan auto-generate), tanpa field password (dikelola Supabase Auth)

---

# 7. API ROUTES (40 Endpoints)

## Auth

| Method | Endpoint           | Fungsi                  | Auth |
| ------ | ------------------ | ----------------------- | ---- |
| POST   | `/api/auth/login`  | Login                   | No   |
| POST   | `/api/auth/logout` | Logout                  | Yes  |
| GET    | `/api/auth/me`     | Get current user + role | Yes  |

## Users (Owner only)

| Method | Endpoint          | Fungsi                                       |
| ------ | ----------------- | -------------------------------------------- |
| GET    | `/api/users`      | List all users                               |
| POST   | `/api/users`      | Create user (Supabase Auth + DB)             |
| GET    | `/api/users/[id]` | Get user detail                              |
| PATCH  | `/api/users/[id]` | Update user (name, role, isActive, password) |
| DELETE | `/api/users/[id]` | Delete user                                  |

## Bookings (Owner/Admin)

| Method | Endpoint                    | Fungsi                                                       |
| ------ | --------------------------- | ------------------------------------------------------------ |
| GET    | `/api/bookings`             | List with filters (status, date, month, search) + pagination |
| POST   | `/api/bookings`             | Create booking (auto client create if new)                   |
| GET    | `/api/bookings/[id]`        | Detail booking with all relations                            |
| PATCH  | `/api/bookings/[id]`        | Edit booking (recalculate totals)                            |
| DELETE | `/api/bookings/[id]`        | Delete (Owner only)                                          |
| PATCH  | `/api/bookings/[id]/status` | Update status & payment                                      |
| POST   | `/api/bookings/[id]/print`  | Create print order                                           |
| PATCH  | `/api/bookings/[id]/print`  | Update print order status                                    |

## Clients

| Method | Endpoint            | Fungsi                                        |
| ------ | ------------------- | --------------------------------------------- |
| GET    | `/api/clients`      | List with search + pagination + booking count |
| POST   | `/api/clients`      | Create client                                 |
| GET    | `/api/clients/[id]` | Detail + booking history + summary            |
| PATCH  | `/api/clients/[id]` | Update client                                 |
| DELETE | `/api/clients/[id]` | Delete (Owner only, no bookings)              |

## Packages (Owner/Admin)

| Method | Endpoint             | Fungsi               |
| ------ | -------------------- | -------------------- |
| GET    | `/api/packages`      | List (filter active) |
| POST   | `/api/packages`      | Create               |
| PATCH  | `/api/packages/[id]` | Update               |
| DELETE | `/api/packages/[id]` | Soft delete          |

## Backgrounds (Owner/Admin)

| Method | Endpoint                | Fungsi      |
| ------ | ----------------------- | ----------- |
| GET    | `/api/backgrounds`      | List        |
| POST   | `/api/backgrounds`      | Create      |
| PATCH  | `/api/backgrounds/[id]` | Update      |
| DELETE | `/api/backgrounds/[id]` | Soft delete |

## Add-on Templates (Owner/Admin)

| Method | Endpoint                    | Fungsi      |
| ------ | --------------------------- | ----------- |
| GET    | `/api/addon-templates`      | List        |
| POST   | `/api/addon-templates`      | Create      |
| PATCH  | `/api/addon-templates/[id]` | Update      |
| DELETE | `/api/addon-templates/[id]` | Soft delete |

## Vouchers (Owner/Admin)

| Method | Endpoint                 | Fungsi                             |
| ------ | ------------------------ | ---------------------------------- |
| GET    | `/api/vouchers`          | List                               |
| POST   | `/api/vouchers`          | Create                             |
| PATCH  | `/api/vouchers/[id]`     | Update                             |
| DELETE | `/api/vouchers/[id]`     | Delete                             |
| POST   | `/api/vouchers/validate` | Validate code + calculate discount |

## Finance (Owner)

| Method | Endpoint                     | Fungsi                                    |
| ------ | ---------------------------- | ----------------------------------------- |
| GET    | `/api/finance/expenses`      | List expenses (filter month, category)    |
| POST   | `/api/finance/expenses`      | Create expense                            |
| PATCH  | `/api/finance/expenses/[id]` | Update expense                            |
| DELETE | `/api/finance/expenses/[id]` | Delete expense                            |
| GET    | `/api/finance/summary`       | Monthly summary (income, expense, profit) |
| GET    | `/api/finance/export`        | Export data for Excel                     |

## Invoice

| Method | Endpoint                    | Fungsi                         |
| ------ | --------------------------- | ------------------------------ |
| POST   | `/api/invoices/[bookingId]` | Generate invoice               |
| GET    | `/api/invoices/[bookingId]` | Get invoice data + studio info |

## Commission (Owner)

| Method | Endpoint           | Fungsi                                  |
| ------ | ------------------ | --------------------------------------- |
| GET    | `/api/commissions` | List staff + booking count + commission |
| POST   | `/api/commissions` | Set/update commission amount            |

## Settings

| Method | Endpoint        | Fungsi               |
| ------ | --------------- | -------------------- |
| GET    | `/api/settings` | Get all settings     |
| PATCH  | `/api/settings` | Bulk update settings |

## Custom Fields (Owner/Admin)

| Method | Endpoint                  | Fungsi             |
| ------ | ------------------------- | ------------------ |
| GET    | `/api/custom-fields`      | List active fields |
| POST   | `/api/custom-fields`      | Create field       |
| PATCH  | `/api/custom-fields/[id]` | Update field       |
| DELETE | `/api/custom-fields/[id]` | Soft delete field  |

## Dashboard

| Method | Endpoint         | Fungsi                                      |
| ------ | ---------------- | ------------------------------------------- |
| GET    | `/api/dashboard` | Today schedule, action items, monthly stats |

## Reminders

| Method | Endpoint         | Fungsi                                    |
| ------ | ---------------- | ----------------------------------------- |
| GET    | `/api/reminders` | Bookings needing reminder + auto WA links |

## Public Status (NO AUTH)

| Method | Endpoint             | Fungsi                            |
| ------ | -------------------- | --------------------------------- |
| GET    | `/api/status/[slug]` | Public order status + studio info |

---

# 8. FRONTEND PAGES & COMPONENTS

## 8.1 Public Pages (No Auth)

### `/login`

- Email + password form
- Logo Yoonjaespace
- Clean, centered layout
- Redirect ke dashboard setelah login

### `/status/[slug]`

- Halaman status client publik
- Header: Logo + Studio name
- Client name + Booking Code
- **Status Timeline Visual** (stepper horizontal/vertikal):
  - Booked → Paid → Shoot Done → Photos Delivered → Closed
  - Jika ada print: + Waiting Selection → Sent to Vendor → ... → Completed
- Detail booking (tanggal, jam, paket)
- Info studio (alamat, jam operasional)
- Social media icons (Instagram)
- Footer: "Thank you for choosing Yoonjaespace!" / "Book Again" button
- **Design:** Mirip contoh Otter receipt tapi dengan branding Yoonjaespace

## 8.2 Dashboard Pages (Auth Required)

### `/dashboard` — Home

**Semua role** melihat halaman ini, tapi konten berbeda per role:

**Owner/Admin sees:**

- Welcome message + nama user
- **Today's Schedule** — card/list per sesi hari ini
- **Action Items** — kartu: Waiting Client Selection (count), Sent to Vendor (count), Need Packaging (count), Need Shipping (count)
- **Monthly Stats** — Total bookings, Revenue, Unpaid bookings
- **Quick Actions** — tombol: + New Booking, Search Order

**Photographer sees:**

- **Today's Schedule only** — tampilan detail per sesi (mirip Notion calendar view yang di-attach client):
  - Waktu, Nama client, Package, Duration, Number of people, Background, Photo for, Add-ons, Notes, BTS, Custom fields

**Packaging Staff sees:**

- **Shipping Tasks** — hanya order di fase print/shipping

### `/dashboard/bookings` — Booking Management

- **Tabel** dengan kolom: Booking ID, Client, Date, Package, Status, Payment, Handled By
- **Filters:** Status, date range, search (nama/WA/ID)
- **Pagination**
- **+ New Booking** button
- Klik row → detail booking

### `/dashboard/bookings/new` — Create Booking

- **Form lengkap:**
  - Client: autocomplete existing / create new (nama, WA, email)
  - Date & Time picker
  - Package: dropdown dari daftar aktif
  - Number of people
  - Photo for: dropdown enum
  - BTS: toggle
  - Backgrounds: multi-select chips
  - Add-ons: dynamic list (tambah item, qty, harga)
  - Voucher: input kode + tombol validate
  - Discount: nominal + catatan
  - Notes (customer) + Internal Notes
  - Custom Fields (dynamic dari settings)
- **Sidebar/footer:** Live price calculation (package + add-ons - discount = total)
- **Submit:** Create booking → redirect ke detail

### `/dashboard/bookings/[id]` — Booking Detail

- **Header:** Booking Code, Status badge, Payment badge
- **Client Info:** nama, WA (clickable), email
- **Schedule:** tanggal, jam mulai-selesai, durasi
- **Package & Details:** paket, jumlah orang, photo for, BTS, backgrounds
- **Add-ons:** tabel (item, qty, harga, subtotal)
- **Pricing:** Package price, add-ons total, discount, **TOTAL**
- **Custom Fields:** list
- **Notes:** customer notes + internal notes
- **Status Actions:**
  - Tombol update status (contextual: next logical status)
  - Payment toggle (Unpaid ↔ Paid)
  - Input photo link (Google Drive)
- **Print Order Section** (jika ada):
  - Print status timeline
  - Selected photos, vendor, shipping info, resi
- **Actions:**
  - Edit Booking
  - Generate Invoice
  - Copy Status Link (untuk kirim ke client)
  - WA Reminder button
  - Cancel Booking
  - Delete (Owner only)

### `/dashboard/calendar` — Calendar View

- **Monthly/Weekly/Daily** toggle
- Setiap booking muncul sebagai card di kalender
- Card menampilkan: waktu, nama client, package (color-coded)
- Klik card → ke booking detail
- Mirip tampilan Notion Calendar yang di-attach tapi lebih modern

### `/dashboard/clients` — Client Database

- **Tabel:** Nama, Phone, Email, Total Bookings, Last Visit
- **Search** by nama/phone/email
- **Pagination**
- Klik row → client detail

### `/dashboard/clients/[id]` — Client Detail

- **Profile:** nama, WA, email, alamat
- **Summary:** Total bookings, Total spent, Last visit
- **Booking History:** tabel semua booking client ini
- **Actions:** Edit, Delete (Owner only)

### `/dashboard/reminders` — Reminder

- **Tab:** Today / Tomorrow / All
- **Tabel:** Nama, Jam Sesi, Package, Status, Hours Until Session
- **Tombol WA** per row — klik langsung buka WhatsApp dengan pesan otomatis
- Color coding: merah jika < 2 jam, kuning jika < 6 jam

### `/dashboard/finance` — Finance (Owner only)

- **Month picker**
- **Summary cards:** Income, Expense, Gross Profit
- **Income section:** Tabel dari booking yang paid
- **Expense section:** Tabel + tombol Add Expense
- **Expense breakdown:** Chart/cards per kategori
- **Export to Excel** button

### `/dashboard/finance/expenses/new` — Add Expense

- Form: deskripsi, jumlah, kategori (dropdown), tanggal, booking terkait (opsional), notes

### `/dashboard/commissions` — Staff Commission (Owner only)

- **Month/Year picker**
- **Tabel:** Staff Name, Role, Total Bookings, Commission Amount, Notes
- **Edit** commission amount per staff
- Auto-calculated booking count

### `/dashboard/invoices/[bookingId]` — Invoice

- **Preview** invoice yang estetik
- Logo Yoonjaespace, aksen merah
- Invoice number, tanggal
- Client info
- Itemized: package, setiap add-on, discount, total
- **Actions:** Download PDF, Print, Copy share link

### `/dashboard/settings` — Settings (Owner/Admin)

**Sub-pages atau tabs:**

#### Settings > General

- Studio name, address, phone, Instagram
- Operating hours
- Day off
- Default payment status

#### Settings > Packages

- Tabel: Name, Price, Duration, Max People, Active
- CRUD actions

#### Settings > Backgrounds

- List + CRUD

#### Settings > Add-on Templates

- Tabel: Name, Default Price, Active
- CRUD

#### Settings > Vouchers

- Tabel: Code, Type, Value, Usage, Valid Period, Active
- CRUD

#### Settings > Custom Fields

- Tabel: Field Name, Type, Required, Active
- CRUD (admin bisa tambah pertanyaan custom)

### `/dashboard/users` — User Management (Owner only)

- Tabel: Name, Email, Role, Status (Active/Inactive)
- **+ Add User** — form: nama, email, password, role
- Edit role, activate/deactivate
- Delete (tidak bisa hapus diri sendiri)

---

# 9. COMPONENT STRUCTURE

## Layout Components

- `DashboardLayout` — sidebar + header + content area
- `Sidebar` — navigation menu (filtered by role)
- `Header` — breadcrumb, user info, logout

## Shared Components

- `StatusBadge` — colored badge for booking/payment/print status
- `StatusTimeline` — visual stepper for status progression
- `DataTable` — reusable table with sort, filter, pagination
- `SearchInput` — debounced search
- `MonthPicker` — month/year selector
- `ConfirmDialog` — confirmation modal
- `LoadingSpinner`
- `EmptyState`
- `PriceCalculator` — live total calculation in booking form

## Sidebar Menu Structure

### Owner

1. Dashboard (home icon)
2. Bookings (calendar-check icon)
3. Calendar (calendar icon)
4. Clients (users icon)
5. Reminders (bell icon)
6. Finance (wallet icon)
7. Commissions (award icon)
8. Settings (settings icon)
9. User Management (shield icon)

### Admin

1. Dashboard
2. Bookings
3. Calendar
4. Clients
5. Reminders
6. Settings (limited)

### Photographer

1. Dashboard (Today's Schedule)

### Packaging Staff

1. Dashboard (Shipping Tasks)

---

# 10. ADDITIONAL NOTES FROM CLIENT

## Dari chat client:

1. "data-data nya bisa di export ke excel gitu ga kaya finance" → ✅ Finance export Excel
2. "untuk status client itu cara akses nya gimana ya" → ✅ Unique link per order, dikirim via WA
3. "tujuan web app ini untuk mempermudah flow nya aja" → ✅ Semua dalam 1 dashboard
4. "saya ingin tampilannya clean estetik kak, vibes studio foto estetik" → ✅ Design direction
5. "base color putih, aksen warna logo yoonjae" → ✅ White + deep red/maroon
6. "ekspektasinya menu di dashboardnya akan banyak" → ✅ Role-based menu
7. "client lihat juga jangan status aja, mungkin social icons atau hal lainnya" → ✅ Halaman status publik dengan branding
8. "staff bisa lihat info-info, kalo memungkinkan ada tombol tambahan notes yang bisa disesuaikan" → ✅ Custom fields
9. "buka setiap hari, libur selasa, kalo tgl merah move liburnya" → ✅ Settings
10. "flow skrg booking via wa > admin kasih wa form > admin input manual ke notion" → ✅ Diganti dengan dashboard
11. "harapannya web bisa memfasilitasi semuanya dalam 1 dashboard" → ✅ Single dashboard
12. "di notion jg aku bikin sistem bonus per sales/booking" → ✅ Commission system
13. "fitur update, delete booking" → ✅ Cancel, edit, delete (Owner only)

## Contoh Referensi Visual:

- **Status page:** Mirip Otter receipt (app.otter.id/receipt) — lihat Image 1 di uploads
- **Staff view:** Mirip Notion calendar view (dark mode) — lihat Image 3 & 4 di uploads
- **Notion input form:** Lihat Image 5 di uploads
- **Notion reminder:** Lihat Image 6 di uploads

---

# 11. SEED DATA (Already in Database)

## Owner Account

- Email: `owner@yoonjaespace.com`
- Password: `owner123456`
- Role: OWNER

## 7 Packages

1. Birthday Smash Cake Session — Rp 500,000 / 60 min / 5 people
2. Graduation Session — Rp 350,000 / 45 min / 3 people
3. Family Session — Rp 600,000 / 90 min / 8 people
4. Group Session — Rp 400,000 / 60 min / 10 people
5. LinkedIn Profile Session — Rp 250,000 / 30 min / 1 person
6. Pas Photo Session — Rp 150,000 / 15 min / 1 person
7. Studio Only — Rp 200,000 / 60 min / 10 people

## 4 Backgrounds

Limbo, Spotlight, Mid-Century, Chrome

## 5 Add-on Templates

1. MUA — Rp 200,000
2. Extra Person — Rp 50,000
3. Extra Duration (30 min) — Rp 100,000
4. Print Canvas — Rp 150,000
5. Print Photo — Rp 75,000

## Studio Settings

- Name: Yoonjaespace
- Hours: 08:00 - 20:00
- Day off: Tuesday
- Default payment: Unpaid
- Instagram: https://www.instagram.com/yoonjaespace

---

# 12. DEPLOYMENT

- **Platform:** Vercel (free tier)
- **Database:** Supabase (free tier, PostgreSQL)
- **Domain:** TBD (sementara pakai Vercel subdomain)
- **Environment Variables:** DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

---

# 13. CURRENT PROJECT STATE

## What's Done ✅

- Next.js project initialized (TypeScript, App Router, Tailwind, src/ directory)
- All dependencies installed
- Prisma schema (17 tables) created and migrated to Supabase
- Supabase Auth configured (NOT NextAuth — we switched)
- Middleware for route protection
- Seed data (Owner user, packages, backgrounds, add-ons, settings)
- ALL 40 API routes created

## What's NOT Done Yet ❌

- Frontend pages (NONE created yet — only default Next.js page exists)
- shadcn/ui NOT installed yet — need to run `npx shadcn@latest init`
- No components created yet
- No invoice PDF template
- No Excel export implementation on frontend
- Calendar component not installed yet

## Current File Structure

```
D:\projects\yoonjaespace\
├── prisma/
│   ├── schema.prisma          # Complete schema (17 models)
│   ├── seed.ts                # Seed script
│   └── migrations/            # 2 migrations applied
├── src/
│   ├── app/
│   │   ├── api/               # ALL 40 API routes (see Section 7)
│   │   ├── layout.tsx         # Default root layout
│   │   ├── page.tsx           # Default home page (needs replacing)
│   │   └── globals.css
│   ├── lib/
│   │   └── prisma.ts          # Prisma client singleton
│   ├── utils/
│   │   └── supabase/
│   │       ├── admin.ts       # Service role client (create users)
│   │       ├── client.ts      # Browser client (login)
│   │       ├── middleware.ts   # Session management
│   │       └── server.ts      # Server component client
│   └── middleware.ts           # Next.js middleware (route protection)
├── .env                       # All env vars configured
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.ts
```

## Known Issues / Notes

1. **Prisma version:** Using Prisma 5 (NOT 7) — Prisma 7 had breaking config changes. A `prisma.config.ts` file exists at root for Prisma 7 compatibility but we're using v5 features.
2. **Migration with PgBouncer:** `npx prisma migrate dev` fails with pooled connection (port 6543). Must temporarily change DATABASE_URL to direct connection (port 5432) for migrations, then revert.
3. **API Auth in Postman:** Cookies from login don't persist across requests in Postman. For testing, update login route to return `access_token` in response, then use Bearer Token auth in Postman.
4. **Middleware matcher:** API routes `/api/auth/login` and `/api/status/` are excluded from auth middleware. All other API routes handle auth internally via `supabase.auth.getUser()`.
5. **nanoid:** Using nanoid@3 (not v4+) because v4 is ESM-only.
6. **Node.js version on dev machine:** v24.11.1
7. **npm version on dev machine:** v8.19.2
8. **OS:** Windows 11

## Supabase Project Info

- **Project:** yoonjaespace
- **Region:** Southeast Asia (Singapore)
- **Project URL:** https://cuhgwiiehdwyircmanzk.supabase.co

## Environment Variables Template

```
DATABASE_URL="postgresql://postgres.cuhgwiiehdwyircmanzk:thisyoonjae01@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.cuhgwiiehdwyircmanzk:thisyoonjae01@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL=https://cuhgwiiehdwyircmanzk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1aGd3aWllaGR3eWlyY21hbnprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODU2ODQsImV4cCI6MjA4NjY2MTY4NH0.g1EW94nsYvBzAnqGbaOfC7f68V_aYbK7CosxI_grcYI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1aGd3aWllaGR3eWlyY21hbnprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA4NTY4NCwiZXhwIjoyMDg2NjYxNjg0fQ.HLtrW8h6BAuaHgYWmxwjbHzHocm2Ix6cjwE2N-r1jgo
```
