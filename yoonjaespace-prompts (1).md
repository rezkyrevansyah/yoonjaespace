# Yoonjaespace Studio Management App — Claude Code Prompts

> **Panduan Penggunaan:** Jalankan **Prompt 0 (Master Setup)** terlebih dahulu untuk setup project, lalu jalankan prompt per modul secara berurutan. Setiap prompt bisa di-copy paste langsung ke Claude Code CLI.

---

## PROMPT 0 — Master Project Setup & Foundation

````
Kamu adalah senior frontend engineer yang akan membangun aplikasi studio management untuk Yoonjaespace, sebuah studio foto di Indonesia.

## ⛔ CRITICAL RULES — JANGAN SENTUH BACKEND

Project ini SUDAH PUNYA backend (Prisma, Supabase, API routes, middleware, Zod schemas). Kamu HANYA fokus membuat frontend pages dan components.

DILARANG KERAS:
- JANGAN hapus/modify `src/app/api/` (API routes)
- JANGAN hapus/modify `src/middleware.ts` (auth middleware)
- JANGAN hapus/modify `src/schemas/` (Zod validation schemas)
- JANGAN hapus/modify `prisma/` folder (database schema)
- JANGAN hapus/modify file di `src/types/` yang sudah ada — boleh TAMBAH file baru
- JANGAN hapus/modify file di `src/utils/` yang sudah ada — boleh TAMBAH file baru
- JANGAN hapus backend dependencies dari package.json (@prisma/client, @supabase/ssr, @supabase/supabase-js, zod, react-hook-form, dll)
- JANGAN modify konfigurasi environment variables (.env, .env.local)

YANG BOLEH:
- TAMBAH dependencies baru (recharts, date-fns, dll)
- TAMBAH file dan folder baru untuk frontend
- MODIFY `src/app/layout.tsx` untuk font & metadata (hati-hati jangan hapus existing providers)
- MODIFY `src/app/globals.css` untuk MENAMBAH CSS variables baru (jangan hapus yang existing)
- MODIFY `src/lib/utils.ts` untuk MENAMBAH utility functions baru (jangan hapus yang existing)
- BUAT file baru di `src/lib/` (mock-data.ts, constants.ts, hooks/)
- BUAT file baru di `src/components/` (shared/, layout/)
- BUAT page files baru di `src/app/`

Jika ada konflik nama file/folder dengan yang sudah ada, TANYAKAN dulu sebelum overwrite.

## PROJECT SETUP

Project Next.js sudah ada. Kamu perlu menambah dependencies dan membuat file-file frontend baru. Konfigurasi berikut:

### Tech Stack
- Next.js 14+ (App Router)
- TypeScript (strict mode)
- Tailwind CSS 4
- shadcn/ui (semua komponen yang dibutuhkan)
- Lucide React (icons)
- Font: Poppins (Google Fonts, via next/font/google)
- date-fns (date formatting, locale Indonesia)
- recharts (untuk charts di dashboard & finance)

### Design System & Brand
- **Primary color:** Merah maroon gelap `#7A1F1F` (deep maroon) dengan variasi:
  - Lighter: `#9B3333` (hover states)
  - Lightest: `#F5ECEC` (backgrounds, badges)
  - Darkest: `#5C1717` (active states, borders)
- **Background:** Pure white `#FFFFFF` dengan subtle gray `#F9FAFB` untuk content area
- **Text:** `#111827` (primary), `#6B7280` (secondary), `#9CA3AF` (muted)
- **Border:** `#E5E7EB` (default), `#D1D5DB` (hover)
- **Status colors:**
  - Booked: `#6B7280` (gray)
  - Paid: `#2563EB` (blue)
  - Shoot Done: `#D97706` (amber)
  - Photos Delivered: `#059669` (green)
  - Closed: `#374151` (dark gray)
  - Cancelled: `#DC2626` (red)
- **Payment:** Paid `#059669` (green badge), Unpaid `#DC2626` (red badge)
- **Design philosophy:** Clean, minimal white space, no visual clutter. Terinspirasi gaya SaaS dashboard modern yang bersih — bukan template generic. Rounded corners (`rounded-lg` to `rounded-xl`), subtle shadows (`shadow-sm`), consistent 8px spacing grid.

### Font Configuration
```tsx
import { Poppins } from 'next/font/google'
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})
````

### Arsitektur & Prinsip

1. **Modular:** Setiap fitur adalah modul tersendiri dalam folder yang rapi
2. **DRY:** Komponen reusable untuk pattern yang berulang (status badge, data table, form fields, page header, dll)
3. **SOLID:** Single responsibility per component, dependency injection via props
4. **Mobile-first:** Staff sering operasikan via HP — semua layout HARUS responsive. Sidebar jadi hamburger menu di mobile dengan slide-in drawer. Tabel jadi card list di mobile.
5. **Dummy data:** Semua data pakai mock data hardcoded di `src/lib/mock-data.ts` — JANGAN sambungkan ke API/database

### Folder Structure (FILE BARU yang perlu dibuat)

Ini adalah file-file BARU yang perlu ditambahkan. File/folder yang sudah ada di project (api/, middleware, schemas/, prisma/, dll) JANGAN disentuh.

```
src/
├── app/
│   ├── layout.tsx                    # MODIFY: tambah Poppins font (jangan hapus existing code)
│   ├── page.tsx                      # MODIFY: redirect ke /login
│   ├── login/
│   │   └── page.tsx                  # NEW
│   ├── dashboard/
│   │   ├── layout.tsx                # NEW: Dashboard shell (sidebar + header)
│   │   ├── page.tsx                  # NEW: Main dashboard
│   │   ├── bookings/
│   │   │   ├── page.tsx              # NEW
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # NEW
│   │   │   └── [id]/
│   │   │       └── page.tsx          # NEW
│   │   ├── calendar/
│   │   │   └── page.tsx              # NEW
│   │   ├── clients/
│   │   │   ├── page.tsx              # NEW
│   │   │   └── [id]/
│   │   │       └── page.tsx          # NEW
│   │   ├── reminders/
│   │   │   └── page.tsx              # NEW
│   │   ├── finance/
│   │   │   └── page.tsx              # NEW
│   │   ├── commissions/
│   │   │   └── page.tsx              # NEW
│   │   ├── settings/
│   │   │   └── page.tsx              # NEW
│   │   ├── users/
│   │   │   └── page.tsx              # NEW
│   │   └── invoices/
│   │       └── [bookingId]/
│   │           └── page.tsx          # NEW
│   ├── status/
│   │   └── [slug]/
│   │       └── page.tsx              # NEW: Public status page
│   └── api/                          # ⛔ JANGAN SENTUH — backend existing
├── components/
│   ├── ui/                           # NEW: shadcn/ui components (auto-generated)
│   ├── shared/                       # NEW: Reusable project components
│   │   ├── page-header.tsx
│   │   ├── status-badge.tsx
│   │   ├── data-table.tsx
│   │   ├── stat-card.tsx
│   │   ├── empty-state.tsx
│   │   ├── mobile-card.tsx
│   │   └── confirm-dialog.tsx
│   └── layout/                       # NEW: Layout components
│       ├── sidebar.tsx
│       ├── mobile-nav.tsx
│       ├── header.tsx
│       └── breadcrumb.tsx
├── lib/
│   ├── mock-data.ts                  # NEW: ALL dummy data centralized
│   ├── types.ts                      # NEW: Frontend-specific types (jangan konflik dengan src/types/)
│   ├── constants.ts                  # NEW: Enums, status maps, menu config
│   ├── utils.ts                      # MODIFY: TAMBAH utility functions (jangan hapus existing)
│   └── hooks/                        # NEW
│       ├── use-mobile.ts
│       └── use-mock-state.ts
├── schemas/                          # ⛔ JANGAN SENTUH — backend existing
├── types/                            # ⛔ JANGAN SENTUH — backend existing
├── utils/                            # ⛔ JANGAN SENTUH — backend existing
└── middleware.ts                     # ⛔ JANGAN SENTUH — backend existing
```

### Mock Data Schema (src/lib/mock-data.ts)

Buat dummy data yang realistis dengan konteks Indonesia:

- 8-10 bookings dengan berbagai status
- 5-6 clients (nama Indonesia)
- 3-4 staff users (Owner, Admin, Photographer, Packaging Staff)
- 4-5 packages (Birthday Smash Cake, Graduation, Family, LinkedIn Profile, Pas Photo)
- 4 backgrounds (Limbo, Spotlight, Mid-Century, Chrome)
- 3-4 add-on templates (MUA, Extra Person, Cetak Foto, Frame)
- 2-3 vouchers
- 5-8 expenses
- Financial data (income & expenses) untuk bulan berjalan
- Commission data per staff

### Shared Components Requirements

Semua shared component HARUS:

- Support dark/light variant via props (default light)
- Fully responsive (mobile-first)
- Menggunakan shadcn/ui sebagai base
- Consistent spacing & sizing

### Responsive Breakpoints

- Mobile: < 768px (default, mobile-first)
- Tablet: >= 768px
- Desktop: >= 1024px
- Aturan: Di mobile, sidebar berubah jadi hamburger menu dengan slide-in drawer overlay. Header menampilkan hamburger button di kiri untuk membuka sidebar.

Jalankan setup ini: install dependencies baru yang belum ada (recharts, date-fns, dll), setup shadcn/ui (jika belum), buat folder structure untuk file-file BARU, buat types, constants, mock data, dan semua shared components. JANGAN hapus atau modify file backend yang sudah ada. Pastikan project bisa `npm run dev` tanpa error.

```

---

## PROMPT 1 — Login Page

```

Brief di bawah Buat menu Login Page. oh ya berdasarkan brief saya sebelumnya, kita ini fokus ke frontend agar client suka dengan tampilannya. jadi jangan ada integrasi dengan backend dulu. semua data menggunakan dummy data. dan backend jangan di ubah, hapus, ataupun otak atik. tapi kita bisa analisis backend untuk tau fiturnya seperti apa. pastikan tampilannya estetik, clean, tata letak rapih.

⚠️ **PENTING - Analisis Project Terlebih Dahulu:**
Sebelum memulai implementasi, lakukan analisis project terlebih dahulu untuk mengecek apakah halaman/komponen ini sudah ada atau belum:
- **Jika SUDAH ADA:** Baca file yang ada, lalu revisi atau kembangkan sesuai instruksi prompting di bawah ini
- **Jika BELUM ADA:** Buat file baru sesuai dengan konsep tata letak folder frontend yang sudah dipakai di project ini

Lanjutkan project Yoonjaespace. Buat halaman Login.

## Spesifikasi

### Layout

- Centered card di tengah layar (max-width 400px)
- Background halaman: gradient sangat subtle dari white ke #F9FAFB
- Card: white, rounded-2xl, shadow-lg, padding generous (p-8)

### Komponen dalam Card

1. **Logo area:**
   - Logo image dari `/logo_yoonjae.png` (width 80px, height auto, center)
   - Teks "Yoonjaespace" dengan font Poppins bold, warna maroon #7A1F1F, ukuran besar
   - Di bawahnya subtitle kecil "Studio Management" warna gray
2. **Form fields:**
   - Email input dengan label, icon Mail di kiri (lucide)
   - Password input dengan label, icon Lock di kiri, toggle show/hide eye icon di kanan
3. **Login button:** Full width, background maroon #7A1F1F, hover #9B3333, text white, font semibold, rounded-lg, height 44px
4. **Tidak ada** Register atau Forgot Password link

### Behavior

- Pakai dummy validation: email "owner@yoonjaespace.com" + password "owner123456" → redirect ke /dashboard (pakai router.push, mock saja)
- Tampilkan error toast/message jika credential salah
- Loading state di button saat submit (spinner + "Logging in...")
- Form accessible: proper labels, autofocus email, enter key submit

### Mobile

- Card full width dengan padding horizontal 16px
- Touch-friendly input sizes (min height 44px)

### Auth Context

- Buat auth context sederhana untuk menyimpan user state
- Tidak perlu integrasi dengan backend API
- Simpan user info (nama, role) di context untuk dipakai di dashboard layout

```

---

## PROMPT 2 — Dashboard Layout (Sidebar + Header + Mobile Nav)

```

Brief di bawah Buat menu Dashboard Layout. oh ya berdasarkan brief saya sebelumnya, kita ini fokus ke frontend agar client suka dengan tampilannya. jadi jangan ada integrasi dengan backend dulu. semua data menggunakan dummy data. dan backend jangan di ubah, hapus, ataupun otak atik. tapi kita bisa analisis backend untuk tau fiturnya seperti apa. pastikan tampilannya estetik, clean, tata letak rapih.

⚠️ **PENTING - Analisis Project Terlebih Dahulu:**
Sebelum memulai implementasi, lakukan analisis project terlebih dahulu untuk mengecek apakah halaman/komponen ini sudah ada atau belum:
- **Jika SUDAH ADA:** Baca file yang ada, lalu revisi atau kembangkan sesuai instruksi prompting di bawah ini
- **Jika BELUM ADA:** Buat file baru sesuai dengan konsep tata letak folder frontend yang sudah dipakai di project ini

Lanjutkan project Yoonjaespace. Buat dashboard layout beserta komponen sidebar, header, dan mobile navigation.

## Spesifikasi

### Sidebar (Desktop — >= 1024px)

- Fixed di kiri, width 260px, height full viewport, background white, border-right #E5E7EB
- **Atas:**
  - Logo image dari `/logo_yoonjae.png` (40x40px, rounded-xl, shadow-md)
  - Teks "Yoonjaespace" (Poppins bold, maroon)
  - Subtitle "Studio Management" (text-xs, gray)
  - Di mobile, tambahkan close button (X icon) di kiri logo
- **Menu items** (vertikal, dengan icon Lucide):
  1. Dashboard — LayoutDashboard
  2. Bookings — CalendarCheck
  3. Calendar — Calendar
  4. Clients — Users
  5. Reminders — Bell
  6. Finance — Wallet
  7. Commissions — Award
  8. Settings — Settings
  9. User Management — ShieldCheck
- **Active state:** Background #F5ECEC, text maroon #7A1F1F, left border 3px maroon
- **Hover state:** Background #F9FAFB
- **Icon + label:** Icon 20px, label Poppins medium 14px, gap-3
- **Bawah sidebar:** Card kecil dengan:
  - Avatar circle (initials, bg #F5ECEC, text maroon)
  - Nama user dari mock data
  - Role badge kecil (maroon badge, uppercase, text-xs)
  - Tombol logout (icon LogOut, merah subtle, hover bg-red-50)

### Header (Top bar)

- Sticky top, height 64px, background white/95 backdrop-blur, border-bottom #E5E7EB, z-index tinggi
- **Kiri:**
  - Hamburger menu button (mobile only, lg:hidden) — icon Menu
  - Breadcrumb navigation (desktop only, hidden lg:block) — auto-generate dari route
  - Page title (mobile only, lg:hidden) — text-lg semibold
- **Kanan:**
  - Search button (icon Search, rounded-lg, hover bg-gray-50)
  - Notifications button (icon Bell dengan red dot indicator)
  - Nama user + avatar circle (desktop only, xl:block) — nama, role di bawah

### Mobile Navigation (< 1024px)

- Sidebar disembunyikan di mobile (translate-x-full)
- Hamburger button di header (kiri) membuka sidebar sebagai slide-in drawer
- Overlay hitam semi-transparent (bg-black/50) muncul saat sidebar terbuka
- Sidebar slide dari kiri dengan animasi smooth (transition-transform duration-300)
- Close button (X) di dalam sidebar untuk menutup
- Klik overlay juga menutup sidebar

### Content Area

- Margin-left 260px di desktop (sesuai sidebar width)
- Padding: p-6 desktop, p-4 mobile
- Background: #F9FAFB
- Min-height: calc(100vh - 64px)
- Scrollable

### State Management

- Current user dari mock data (hardcoded: Owner role)
- Active menu item berdasarkan current pathname (pakai usePathname)
- Mobile sidebar state (open/close) dengan useState
- Logout functionality — clear auth context + redirect ke /login

```

---

## PROMPT 3 — Dashboard Home

```

Brief di bawah Buat menu Dashboard Home. oh ya berdasarkan brief saya sebelumnya, kita ini fokus ke frontend agar client suka dengan tampilannya. jadi jangan ada integrasi dengan backend dulu. semua data menggunakan dummy data. dan backend jangan di ubah, hapus, ataupun otak atik. tapi kita bisa analisis backend untuk tau fiturnya seperti apa. pastikan tampilannya estetik, clean, tata letak rapih.

⚠️ **PENTING - Analisis Project Terlebih Dahulu:**
Sebelum memulai implementasi, lakukan analisis project terlebih dahulu untuk mengecek apakah halaman/komponen ini sudah ada atau belum:
- **Jika SUDAH ADA:** Baca file yang ada, lalu revisi atau kembangkan sesuai instruksi prompting di bawah ini
- **Jika BELUM ADA:** Buat file baru sesuai dengan konsep tata letak folder frontend yang sudah dipakai di project ini

Lanjutkan project Yoonjaespace. Buat halaman dashboard utama.

## Spesifikasi

### URUTAN SECTIONS HARUS TEPAT:
1. Welcome Banner
2. Monthly Stats
3. Action Items
4. Quick Actions
5. Today's Schedule

### Section A — Welcome Banner

- "Selamat datang, [Nama User]! 👋" — Poppins semibold, text-2xl di desktop, text-xl di mobile
- Di bawah: tanggal hari ini format Indonesia "Senin, 16 Februari 2026" — text-sm, gray
- Tidak perlu card, cukup teks di atas content

### Section B — Monthly Stats (TARUH DI ATAS ACTION ITEMS!)

- Heading "Statistik Bulan Ini" — text-base font-semibold
- 3 cards horizontal (stack di mobile):
  1. "Total Bookings" — icon CalendarCheck — angka dari mock (contoh: 24) — bg white border
  2. "Revenue" — icon TrendingUp — "Rp 12.500.000" — bg white, angka hijau
  3. "Belum Dibayar" — icon AlertCircle — angka + "Rp X.XXX.XXX" — bg white, angka merah
- Card style: border #E5E7EB, rounded-xl, padding p-5
- Icon di pojok kanan dalam box rounded-xl bg-colored-light
- Tampilkan persentase perubahan dari bulan lalu (contoh: "+12% dari bulan lalu")

### Section C — Action Items (TARUH SETELAH MONTHLY STATS!)

- Heading "Action Items" — text-base font-semibold
- 4 cards horizontal (2x2 grid di mobile):
  1. "Waiting Selection" — icon Clock — angka dari mock — bg-yellow-50, text-yellow-700
  2. "At Vendor" — icon Truck — bg-blue-50, text-blue-700
  3. "Need Packaging" — icon Package — bg-purple-50, text-purple-700
  4. "Need Shipping" — icon Send — bg-green-50, text-green-700
- Setiap card clickable (navigasi ke bookings filtered)
- Icon di atas, angka besar (text-2xl bold), label di bawah (text-sm)
- Hover: shadow-md transition

### Section D — Quick Actions (TARUH SETELAH ACTION ITEMS!)

- 2 buttons side by side (stack di mobile):
  1. "+ New Booking" — button primary maroon, icon Plus — link ke /dashboard/bookings/new
  2. "Search Order" — button outline/secondary, icon Search — link ke /dashboard/bookings
- Height 48px (h-12), rounded-xl, font-semibold
- Full width di mobile

### Section E — Today's Schedule (TARUH PALING BAWAH!)

- Card dengan border, rounded-xl, bg white, p-5
- Heading "Jadwal Hari Ini" dengan icon CalendarClock
- Card list — setiap card:
  - Kiri: time (09:00) dalam pill kecil (bg #F5ECEC, text maroon)
  - Tengah: Nama Client (bold), Package name (text-sm gray)
  - Kanan: Status badge (pakai shared StatusBadge component)
  - Hover: shadow-sm, border maroon/20
- Jika kosong: Empty state "Tidak ada sesi hari ini" dengan icon CalendarDays dan teks "Nikmati hari istirahat Anda!"
- Footer card: link "Lihat Calendar →" ke /dashboard/calendar (text-sm, maroon, flex items-center gap-1)
- Di mobile: cards full width, stacked

### Layout

- Semua sections spacing gap-6
- Desktop: container yang rapi
- Mobile: full width, padding adjusted

### Data

- Semua dari mock data
- Today's schedule ambil dari bookings yang status BOOKED atau PAID (mock beberapa)
- Stats dari dashboard summary API (tapi pakai mock)

```

---

## PROMPT 4 — Bookings List

```

Brief di bawah Buat menu Bookings List. oh ya berdasarkan brief saya sebelumnya, kita ini fokus ke frontend agar client suka dengan tampilannya. jadi jangan ada integrasi dengan backend dulu. semua data menggunakan dummy data. dan backend jangan di ubah, hapus, ataupun otak atik. tapi kita bisa analisis backend untuk tau fiturnya seperti apa. pastikan tampilannya estetik, clean, tata letak rapih.

⚠️ **PENTING - Analisis Project Terlebih Dahulu:**
Sebelum memulai implementasi, lakukan analisis project terlebih dahulu untuk mengecek apakah halaman/komponen ini sudah ada atau belum:
- **Jika SUDAH ADA:** Baca file yang ada, lalu revisi atau kembangkan sesuai instruksi prompting di bawah ini
- **Jika BELUM ADA:** Buat file baru sesuai dengan konsep tata letak folder frontend yang sudah dipakai di project ini

Lanjutkan project Yoonjaespace. Buat halaman booking list dengan fitur CRUD (Read).

## CRUD Operations untuk Bookings:
- **CREATE:** Button "New Booking" → navigate ke form create booking
- **READ:** List/table semua bookings dengan filter dan search
- **UPDATE:** Click row → navigate ke detail page (edit di detail)
- **DELETE:** Di detail page (Owner only)

## Spesifikasi

### Page Header

- Judul "Bookings" (Poppins semibold, text-2xl)
- Tombol "+ New Booking" (maroon primary button) — link ke create page
- Pakai shared PageHeader component

### Filter Bar

- Row horizontal (wrap di mobile):
  - Search input: placeholder "Cari nama, WA, atau Booking ID...", icon Search, debounced
  - Dropdown Status: All, Booked, Paid, Shoot Done, Photos Delivered, Closed, Cancelled (pakai shadcn Select)
  - Date range picker (simple from-to date inputs atau shadcn date picker)
  - Tombol "Clear" (text button, muncul jika ada filter aktif)
- Di mobile: search full width di atas, filters dalam collapsible "Filter" button yang buka sheet

### Data Table (Desktop >= 768px)

- Pakai shared DataTable component
- Columns:
  | Booking ID | Client | Date | Time | Package | Status | Payment | Handled By | Total |
- Booking ID: monospace font, clickable, text-sm
- Client: nama lengkap + nomor WA di bawah (text-xs gray)
- Status: colored badge (pakai StatusBadge)
- Payment: Paid (green badge) / Unpaid (red badge)
- Total: Rp formatted
- Row hover: bg-gray-50, cursor-pointer
- Row click: navigate ke detail page
- Pagination di bawah: showing "1-10 of 24", prev/next buttons
- Sort by: date (default newest), total, status

### Mobile Card List (< 768px)

- Setiap booking jadi card:
  - Header: Booking ID (monospace, bold) + Status badge
  - Body:
    - Client name (bold, text-base)
    - Date & Time (text-sm, gray, icon Calendar)
    - Package (text-sm, gray, icon Package)
  - Footer:
    - Payment badge (left)
    - Total (right, bold, maroon)
    - Handled by (text-xs, gray)
- Cards stacked, gap-3
- Pull-to-refresh feel (scroll behavior smooth)

### Empty State

- Jika tidak ada bookings: icon CalendarCheck besar, teks "Belum ada booking", button "Buat Booking Pertama"
- Jika search tidak ada hasil: icon Search, teks "Tidak ditemukan", button "Clear Filter"

### Data

- Mock 8-10 bookings dengan variasi:
  - Status: mix semua status
  - Date: berbagai tanggal (beberapa hari ini, besok, minggu depan, minggu lalu)
  - Packages: mix semua packages
  - Clients: mix semua clients
  - Staff handled by: mix semua staff
  - Payment: mix paid/unpaid
  - Total: berbagai range harga
- Filter berfungsi (client-side filtering dari mock data)
- Search filter: nama client, nomor WA, booking ID (case-insensitive)
- Date range filter: by session date

```

---

## PROMPT 5 — Create Booking

```

Brief di bawah Buat menu Create Booking. oh ya berdasarkan brief saya sebelumnya, kita ini fokus ke frontend agar client suka dengan tampilannya. jadi jangan ada integrasi dengan backend dulu. semua data menggunakan dummy data. dan backend jangan di ubah, hapus, ataupun otak atik. tapi kita bisa analisis backend untuk tau fiturnya seperti apa. pastikan tampilannya estetik, clean, tata letak rapih.

⚠️ **PENTING - Analisis Project Terlebih Dahulu:**
Sebelum memulai implementasi, lakukan analisis project terlebih dahulu untuk mengecek apakah halaman/komponen ini sudah ada atau belum:
- **Jika SUDAH ADA:** Baca file yang ada, lalu revisi atau kembangkan sesuai instruksi prompting di bawah ini
- **Jika BELUM ADA:** Buat file baru sesuai dengan konsep tata letak folder frontend yang sudah dipakai di project ini

Lanjutkan project Yoonjaespace. Buat halaman create booking dengan fitur INLINE CLIENT CREATION.

## ⭐ CRITICAL FEATURE — Inline Client Search & Creation

**BUKAN** dropdown pilih client! Tapi **INLINE SEARCH** dengan flow:
1. Search bar: "Cari nama atau nomor WA..." (text input biasa)
2. Saat user ketik → debounced search di mock clients
3. **Jika ditemukan:** Auto-fill form client dengan data existing (nama, WA, email, Instagram, alamat)
4. **Jika tidak ditemukan:** Form kosong, user input client baru
5. User bisa edit semua fields kapanpun (bahkan jika client existing)

## CRUD Operations untuk Create Booking:
- **CREATE Client:** Inline di form booking (jika client baru)
- **READ Client:** Live search untuk auto-fill
- **CREATE Booking:** Submit form → create booking baru
- **CREATE Add-ons:** Tambah add-on items (bisa dari template atau manual)

## Spesifikasi

### Layout

- Form panjang dengan sections yang jelas, separated by section headings (text-base font-semibold)
- Di desktop: 2 column — form kiri (flex-1), price summary sticky di kanan (width 360px, sticky top-20)
- Di mobile: single column, price summary jadi sticky bottom bar (collapsed, tap expand full summary)

### Section 1 — Client Info (INLINE SEARCH!)

- **Label:** "Client Information"
- **Search Input:**
  - Placeholder: "Cari nama atau nomor WA..." (icon Search di kiri)
  - Debounced search (500ms)
  - Live search saat user ketik
  - Jika match ditemukan di mock clients → auto-fill fields di bawah
  - Jika tidak ditemukan → fields kosong (client baru)
- **Form Fields Client** (always visible):
  - Nama (required, text input)
  - Nomor WhatsApp (required, tel input, placeholder: "08xxxxxxxxxx")
  - Email (optional, email input)
  - Instagram (optional, text input, placeholder: "@username")
  - Alamat (optional, textarea)
- **Note:** Jika auto-fill dari existing, fields tetap editable (user bisa update)

### Section 2 — Schedule

- **Tanggal Sesi:** Date picker (shadcn Calendar, required)
- **Waktu Sesi:** Time picker atau select dengan interval 30 menit (08:00, 08:30, 09:00, ..., 20:00)
- **Warning:** Jika tanggal = Selasa (day off): tampilkan warning badge kuning "⚠️ Selasa adalah hari libur studio"

### Section 3 — Session Details

- **Package:** Dropdown select (required)
  - Tampilkan: nama package + harga
  - Dari mock packages yang active
  - Format: "Birthday Smash Cake — Rp 500.000"
- **Background:** Dropdown select (required)
  - Dari mock backgrounds yang available
- **Jumlah Orang:** Number input (min 1, default 1, required)
- **Photo For:** Text input (contoh: "1st Birthday", "Graduation", "Family Portrait")
- **BTS Video:** Checkbox (default unchecked)
- **Notes:** Textarea (placeholder: "Catatan khusus dari customer...")

### Section 4 — Add-ons

- **Heading:** "Add-ons" + Button "+ Add Item" (outline button kecil)
- **Table Add-ons:**
  | Item | Qty | Unit Price | Subtotal | Action |
  - Item: Select (dari mock add-on templates + option "Custom")
  - Qty: Number input (min 1, default 1)
  - Unit Price: Number input (Rp, auto-fill dari template, editable jika custom)
  - Subtotal: Calculated, disabled (Qty × Unit Price)
  - Action: Delete button (icon X, merah)
- **Add Item Flow:**
  - Klik "+ Add Item" → tambah row baru
  - Select item dari template atau pilih "Custom"
  - Jika custom → user input nama & harga manual
  - Auto-calculate subtotal
- **Total Add-ons:** Di bawah table, tampilkan total semua add-ons

### Section 5 — Discount/Voucher (Optional)

- **Toggle Mode:** "Voucher Code" atau "Manual Discount" (radio buttons atau tabs)
- **Mode 1 — Voucher Code:**
  - Input kode + Button "Validate"
  - Jika match mock voucher → badge hijau "WELCOME10 — 10% off" + apply ke perhitungan
  - Jika tidak match → error message "Voucher tidak valid"
- **Mode 2 — Manual Discount:**
  - Dropdown: "Percentage" atau "Fixed Amount"
  - Input: Discount value (number)
  - Note: Text input (alasan discount)

### Section 6 — Staff Handling (for commission tracking)

- **Label:** "Staff yang Handle" (text-sm, gray)
- **Dropdown:** Select staff dari mock users
- **Default:** Current logged-in user (Owner)
- **Purpose:** Untuk tracking commission (tidak perlu dijelaskan di UI)

### Price Summary (Sticky Sidebar / Bottom Bar)

- **Tampilan Desktop Sidebar:**
  - Card rounded-xl, border, bg-white, p-5, sticky top-20
  - Heading "Ringkasan Harga" (text-base font-semibold)
  - Line items:
    ```
    Birthday Smash Cake Session      Rp 500.000
    Add-ons:
      MUA (1x)                       Rp 200.000
      Extra Person (2x)              Rp 100.000
    ─────────────────────────────────────
    Subtotal                         Rp 800.000
    Discount (WELCOME10)            -Rp  80.000
    ─────────────────────────────────────
    TOTAL                            Rp 720.000
    ```
  - Auto-update realtime saat form berubah
  - Currency format: Rp dengan separator titik (Rp 1.500.000)
- **Tampilan Mobile Bottom Bar:**
  - Fixed bottom, height auto, bg-white, border-top, shadow-lg, z-10
  - Collapsed: "Total: Rp 720.000" + chevron-up icon
  - Tap → expand full summary sheet

### Actions

- **Buttons:**
  - "Create Booking" — primary maroon button, full width di mobile
  - "Cancel" — outline button, navigate back
- **Behavior:**
  - Validasi: required fields harus terisi
  - Tampilkan error per field (red border + message di bawah)
  - Submit: console.log data + toast success "Booking berhasil dibuat! Order ID: YJS-20260216-001"
  - Redirect ke booking detail page (mock ID)
  - Auto-generate booking ID dengan format: YJS-YYYYMMDD-XXX

### Mobile UX

- Single column, sections stacked
- Price summary: sticky bottom bar collapsed, tap expand
- Semua input touch-friendly (min height 44px)
- Number inputs pakai type="tel" untuk numeric keyboard
- Date picker optimized untuk mobile touch

### Data Mock

- Clients: 5-6 existing clients untuk search/auto-fill
- Packages: 4-5 packages dengan harga berbeda
- Backgrounds: 4 backgrounds
- Add-on templates: 3-4 templates
- Staff users: 3-4 users
- Vouchers: 2-3 voucher codes untuk validasi

```

---

## PROMPT 6 — Booking Detail

```

Brief di bawah Buat menu Booking Detail. oh ya berdasarkan brief saya sebelumnya, kita ini fokus ke frontend agar client suka dengan tampilannya. jadi jangan ada integrasi dengan backend dulu. semua data menggunakan dummy data. dan backend jangan di ubah, hapus, ataupun otak atik. tapi kita bisa analisis backend untuk tau fiturnya seperti apa. pastikan tampilannya estetik, clean, tata letak rapih.

⚠️ **PENTING - Analisis Project Terlebih Dahulu:**
Sebelum memulai implementasi, lakukan analisis project terlebih dahulu untuk mengecek apakah halaman/komponen ini sudah ada atau belum:
- **Jika SUDAH ADA:** Baca file yang ada, lalu revisi atau kembangkan sesuai instruksi prompting di bawah ini
- **Jika BELUM ADA:** Buat file baru sesuai dengan konsep tata letak folder frontend yang sudah dipakai di project ini

Lanjutkan project Yoonjaespace. Buat halaman booking detail dengan fitur UPDATE & DELETE.

## CRUD Operations untuk Booking Detail:
- **READ:** Tampilkan detail lengkap booking
- **UPDATE:**
  - Update status (Booked → Paid → Shoot Done → Photos Delivered → Closed)
  - Update payment status (toggle Paid/Unpaid)
  - Input GDrive link untuk photo delivery
  - Update print order status & tracking
- **DELETE:** Button delete (Owner only) dengan confirm dialog

## Spesifikasi

### Header

- **Booking Code:** Large, bold, monospace — "YJS-20260215-001" (text-2xl)
- **Status Badge + Payment Badge:** Sejajar, gap-2
- **Action Buttons Row** (wrap di mobile):
  - "Edit Booking" (outline) — navigate ke edit page (bisa mock alert saja)
  - "WA Client" (outline, icon MessageCircle) — buka `wa.me/[phone]`
  - "Copy Status Link" (outline, icon Link) — copy public status link + toast
  - "Generate Invoice" (outline, icon FileText) — navigate ke invoice page
  - "Cancel Order" (outline merah, icon XCircle) — confirm dialog → update status CANCELLED
  - "Delete" (merah, icon Trash2, Owner only) — confirm dialog → delete booking
- Di mobile: action buttons jadi dropdown menu (MoreHorizontal trigger)

### Layout: 2 Columns (Desktop) / Stacked (Mobile)

**Left Column (Main Content) — flex-1:**

#### A. Client Info Card
- **Heading:** "Client Information" (icon User)
- **Fields:**
  - Nama (bold, text-lg)
  - WhatsApp (clickable, icon Phone, buka WA link) — format: +62 812-3456-7890
  - Email (clickable, icon Mail)
  - Instagram (clickable, icon Instagram) — link ke profile
  - Alamat (jika ada)
- **Footer:** Button "Lihat Profil Client" (outline, navigate ke client detail)

#### B. Booking Details Card
- **Heading:** "Booking Details" (icon CalendarCheck)
- **Fields:**
  - Tanggal Sesi: format panjang "Sabtu, 15 Februari 2026"
  - Waktu Sesi: "09:00 - 11:00" (icon Clock)
  - Package: nama package (bold) + description (text-sm gray)
  - Background: nama background
  - Jumlah Orang: angka + icon Users
  - Photo For: text
  - BTS Video: "Ya" / "Tidak" (badge atau text)
  - Notes: textarea (jika ada)
  - Staff yang Handle: nama + role badge

#### C. Add-ons Card
- **Heading:** "Add-ons" + Button "+ Add Item" (outline, kecil)
- **Table:**
  | Item | Qty | Unit Price | Subtotal | Action |
  - Action: Edit (icon), Delete (icon merah)
- **Behavior:** Bisa tambah/edit/delete add-on setelah booking (update mock state)

#### D. Status Management Card ⭐
- **Heading:** "Status & Actions" (icon Activity)
- **Status Timeline** (horizontal di desktop, vertical di mobile):
  - Visual stepper: Booked → Paid → Shoot Done → Photos Delivered → Closed
  - Completed step: filled circle maroon + colored line + tanggal kecil
  - Current step: ring maroon, pulse animation subtle
  - Future step: gray circle outline + gray dashed line
  - Jika Cancelled: semua gray + badge "Cancelled" merah
- **Quick Action Buttons** (conditional based on current status):
  - **BOOKED:** Button "Mark as Paid" (blue, icon CreditCard)
  - **PAID:** Button "Mark as Shoot Done" (amber, icon Camera)
  - **SHOOT_DONE:**
    - Input GDrive Link (text field, placeholder: "https://drive.google.com/...")
    - Button "Deliver Photos" (green, icon Send) — save link + update status
  - **PHOTOS_DELIVERED:**
    - Button "Close Order" (dark, icon CheckCircle)
    - Button "Create Print Order" (outline, icon Printer) — navigate ke print order form
  - **CLOSED:** Teks "Order selesai ✓" dengan check icon
  - **CANCELLED:** Teks "Order dibatalkan pada [tanggal]" (red badge)
- **Payment Toggle:** Switch Unpaid ↔ Paid (inline toggle, always visible)

#### E. Print/Canvas Tracking Card (if applicable)
- **Show:** Jika booking punya print order data (cek dari mock)
- **Heading:** "Print Order Tracking" (icon Printer)
- **Print Status Timeline:**
  - Waiting Selection → Sent to Vendor → Printing → Received → Packaging → Shipped → Completed
  - Same visual style as booking timeline
- **Form Fields:**
  - Selected Photos Link/Notes (textarea)
  - Vendor Name (text input)
  - Vendor Notes (textarea)
  - Courier (text input, contoh: JNE, J&T)
  - Tracking Number/Resi (text input)
  - Shipping Address (textarea)
- **Action Buttons:** "Update Status" per step (conditional buttons based on current print status)

#### F. Activity Log (optional — nice to have)
- **Heading:** "Activity Log" (icon History)
- **List:**
  - Timestamp, User, Action
  - Contoh: "15 Feb 2026, 10:30 — Owner — Created booking"
  - "15 Feb 2026, 14:00 — Admin — Marked as Paid"

**Right Column (Sidebar) — width 360px:**

#### G. Price Summary Card
- **Sticky top-20**
- **Heading:** "Ringkasan Harga" (icon Receipt)
- **Line Items:**
  - Package Price
  - Add-ons (list each)
  - Subtotal
  - Discount (jika ada, red text, minus)
  - **Grand Total** (bold, text-lg, maroon)
  - **Paid Amount** (jika partial payment)
  - **Outstanding** (jika belum lunas, red bold)
- **Payment Status Badge:** Paid (green) / Unpaid (red)

#### H. Invoice Section
- **Show:** Jika sudah generate invoice
- **Button:** "View Invoice" (outline, icon FileText) → navigate ke invoice page
- **Button:** "Download PDF" (outline, icon Download) → mock download
- **Button:** "Copy Invoice Link" (outline, icon Link) → copy shareable link

### Mobile Layout

- Stacked cards, full width
- Price summary tidak sticky, jadi card biasa di atas
- Action buttons di header jadi dropdown
- Timeline vertikal
- Tables jadi cards

### Data

- Ambil dari mock data by ID
- Jika ID tidak ditemukan: 404-style empty state dengan button "Kembali ke Bookings"

```

---

## PROMPT 7 — Calendar

```

Brief di bawah Buat menu Calendar. oh ya berdasarkan brief saya sebelumnya, kita ini fokus ke frontend agar client suka dengan tampilannya. jadi jangan ada integrasi dengan backend dulu. semua data menggunakan dummy data. dan backend jangan di ubah, hapus, ataupun otak atik. tapi kita bisa analisis backend untuk tau fiturnya seperti apa. pastikan tampilannya estetik, clean, tata letak rapih.

⚠️ **PENTING - Analisis Project Terlebih Dahulu:**
Sebelum memulai implementasi, lakukan analisis project terlebih dahulu untuk mengecek apakah halaman/komponen ini sudah ada atau belum:
- **Jika SUDAH ADA:** Baca file yang ada, lalu revisi atau kembangkan sesuai instruksi prompting di bawah ini
- **Jika BELUM ADA:** Buat file baru sesuai dengan konsep tata letak folder frontend yang sudah dipakai di project ini

Lanjutkan project Yoonjaespace. Buat halaman calendar view.

## Spesifikasi

### Header

- Judul "Calendar"
- **View Toggle Buttons:** Month | Week | Day (pakai shadcn ToggleGroup)
- **Navigation:**
  - Button "< Previous" (outline)
  - Display: "Februari 2026" (bulan/minggu/hari current) — bold
  - Button "Next >" (outline)
- **Tombol "Today"** (primary maroon) — kembali ke hari ini

### Monthly View (Default)

- **Grid:** 7 kolom (Sen-Min), 5-6 rows
- **Header Row:** Nama hari (Sen, Sel, Rab, Kam, Jum, Sab, Min) — bg-gray-50, text-sm, centered
- **Setiap Cell Tanggal:**
  - Angka tanggal di pojok kiri atas (text-sm)
  - Booking cards mini di bawah (max 2 visible, "+X more" jika lebih)
  - Booking card mini format:
    - Colored dot (status color) + jam (text-xs) + nama client (truncated)
    - Height kecil (h-6 atau h-7)
    - Rounded, padding minimal
  - **Hari Selasa (Day Off):** Background striped pattern atau bg-gray-100 dengan label "Day Off" (text-xs gray)
  - **Hari Ini:** Border 2px maroon, bg #F5ECEC subtle
  - **Tanggal bulan lain:** Text gray-400, tidak bold
- **Click Behavior:**
  - Klik booking card → navigate ke booking detail
  - Klik tanggal kosong → switch ke Day view tanggal tersebut

### Weekly View

- **Layout:**
  - 7 kolom (Sen-Min)
  - Time axis kiri: 08:00 - 20:00 (interval 1 jam) — text-xs gray
- **Booking Blocks:**
  - Positioned berdasarkan start-end time
  - Height proporsional durasi (1 jam = X pixels)
  - Colored berdasarkan status
  - Tampilkan: jam + client name + package (text-xs)
  - Rounded, padding p-2
- **Overlap Handling:** Side by side (50% width each) jika ada multiple bookings di jam sama
- **Click:** Navigate ke booking detail

### Daily View

- **Timeline Vertikal:** 08:00 - 20:00
- **Booking Blocks:**
  - Lebar penuh
  - Detail lengkap: jam, client, phone, package, jumlah orang, status badge
  - Card style, shadow-sm, border
  - Tinggi proporsional durasi
- **Click:** Navigate ke booking detail
- **Empty Slot:** Tampilkan "Available" (text-xs gray) di slot kosong

### Mobile Responsive

- **Monthly:**
  - Simplified grid
  - Setiap tanggal hanya colored dots (tidak tampilkan booking cards)
  - Tap tanggal → expand sheet di bawah showing bookings hari itu (list)
- **Weekly/Daily:**
  - Horizontal scroll jika perlu
  - Atau auto-switch ke Day view (simplified)
  - Touch-friendly booking blocks (min height 44px)

### Data

- Plot bookings dari mock data berdasarkan session date & time
- Minimal 5-6 bookings di tanggal berbeda untuk demo
- Mix berbagai status untuk warna-warni

### Empty State

- Jika tidak ada bookings di bulan/minggu/hari: icon Calendar, teks "Tidak ada booking", button "Buat Booking"

```

---

## PROMPT 8 — Clients

```

Brief di bawah Buat menu Clients. oh ya berdasarkan brief saya sebelumnya, kita ini fokus ke frontend agar client suka dengan tampilannya. jadi jangan ada integrasi dengan backend dulu. semua data menggunakan dummy data. dan backend jangan di ubah, hapus, ataupun otak atik. tapi kita bisa analisis backend untuk tau fiturnya seperti apa. pastikan tampilannya estetik, clean, tata letak rapih.

⚠️ **PENTING - Analisis Project Terlebih Dahulu:**
Sebelum memulai implementasi, lakukan analisis project terlebih dahulu untuk mengecek apakah halaman/komponen ini sudah ada atau belum:
- **Jika SUDAH ADA:** Baca file yang ada, lalu revisi atau kembangkan sesuai instruksi prompting di bawah ini
- **Jika BELUM ADA:** Buat file baru sesuai dengan konsep tata letak folder frontend yang sudah dipakai di project ini

Lanjutkan project Yoonjaespace. Buat halaman clients list dan client detail dengan CRUD.

## CRUD Operations untuk Clients:
- **CREATE:** Button "Add Client" → modal/dialog form
- **READ:** List/table semua clients
- **UPDATE:** Edit di detail page atau modal
- **DELETE:** Button delete (Owner only, confirm dialog)

## Clients List Page

### Page Header

- Judul "Clients" + search bar inline (flex gap-4)
- Button "+ Add Client" (primary maroon)

### Search & Filter

- Search input: filter nama, phone, email (client-side dari mock)
- Placeholder: "Cari nama, nomor WA, atau email..."
- Icon Search di kiri
- Debounced search (500ms)

### Desktop Table (>= 768px)

- Columns:
  | Name | Phone | Email | Total Bookings | Total Spent | Last Visit | Actions |
- **Name:** Bold, clickable
- **Phone:** Clickable (buka WA), format +62 xxx-xxxx-xxxx, icon Phone
- **Email:** Clickable (buka email), icon Mail
- **Total Bookings:** Badge dengan angka
- **Total Spent:** Rp formatted, bold
- **Last Visit:** Format tanggal relatif (contoh: "2 hari lalu", "15 Feb 2026")
- **Actions:**
  - Button "View" (outline, icon Eye) → navigate ke detail
  - Button "Edit" (outline, icon Edit)
  - Button "Delete" (merah, icon Trash2, Owner only)
- **Row Hover:** bg-gray-50, cursor-pointer
- **Row Click:** Navigate ke detail
- **Pagination:** showing "1-10 of 15", prev/next buttons

### Mobile Card List (< 768px)

- Setiap client jadi card:
  - **Header:** Nama (bold, text-base) + avatar circle (initials)
  - **Body:**
    - Phone (clickable, icon Phone)
    - Email (icon Mail, truncate jika panjang)
  - **Footer:**
    - Stats: "5 bookings • Rp 2.500.000" (text-xs gray)
    - Last visit: "2 hari lalu" (text-xs gray)
  - **Actions:** Dropdown menu (MoreHorizontal)
- Cards stacked, gap-3

### Add Client Modal/Dialog

- **Form Fields:**
  - Nama (required, text input)
  - Nomor WhatsApp (required, tel input, format: 08xxxxxxxxxx)
  - Email (optional, email input)
  - Instagram (optional, text input, placeholder: "@username")
  - Alamat (optional, textarea)
- **Buttons:**
  - "Save" (primary)
  - "Cancel" (outline)
- **Behavior:** Mock console.log + close modal + toast success + update list

### Empty State

- Jika tidak ada clients: icon Users besar, teks "Belum ada client", button "Tambah Client Pertama"

## Client Detail Page

### Header

- **Back Button:** "< Kembali ke Clients"
- **Client Name:** Large, bold (text-2xl)
- **Action Buttons:**
  - "Edit" (outline)
  - "Delete" (merah, Owner only)
  - "WA Client" (outline, icon MessageCircle)

### Profile Card

- **Avatar:** Large circle (80px), initials, bg maroon light
- **Info:**
  - Nama (text-xl, bold)
  - Phone (clickable WA link, icon Phone) — format +62 xxx-xxxx-xxxx
  - Email (clickable, icon Mail)
  - Instagram (clickable, icon Instagram)
  - Alamat (icon MapPin, text-sm gray) — bisa kosong
- **Edit Button:** Di pojok kanan atas card

### Summary Stats (3 Cards Horizontal)

1. **Total Bookings:** Angka besar (text-2xl), icon CalendarCheck, bg-blue-50
2. **Total Spent:** Rp formatted (text-2xl), icon DollarSign, bg-green-50
3. **Last Visit:** Tanggal relatif (text-lg), icon Clock, bg-amber-50

### Booking History Table

- **Heading:** "Booking History" (text-base font-semibold)
- **Table:** Same columns as bookings list tapi filtered untuk client ini saja
  | Booking ID | Date | Time | Package | Status | Payment | Total |
- **Mobile:** Card list
- **Click Row:** Navigate ke booking detail
- **Empty State:** Jika client belum punya booking — icon Calendar, teks "Belum ada booking dari client ini", button "Buat Booking"

### Edit Client Modal

- Same form as Add Client
- Pre-filled dengan data existing
- Button "Update" (primary)

### Delete Confirmation

- Dialog confirm: "Hapus client [Nama]?"
- Warning: "Booking history akan tetap ada, tapi client tidak bisa dipilih lagi untuk booking baru."
- Buttons: "Cancel" (outline), "Delete" (merah)

### Data Mock

- 5-6 clients dengan variasi:
  - Beberapa punya banyak bookings, beberapa sedikit
  - Total spent berbeda-beda
  - Last visit berbeda (ada yang recent, ada yang lama)

```

---

## PROMPT 9 — Reminders

```

Brief di bawah Buat menu Reminders. oh ya berdasarkan brief saya sebelumnya, kita ini fokus ke frontend agar client suka dengan tampilannya. jadi jangan ada integrasi dengan backend dulu. semua data menggunakan dummy data. dan backend jangan di ubah, hapus, ataupun otak atik. tapi kita bisa analisis backend untuk tau fiturnya seperti apa. pastikan tampilannya estetik, clean, tata letak rapih.

⚠️ **PENTING - Analisis Project Terlebih Dahulu:**
Sebelum memulai implementasi, lakukan analisis project terlebih dahulu untuk mengecek apakah halaman/komponen ini sudah ada atau belum:
- **Jika SUDAH ADA:** Baca file yang ada, lalu revisi atau kembangkan sesuai instruksi prompting di bawah ini
- **Jika BELUM ADA:** Buat file baru sesuai dengan konsep tata letak folder frontend yang sudah dipakai di project ini

Lanjutkan project Yoonjaespace. Buat halaman reminders dengan fitur WA link auto-generation.

## Fitur Utama:
- **List bookings** yang upcoming (hari ini, besok, minggu ini)
- **Auto-generate WA link** dengan template pesan otomatis
- **Hours left indicator** dengan color coding

## Spesifikasi

### Header

- Judul "Reminders" (icon Bell)
- **Tab Filter:** Today | Tomorrow | This Week | All (pakai shadcn Tabs)

### Desktop Table (>= 768px)

- Columns:
  | Client | Phone | Date & Time | Package | Status | Hours Left | Action |
- **Client:** Nama (bold) + avatar initials
- **Phone:** Format +62 xxx-xxxx-xxxx, clickable (buka WA)
- **Date & Time:** Format "Sabtu, 15 Feb • 09:00 - 11:00" (icon Calendar)
- **Package:** Nama package (text-sm)
- **Status:** Status badge
- **Hours Left:** Badge dengan color coding:
  - **< 2 jam:** bg-red-50, text-red-700, icon AlertCircle — "1.5 jam lagi"
  - **< 6 jam:** bg-amber-50, text-amber-700, icon Clock — "4 jam lagi"
  - **> 6 jam:** bg-green-50, text-green-700, icon CheckCircle — "8 jam lagi"
  - Format: "X jam lagi" atau "X menit lagi"
- **Action:** Button "Send WA Reminder" (green, icon MessageCircle)

### Mobile Card List (< 768px)

- Setiap reminder jadi card:
  - **Header:** Nama client (bold) + Status badge
  - **Body:**
    - Date & Time (icon Calendar, text-sm)
    - Package (icon Package, text-sm)
    - Phone (clickable, icon Phone)
  - **Footer:**
    - Hours left badge (left)
    - Button "WA" (green, icon MessageCircle, right)
- Cards stacked, gap-3

### WA Button Behavior ⭐

- **Click:** Buka link WhatsApp dengan template pesan
- **URL Format:** `https://wa.me/62[phone_no_leading_zero]?text=[encoded_message]`
- **Template Pesan:**
  ```
  Halo [Nama Client],

  Ini reminder untuk sesi foto kamu di Yoonjaespace:
  📅 [Hari], [Tanggal] pukul [Jam]
  📦 Paket: [Package Name]
  📍 Yoonjaespace Studio

  Ditunggu ya! 😊

  Cek status booking kamu: [Status Link]
  ```
- **URL Encode:** Pakai `encodeURIComponent()` untuk encode message
- **Example:**
  - Client: Budi Santoso
  - Phone: 081234567890
  - Date: Sabtu, 15 Feb 2026
  - Time: 09:00
  - Package: Birthday Smash Cake
  - Status Link: https://yoonjaespace.com/status/YJS-20260215-001
  - **Generated URL:** `https://wa.me/6281234567890?text=Halo%20Budi%20Santoso...`

### Hours Left Calculation

- **Current Time:** Mock current time (contoh: 15 Feb 2026, 07:00)
- **Session Time:** Dari booking data
- **Calculate:** Difference in hours
- **Format:**
  - Jika < 1 jam: "30 menit lagi"
  - Jika >= 1 jam: "2 jam lagi", "5 jam lagi"
  - Jika sudah lewat: badge merah "Lewat" atau "Sedang berlangsung"

### Empty State

- Jika tidak ada reminders di tab: icon Calendar, teks "Tidak ada reminder untuk [Today/Tomorrow/...]", button "Lihat Semua Bookings"

### Data Mock

- 5-6 bookings dengan session date:
  - 2 bookings hari ini (berbagai jam: 1 sudah lewat, 1 upcoming dalam 2 jam, 1 upcoming dalam 6 jam)
  - 2 bookings besok
  - 2 bookings minggu ini
- Mock current time: 15 Feb 2026, 07:00 (atau sesuai dengan tanggal mock)

### Behavior

- **Tab Filter:** Filter bookings berdasarkan session date
  - Today: session date = hari ini
  - Tomorrow: session date = besok
  - This Week: session date dalam 7 hari ke depan
  - All: semua upcoming bookings
- **Sort:** Default by session datetime (earliest first)

```

---

## PROMPT 10 — Finance

```

Brief di bawah Buat menu Finance. oh ya berdasarkan brief saya sebelumnya, kita ini fokus ke frontend agar client suka dengan tampilannya. jadi jangan ada integrasi dengan backend dulu. semua data menggunakan dummy data. dan backend jangan di ubah, hapus, ataupun otak atik. tapi kita bisa analisis backend untuk tau fiturnya seperti apa. pastikan tampilannya estetik, clean, tata letak rapih.

⚠️ **PENTING - Analisis Project Terlebih Dahulu:**
Sebelum memulai implementasi, lakukan analisis project terlebih dahulu untuk mengecek apakah halaman/komponen ini sudah ada atau belum:
- **Jika SUDAH ADA:** Baca file yang ada, lalu revisi atau kembangkan sesuai instruksi prompting di bawah ini
- **Jika BELUM ADA:** Buat file baru sesuai dengan konsep tata letak folder frontend yang sudah dipakai di project ini

Lanjutkan project Yoonjaespace. Buat halaman finance summary dengan CRUD expenses dan export Excel feature.

## CRUD Operations untuk Finance:
- **READ:**
  - View income from bookings (paid only)
  - View all expenses
  - View summary stats
- **CREATE Expense:** Button "Add Expense" → modal form
- **UPDATE Expense:** Edit button per row → modal
- **DELETE Expense:** Delete button per row → confirm dialog
- **EXPORT:** Export to Excel (mock toast "Coming soon")

## Spesifikasi

### Header

- Judul "Finance" (icon Wallet)
- **Month Picker:** Select dropdown (Januari 2026, Februari 2026, dst)
- Button "Export Excel" (outline, icon Download) — mock: toast "Export feature coming soon"

### Section A — Summary Cards (3 Horizontal)

- **Card 1: Income**
  - Label: "Income" (text-sm gray)
  - Angka: "Rp 12.500.000" (text-3xl bold, text-green-600)
  - Icon: TrendingUp (bg-green-50, text-green-600)
  - Footer: "+8% dari bulan lalu" (text-xs green)
- **Card 2: Expenses**
  - Label: "Expenses" (text-sm gray)
  - Angka: "Rp 2.300.000" (text-3xl bold, text-red-600)
  - Icon: TrendingDown (bg-red-50, text-red-600)
  - Footer: "12 transaksi" (text-xs gray)
- **Card 3: Gross Profit**
  - Label: "Gross Profit" (text-sm gray)
  - Angka: "Rp 10.200.000" (text-3xl bold, text-blue-600)
  - Icon: DollarSign (bg-blue-50, text-blue-600)
  - Footer: "+12% dari bulan lalu" (text-xs blue)
- **Layout:** Grid 3 columns di desktop, stack di mobile
- **Card Style:** White bg, border, rounded-xl, p-5

### Section B — Income from Bookings

- **Heading:** "Income from Bookings" + badge count (contoh: "24 bookings")
- **Desktop Table:**
  | Booking ID | Client | Date | Package | Add-ons | Discount | Total | Payment |
  - **Booking ID:** Monospace, clickable → booking detail
  - **Add-ons:** Total add-ons Rp (text-sm gray) atau "-"
  - **Discount:** Rp (text-red-600) atau "-"
  - **Total:** Bold, text-green-600
  - **Payment:** Green badge "PAID" (only show paid bookings)
- **Mobile:** Card list
  - Header: Booking ID + Payment badge
  - Body: Client, Date, Package
  - Footer: Total (bold, green)
- **Filter:** Only show bookings with payment status PAID di bulan selected
- **Sort:** Default by date (newest first)

### Section C — Expenses

- **Heading:** "Expenses" + Button "+ Add Expense" (outline, icon Plus)
- **Filter Bar:**
  - Dropdown Category: All, Print Vendor, Packaging, Shipping, Operational, Salaries, Other
  - Date range (simple from-to)
  - Clear button
- **Desktop Table:**
  | Date | Description | Category | Amount | Related Booking | Actions |
  - **Date:** Format "15 Feb 2026" (text-sm)
  - **Category:** Colored badge:
    - Print Vendor: blue
    - Packaging: purple
    - Shipping: green
    - Operational: amber
    - Salaries: pink
    - Other: gray
  - **Amount:** Rp formatted, bold, text-red-600
  - **Related Booking:** Booking ID clickable (atau "-" jika tidak ada)
  - **Actions:**
    - Button Edit (icon Edit2, outline kecil)
    - Button Delete (icon Trash2, merah kecil)
- **Mobile:** Card list
  - Header: Description (bold) + Category badge
  - Body: Date, Amount (bold, red)
  - Footer: Related booking link (jika ada)
  - Actions: Dropdown menu
- **Total Row:** Di bawah table — "Total Expenses: Rp 2.300.000" (bold, text-lg)

### Section D — Expense Breakdown Chart

- **Heading:** "Expense Breakdown by Category"
- **Desktop:** Pie chart (recharts PieChart)
  - Labels: Category name + percentage
  - Colors: sesuai category badge colors
  - Legend di bawah atau samping
- **Mobile:** Horizontal bar chart atau stacked cards per category
  - Card per category: icon, nama, amount, percentage bar
- **Data:** Aggregate expenses per category dari mock

### Add/Edit Expense Modal (shadcn Dialog)

- **Form Fields:**
  - **Date:** Date picker (default hari ini)
  - **Description:** Text input (required, placeholder: "Contoh: Cetak foto client YJS-001")
  - **Amount:** Number input dengan prefix "Rp" (required, min 0)
  - **Category:** Select (required) — Print Vendor, Packaging, Shipping, Operational, Salaries, Other
  - **Related Booking:** Optional autocomplete — search booking ID atau client name
  - **Notes:** Textarea (optional)
  - **Receipt:** File upload (optional, mock only — tidak perlu implement upload logic)
- **Buttons:**
  - "Save" (primary maroon)
  - "Cancel" (outline)
- **Behavior:**
  - Mock: console.log data
  - Close modal
  - Update table (add/edit local state)
  - Toast success

### Delete Expense Confirmation

- Dialog: "Hapus expense '[Description]'?"
- Amount: tampilkan amount yang akan dihapus
- Buttons: "Cancel", "Delete" (merah)
- Behavior: Remove from list + toast

### Export Excel Feature (Mock)

- Button "Export Excel" di header
- Click → toast info "Export feature coming soon"
- (Backend sudah punya endpoint /api/finance/summary with export, tapi frontend-only mock dulu)

### Data Mock

- **Income:** 8-10 paid bookings di bulan selected dengan total Rp 12.500.000
- **Expenses:** 10-12 expenses dengan variasi:
  - Categories: mix semua category
  - Amounts: berbeda-beda (Rp 50.000 - Rp 500.000)
  - Related bookings: beberapa linked, beberapa tidak
  - Dates: scattered di bulan selected
- **Total Expenses:** Rp 2.300.000
- **Gross Profit:** Income - Expenses = Rp 10.200.000

```

---

## PROMPT 11 — Commissions

```

Brief di bawah Buat menu Commissions. oh ya berdasarkan brief saya sebelumnya, kita ini fokus ke frontend agar client suka dengan tampilannya. jadi jangan ada integrasi dengan backend dulu. semua data menggunakan dummy data. dan backend jangan di ubah, hapus, ataupun otak atik. tapi kita bisa analisis backend untuk tau fiturnya seperti apa. pastikan tampilannya estetik, clean, tata letak rapih.

⚠️ **PENTING - Analisis Project Terlebih Dahulu:**
Sebelum memulai implementasi, lakukan analisis project terlebih dahulu untuk mengecek apakah halaman/komponen ini sudah ada atau belum:
- **Jika SUDAH ADA:** Baca file yang ada, lalu revisi atau kembangkan sesuai instruksi prompting di bawah ini
- **Jika BELUM ADA:** Buat file baru sesuai dengan konsep tata letak folder frontend yang sudah dipakai di project ini

Lanjutkan project Yoonjaespace. Buat halaman commissions dengan MANUAL commission input (tidak ada formula otomatis).

## ⭐ CRITICAL: Manual Commission Input
- Owner **TIDAK** menggunakan formula otomatis
- Commission amount **di-input manual** oleh Owner
- System hanya tracking: staff handled bookings + manual commission amount
- Owner bebas tentukan berapa commission per staff

## CRUD Operations untuk Commissions:
- **READ:** View staff commission summary per period
- **UPDATE:** Edit commission amount (manual input) + notes
- **NO DELETE:** Commission history permanent

## Spesifikasi

### Header

- Judul "Staff Commissions" (icon Award)
- **Period Selector:**
  - Month picker (select: Januari, Februari, dst)
  - Year picker (select: 2024, 2025, 2026)
  - Layout: flex gap-2, inline

### Summary Cards (Desktop: Grid 2-3 columns, Mobile: Stack)

- **Setiap Card = 1 Staff:**
  - **Header:**
    - Avatar circle (initials, bg-maroon-light)
    - Staff name (bold, text-lg)
    - Role badge (colored):
      - OWNER: maroon
      - ADMIN: blue
      - PHOTOGRAPHER: amber
      - PACKAGING_STAFF: green
  - **Body Stats:**
    - Total Bookings Handled: "5 bookings" (text-sm gray, icon CalendarCheck)
    - Total Revenue Generated: "Rp 2.500.000" (text-base bold, text-green-600)
  - **Commission Section:**
    - Label: "Commission" (text-sm gray)
    - Amount Input: Number input dengan prefix "Rp" (editable, manual)
    - Notes: Text input (placeholder: "Catatan...", optional)
  - **Footer:**
    - Status: Paid (green badge) / Unpaid (red badge) — toggle switch
    - Button "Save" (primary maroon, kecil) — save commission amount + notes
  - **Click Card:** Expand detail view (atau navigate ke detail page)

### Staff Detail View (Expand atau Separate Page)

- **Heading:** "[Staff Name] — [Month Year]"
- **Stats Summary:**
  - Total Bookings: angka
  - Total Revenue: Rp formatted
  - Commission Amount: Rp (editable)
  - Status: Paid/Unpaid toggle
- **Bookings Handled Table:**
  | Booking ID | Client | Date | Package | Total | Status |
  - Filter: bookings handled by this staff di period selected
  - Click Booking ID → navigate ke booking detail
- **Commission Input Form:**
  - **Commission Amount:** Number input (Rp, required)
  - **Notes:** Textarea (optional, placeholder: "Contoh: Bonus untuk performa bagus bulan ini")
  - **Status:** Toggle Paid/Unpaid
  - Button "Save Commission" (primary)
- **Behavior:**
  - Mock: console.log data
  - Update card
  - Toast success
  - **Jika mark as Paid:** Optional — create expense entry otomatis di Finance (kategori: Salaries) — tapi ini optional, bisa skip dulu

### Mobile Card List

- Card per staff: simplified version
  - Avatar + name + role badge (header)
  - Stats: bookings + revenue (body)
  - Commission input: collapsed, tap "Edit Commission" → expand form
  - Save button (footer)

### Empty State

- Jika tidak ada staff (selain Owner): icon Users, teks "Belum ada staff", button "Tambah Staff" → navigate ke User Management

### Data Mock

- **3-4 Staff Users:**
  - Owner: tidak muncul di commission list (owner tidak dapat commission)
  - Admin: 5 bookings handled, revenue Rp 2.500.000, commission Rp 500.000 (manual), notes: "Bonus performa", status: Paid
  - Photographer: 3 bookings, revenue Rp 1.200.000, commission Rp 300.000, status: Unpaid
  - Packaging Staff: 2 bookings, revenue Rp 800.000, commission Rp 100.000, status: Unpaid
- **Period:** Februari 2026 (default current month)

### Behavior

- **Period Change:** Re-calculate total bookings & revenue per staff di period tersebut
- **Commission Amount:** ALWAYS manual input (tidak ada auto-calculate)
- **Save:** Update local state + toast
- **Paid Toggle:** Update status Paid/Unpaid

```

---

## PROMPT 12 — Settings

```

Brief di bawah Buat menu Settings. oh ya berdasarkan brief saya sebelumnya, kita ini fokus ke frontend agar client suka dengan tampilannya. jadi jangan ada integrasi dengan backend dulu. semua data menggunakan dummy data. dan backend jangan di ubah, hapus, ataupun otak atik. tapi kita bisa analisis backend untuk tau fiturnya seperti apa. pastikan tampilannya estetik, clean, tata letak rapih.

⚠️ **PENTING - Analisis Project Terlebih Dahulu:**
Sebelum memulai implementasi, lakukan analisis project terlebih dahulu untuk mengecek apakah halaman/komponen ini sudah ada atau belum:
- **Jika SUDAH ADA:** Baca file yang ada, lalu revisi atau kembangkan sesuai instruksi prompting di bawah ini
- **Jika BELUM ADA:** Buat file baru sesuai dengan konsep tata letak folder frontend yang sudah dipakai di project ini

Lanjutkan project Yoonjaespace. Buat halaman settings dengan CRUD untuk Packages, Backgrounds, Add-ons, Vouchers, Custom Fields.

## CRUD Operations untuk Settings:
- **Packages:** CREATE, READ, UPDATE, DELETE
- **Backgrounds:** CREATE, READ, UPDATE, DELETE
- **Add-on Templates:** CREATE, READ, UPDATE, DELETE
- **Vouchers:** CREATE, READ, UPDATE, DELETE
- **Custom Fields:** CREATE, READ, UPDATE, DELETE (dengan drag-reorder untuk sort)
- **Studio Info:** UPDATE only

## Spesifikasi

### Layout

- **Desktop:** Tab navigation horizontal di atas (shadcn Tabs)
- **Mobile:** Select dropdown untuk switch tab atau vertical list
- **Tabs:**
  1. General (Studio Info)
  2. Packages
  3. Backgrounds
  4. Add-on Templates
  5. Vouchers
  6. Custom Fields

---

### Tab 1 — General (Studio Info)

- **Heading:** "Studio Information"
- **Form Fields** (2 column di desktop, 1 column mobile):
  - Studio Name (text input)
  - Studio Address (textarea)
  - Studio Phone (tel input)
  - Studio Instagram (text input, placeholder: "@username")
  - Operating Hours:
    - Open Time (time select, default 09:00)
    - Close Time (time select, default 17:00)
  - Day Off (select: Senin-Minggu, default Selasa)
  - Default Payment Status (toggle switch: Unpaid / Paid)
- **Button:** "Save Changes" (primary maroon) — mock: toast success

---

### Tab 2 — Packages

- **Heading:** "Packages" + Button "+ Add Package" (primary)
- **Table:**
  | Name | Price | Duration | Max People | Edited Photos | All Photos | Active | Actions |
  - **Name:** Bold
  - **Price:** Rp formatted
  - **Duration:** "120 menit"
  - **Max People:** Angka + icon Users
  - **Edited Photos:** Angka (contoh: "20 foto")
  - **All Photos:** "Ya" / "Tidak" (badge atau text)
  - **Active:** Toggle switch (green/gray)
  - **Actions:**
    - Edit (icon Edit2, outline)
    - Delete (icon Trash2, merah) — confirm dialog
- **Mobile:** Card list

#### Add/Edit Package Dialog

- **Form Fields:**
  - Name (text input, required)
  - Description (textarea, optional)
  - Price (number input, Rp prefix, required)
  - Duration (number input, suffix "menit", required, placeholder: 120)
  - Max People (number input, required, min 1)
  - Edited Photos (number input, required, placeholder: 20)
  - All Photos (checkbox, default unchecked)
  - Active (toggle switch, default checked)
- **Buttons:** "Save" (primary), "Cancel" (outline)
- **Behavior:** Mock CRUD via local state

---

### Tab 3 — Backgrounds

- **Heading:** "Backgrounds" + Button "+ Add Background"
- **Table:**
  | Name | Description | Available | Actions |
  - **Name:** Bold
  - **Description:** Text-sm gray (truncate)
  - **Available:** Toggle switch
  - **Actions:** Edit, Delete
- **Mobile:** Card list

#### Add/Edit Background Dialog

- **Form Fields:**
  - Name (text input, required)
  - Description (textarea, optional)
  - Available (toggle switch, default checked)
- **Buttons:** "Save", "Cancel"

---

### Tab 4 — Add-on Templates

- **Heading:** "Add-on Templates" + Button "+ Add Template"
- **Table:**
  | Name | Default Price | Description | Active | Actions |
  - **Name:** Bold
  - **Default Price:** Rp formatted
  - **Description:** Text-sm gray (truncate)
  - **Active:** Toggle switch
  - **Actions:** Edit, Delete

#### Add/Edit Template Dialog

- **Form Fields:**
  - Name (text input, required, placeholder: "MUA", "Extra Person")
  - Default Price (number input, Rp prefix, required)
  - Description (textarea, optional)
  - Active (toggle switch, default checked)
- **Buttons:** "Save", "Cancel"

---

### Tab 5 — Vouchers

- **Heading:** "Vouchers" + Button "+ Add Voucher"
- **Table:**
  | Code | Type | Value | Min Purchase | Used/Max | Valid Period | Active | Actions |
  - **Code:** Uppercase, bold, monospace (contoh: "WELCOME10")
  - **Type:** Badge — "Percentage" (blue) / "Fixed" (green)
  - **Value:** "10%" atau "Rp 50.000"
  - **Min Purchase:** Rp formatted atau "-"
  - **Used/Max:** "5 / 50" format (contoh: "5 kali dipakai dari max 50")
  - **Valid Period:** "1 Feb - 31 Dec 2026" (text-sm)
  - **Active:** Toggle switch
  - **Actions:** Edit, Delete

#### Add/Edit Voucher Dialog

- **Form Fields:**
  - Code (text input, required, uppercase auto-transform, placeholder: "WELCOME10")
  - Description (text input, optional, placeholder: "Diskon untuk customer baru")
  - Type (select: Percentage / Fixed Amount, required)
  - Value (number input, required):
    - Jika Percentage: suffix "%", max 100
    - Jika Fixed: prefix "Rp"
  - Min Purchase (number input, Rp prefix, optional, placeholder: "Minimal transaksi")
  - Max Usage (number input, optional, placeholder: "Unlimited jika kosong")
  - Valid From (date picker, required)
  - Valid Until (date picker, required)
  - Active (toggle switch, default checked)
- **Buttons:** "Save", "Cancel"
- **Validation:** Valid Until harus >= Valid From

---

### Tab 6 — Custom Fields

- **Heading:** "Custom Fields" + Button "+ Add Field"
- **Note:** Custom fields untuk booking form (dynamic fields)
- **Table:**
  | Sort Order | Field Name | Type | Required | Active | Actions |
  - **Sort Order:** Drag handle (icon GripVertical) + number (editable atau drag-reorder)
  - **Field Name:** Bold
  - **Type:** Badge — "Text" / "Select" / "Checkbox" / "Number"
  - **Required:** Checkbox atau badge
  - **Active:** Toggle switch
  - **Actions:** Edit, Delete
- **Drag-Reorder:** Pakai library drag-and-drop (react-beautiful-dnd atau @dnd-kit) untuk reorder sort order

#### Add/Edit Custom Field Dialog

- **Form Fields:**
  - Field Name (text input, required, placeholder: "Tema Warna", "Request Pose")
  - Field Type (select: Text / Select / Checkbox / Number, required)
  - **Jika Type = Select:**
    - Options (textarea, comma-separated, placeholder: "Merah, Biru, Hijau")
  - Required (toggle switch, default unchecked)
  - Sort Order (number input, auto-increment, default tertinggi + 1)
  - Active (toggle switch, default checked)
- **Buttons:** "Save", "Cancel"

---

### Mobile UX

- Tables jadi card lists
- Dialogs jadi full-screen sheets atau modal
- Semua input touch-friendly (min height 44px)
- Toggle switches besar, easy tap

### Data Mock

- **Packages:** 4-5 packages (Birthday Smash Cake, Graduation, Family, LinkedIn, Pas Photo)
- **Backgrounds:** 4 backgrounds (Limbo, Spotlight, Mid-Century, Chrome)
- **Add-on Templates:** 3-4 templates (MUA, Extra Person, Cetak Foto, Frame)
- **Vouchers:** 2-3 vouchers (WELCOME10, BIRTHDAY20, dll)
- **Custom Fields:** 2-3 fields (Tema Warna, Request Pose, Bawa Props)

```

---

## PROMPT 13 — User Management

```

Brief di bawah Buat menu User Management. oh ya berdasarkan brief saya sebelumnya, kita ini fokus ke frontend agar client suka dengan tampilannya. jadi jangan ada integrasi dengan backend dulu. semua data menggunakan dummy data. dan backend jangan di ubah, hapus, ataupun otak atik. tapi kita bisa analisis backend untuk tau fiturnya seperti apa. pastikan tampilannya estetik, clean, tata letak rapih.

⚠️ **PENTING - Analisis Project Terlebih Dahulu:**
Sebelum memulai implementasi, lakukan analisis project terlebih dahulu untuk mengecek apakah halaman/komponen ini sudah ada atau belum:
- **Jika SUDAH ADA:** Baca file yang ada, lalu revisi atau kembangkan sesuai instruksi prompting di bawah ini
- **Jika BELUM ADA:** Buat file baru sesuai dengan konsep tata letak folder frontend yang sudah dipakai di project ini

Lanjutkan project Yoonjaespace. Buat halaman user management dengan CRUD users.

## CRUD Operations untuk Users:
- **CREATE:** Button "Add User" → modal form (tidak bisa create Owner)
- **READ:** List/table semua users
- **UPDATE:** Edit user → modal (nama, role, active status, reset password)
- **DELETE:** Delete button (tidak bisa delete Owner atau diri sendiri)

## Spesifikasi

### Header

- Judul "User Management" (icon ShieldCheck)
- Button "+ Add User" (primary maroon)

### Desktop Table (>= 768px)

- **Columns:**
  | Name | Email | Role | Status | Created | Actions |
- **Name:** Bold, dengan avatar circle (initials) di kiri
- **Email:** Text-sm gray
- **Role:** Colored badge:
  - OWNER: maroon, bold
  - ADMIN: blue
  - PHOTOGRAPHER: amber
  - PACKAGING_STAFF: green
- **Status:**
  - Active: green dot + "Active" text
  - Inactive: gray dot + "Inactive" text
- **Created:** Format tanggal "15 Feb 2026" (text-sm gray)
- **Actions:**
  - Button "Edit" (outline, icon Edit2)
  - Button "Delete" (merah, icon Trash2) — disabled jika Owner atau current user
- **Special Row — Owner:**
  - Highlight subtle (bg-maroon-50 atau border-maroon)
  - Badge "YOU" jika logged-in user = Owner
  - No delete button

### Mobile Card List (< 768px)

- Setiap user jadi card:
  - **Header:** Avatar + Name (bold) + Role badge
  - **Body:**
    - Email (icon Mail, text-sm)
    - Status indicator (dot + text)
    - Created date (text-xs gray)
  - **Footer:**
    - Button "Edit" (outline)
    - Button "Delete" (merah, conditional)
- Cards stacked, gap-3

### Add User Dialog

- **Heading:** "Add New User"
- **Form Fields:**
  - Name (text input, required)
  - Email (email input, required)
  - Phone (tel input, optional)
  - Password (password input, required, min 8 char, show/hide toggle)
  - Confirm Password (password input, required, must match)
  - Role (select: Admin, Photographer, Packaging Staff, **tidak ada Owner**)
  - Active (toggle switch, default checked)
- **Buttons:**
  - "Create User" (primary maroon)
  - "Cancel" (outline)
- **Validation:**
  - Email unique (check di mock data)
  - Password min 8 char
  - Confirm password match
- **Behavior:**
  - Mock: console.log data
  - Add to list (local state)
  - Close modal
  - Toast success "User berhasil ditambahkan"

### Edit User Dialog

- **Heading:** "Edit User — [Name]"
- **Form Fields:**
  - Name (editable)
  - Email (readonly, grayed out — email tidak bisa diubah)
  - Phone (editable)
  - Role (select dropdown — bisa ubah role)
  - Active (toggle switch)
  - **Reset Password Section:**
    - Checkbox "Reset password"
    - Jika checked → muncul new password field (password input, min 8 char, show/hide toggle)
- **Buttons:**
  - "Save Changes" (primary)
  - "Cancel" (outline)
- **Behavior:**
  - Mock: console.log data
  - Update list
  - Close modal
  - Toast success

### Delete User Confirmation

- **Dialog:** "Hapus user '[Name]'?"
- **Warning:**
  - "User akan dihapus permanent."
  - "Booking history yang di-handle user ini akan tetap ada."
  - Jika user = Owner: "Owner tidak bisa dihapus"
  - Jika user = current logged-in: "Anda tidak bisa menghapus akun sendiri"
- **Buttons:**
  - "Cancel" (outline)
  - "Delete" (merah) — disabled jika Owner atau current user
- **Behavior:**
  - Mock: remove from list
  - Toast success "User berhasil dihapus"

### Empty State

- Jika tidak ada users (selain Owner): icon Users, teks "Belum ada staff", button "Tambah User Pertama"

### Data Mock

- **Users:**
  - Owner Yoonjaespace (email: owner@yoonjaespace.com, role: OWNER, active, created: 1 Jan 2026)
  - Admin (email: admin@yoonjaespace.com, role: ADMIN, active)
  - Photographer (email: photo@yoonjaespace.com, role: PHOTOGRAPHER, active)
  - Packaging Staff (email: packing@yoonjaespace.com, role: PACKAGING_STAFF, inactive)

```

---

## PROMPT 14 — Invoice View

```

Brief di bawah Buat menu Invoice View. oh ya berdasarkan brief saya sebelumnya, kita ini fokus ke frontend agar client suka dengan tampilannya. jadi jangan ada integrasi dengan backend dulu. semua data menggunakan dummy data. dan backend jangan di ubah, hapus, ataupun otak atik. tapi kita bisa analisis backend untuk tau fiturnya seperti apa. pastikan tampilannya estetik, clean, tata letak rapih.

⚠️ **PENTING - Analisis Project Terlebih Dahulu:**
Sebelum memulai implementasi, lakukan analisis project terlebih dahulu untuk mengecek apakah halaman/komponen ini sudah ada atau belum:
- **Jika SUDAH ADA:** Baca file yang ada, lalu revisi atau kembangkan sesuai instruksi prompting di bawah ini
- **Jika BELUM ADA:** Buat file baru sesuai dengan konsep tata letak folder frontend yang sudah dipakai di project ini

Lanjutkan project Yoonjaespace. Buat halaman invoice dengan design professional & print-ready.

## Fitur:
- **View invoice** dari booking detail
- **Print invoice** (window.print)
- **Download PDF** (mock only)
- **Share invoice link** (copy to clipboard)

## Spesifikasi

### Layout

- **Clean Page:** Bisa tanpa sidebar (optional — atau tetap dalam dashboard layout tapi content centered)
- **Max-width:** 800px, centered
- **Background:** White
- **Padding:** Generous (p-8 desktop, p-4 mobile)
- **Print-friendly:** Hide action buttons saat print (@media print)

### Invoice Design (Professional & Estetik)

#### Header Section

- **Left:**
  - Logo image `/logo_yoonjae.png` (width 60px)
  - "Yoonjaespace" (Poppins bold, text-xl, maroon)
  - Alamat studio (text-xs, gray, multi-line)
  - Phone + Instagram (text-xs, gray)
- **Right:**
  - "INVOICE" (Poppins bold, text-4xl, maroon, uppercase)
  - Thin maroon line di bawah

#### Invoice Info Row

- **2 Columns:**
  - **Left:**
    - Invoice Number: "INV-20260215-001" (bold)
    - Date: "15 Februari 2026"
    - Booking Ref: "YJS-20260215-001" (clickable jika dalam dashboard)
  - **Right:**
    - Status: Paid badge (green) atau Unpaid badge (red)

#### Client Info Section

- **Label:** "Bill to:" (text-sm gray, uppercase)
- **Info:**
  - Nama client (bold, text-base)
  - Phone
  - Email
  - Alamat (jika ada)

#### Separator

- Thin maroon line (border-t, border-maroon)

### Items Table

- **Clean Table Design** (minimal borders):
  - **Header Row:**
    - Columns: # | Item | Qty | Price | Subtotal
    - Background: #F5ECEC (maroon light)
    - Text: bold, maroon
    - Padding: p-3
  - **Body Rows:**
    - Alternating bg: white / #FAFAFA
    - Package row
    - Add-on rows (each add-on = 1 row)
    - Discount row: text-red-600, italic, minus sign
  - **Footer Rows:**
    - Subtotal row
    - Discount row (jika ada, text-red)
    - **Total row:**
      - Border-top double (2px, maroon)
      - Text-lg, bold, maroon
      - Background: #F5ECEC subtle
- **Currency:** Rp format Indonesia (Rp 1.500.000 dengan separator titik)

### Payment Info (Optional)

- Jika partial payment:
  - Paid Amount: Rp xxx (green)
  - Outstanding: Rp xxx (red, bold)

### Footer Section

- **Thin maroon line** di atas footer
- **Studio Info:**
  - Nama studio, alamat, phone, Instagram (text-xs, centered, gray)
- **Thank You Message:**
  - "Thank you for choosing Yoonjaespace! 💕" (italic, text-sm, centered, maroon)

### Action Buttons (Hide saat print)

- **Fixed Bottom Bar** atau **Sticky Top** (choose one):
  - Button "Download PDF" (primary maroon, icon Download) — mock: toast "Coming soon"
  - Button "Print" (outline, icon Printer) — `window.print()`
  - Button "Back to Booking" (text link, icon ArrowLeft) — navigate back
- **@media print:** `display: none` semua action buttons

### Print Styles (@media print)

- Remove: action buttons, sidebar, header
- Margins: adjust untuk print (margin: 0.5in atau 1cm)
- Background colors: tetap (pastikan tidak hilang saat print)
- Page break: avoid break di tengah table row

### Mobile Responsive

- Font size adjust (lebih kecil di mobile)
- Table responsive: scroll horizontal jika perlu atau adjust columns
- Action buttons: stack vertikal di mobile

### Data

- Ambil dari mock booking by bookingId (dari URL param)
- Generate invoice number dari booking: `INV-${bookingCode}` atau `INV-${date}-${id}`
- Jika booking tidak ditemukan: 404 page atau redirect ke bookings

### Example Invoice:

```
┌─────────────────────────────────────────────────────────────┐
│ [LOGO]  Yoonjaespace                            INVOICE     │
│         Jl. Studio No. 123                                  │
│         Jakarta, Indonesia                                  │
│         +62 812-3456-7890 | @yoonjaespace                   │
├─────────────────────────────────────────────────────────────┤
│ Invoice #: INV-20260215-001        Status: [PAID]          │
│ Date: 15 Februari 2026                                      │
│ Booking Ref: YJS-20260215-001                               │
│                                                             │
│ BILL TO:                                                    │
│ Budi Santoso                                                │
│ +62 812-3456-7890                                           │
│ budi@email.com                                              │
├─────────────────────────────────────────────────────────────┤
│ #  Item                        Qty    Price      Subtotal  │
├─────────────────────────────────────────────────────────────┤
│ 1  Birthday Smash Cake         1      500.000    500.000   │
│ 2  MUA                         1      200.000    200.000   │
│ 3  Extra Person                2       50.000    100.000   │
│                                                             │
│                                       Subtotal:   800.000   │
│                                       Discount:   -80.000   │
│═════════════════════════════════════════════════════════════│
│                                       TOTAL:      720.000   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              Thank you for choosing Yoonjaespace! 💕        │
│                                                             │
│         Yoonjaespace Studio | @yoonjaespace                 │
└─────────────────────────────────────────────────────────────┘
```

```

---

## PROMPT 15 — Public Status Page

```

Brief di bawah Buat menu Public Status Page. oh ya berdasarkan brief saya sebelumnya, kita ini fokus ke frontend agar client suka dengan tampilannya. jadi jangan ada integrasi dengan backend dulu. semua data menggunakan dummy data. dan backend jangan di ubah, hapus, ataupun otak atik. tapi kita bisa analisis backend untuk tau fiturnya seperti apa. pastikan tampilannya estetik, clean, tata letak rapih.

⚠️ **PENTING - Analisis Project Terlebih Dahulu:**
Sebelum memulai implementasi, lakukan analisis project terlebih dahulu untuk mengecek apakah halaman/komponen ini sudah ada atau belum:
- **Jika SUDAH ADA:** Baca file yang ada, lalu revisi atau kembangkan sesuai instruksi prompting di bawah ini
- **Jika BELUM ADA:** Buat file baru sesuai dengan konsep tata letak folder frontend yang sudah dipakai di project ini

Lanjutkan project Yoonjaespace. Buat public status page untuk client (tanpa login).

## ⭐ CRITICAL FEATURES:
- **No Login Required:** Public page, accessible via shareable link
- **Mobile-First:** Mayoritas client buka dari WA di HP
- **GDrive Link:** Tampilkan link download foto (jika sudah upload)
- **Invoice Download:** Tampilkan button download invoice (jika sudah generate)
- **Empty States:** Friendly message jika belum ada link/invoice

## Spesifikasi

### URL Format

- `/status/[slug]` — slug = booking ID atau custom slug
- Contoh: `/status/YJS-20260215-001`

### Design Philosophy

- **Standalone page:** Tanpa sidebar, tanpa auth
- **Mobile-first:** Optimal untuk dibuka di HP
- **Background:** Gradient subtle white ke #FFF5F5 (warm tint)
- **Layout:** Single column, centered, max-width 480px
- **Card-based sections:** Rounded-2xl, shadow-sm, bg-white

### Section 1 — Header

- **Logo:** Image `/logo_yoonjae.png` (center, width 80px)
- **Studio Name:** "Yoonjaespace" (Poppins bold, text-xl, maroon, center)
- **Thin maroon divider**

### Section 2 — Greeting

- **Message:** "Hi, [Nama Client]! 👋" (text-xl, semibold, center)
- **Booking Code:** "YJS-20260215-001" (monospace, text-sm, bg-gray-100 rounded-full px-3 py-1, center)

### Section 3 — Status Timeline (Vertikal, Mobile-Optimized)

- **Visual Stepper Vertikal:**
  - Setiap step: Circle icon (kiri) + Label + Timestamp (kanan)
  - **Completed Step:**
    - Filled circle maroon
    - Line maroon (connect ke next step)
    - Label bold, text-maroon
    - Timestamp kecil (text-xs gray) — "15 Feb 2026, 10:00"
  - **Current Step:**
    - Circle maroon dengan ring/pulse animation
    - Label bold maroon
    - No timestamp yet
  - **Future Step:**
    - Circle gray outline
    - Line gray dashed
    - Label gray
- **Basic Flow Steps:**
  1. Booked (icon CalendarCheck)
  2. Paid (icon CreditCard)
  3. Shoot Done (icon Camera)
  4. Photos Delivered (icon Image) — **tampilkan GDrive link button jika ada**
  5. Closed (icon CheckCircle)
- **Jika Print Order Exists:**
  - Tambahan steps setelah Photos Delivered:
    6. Waiting Photo Selection
    7. Sent to Print Vendor
    8. Printing
    9. Packaging
    10. Shipped (tampilkan kurir + no resi jika ada)
    11. Completed

### Section 4 — Photo Delivery Section ⭐

- **Show:** Jika status >= PHOTOS_DELIVERED
- **Card:** Rounded-xl, border, bg-white, p-5
- **Heading:** "Your Photos" (icon Image)
- **Jika sudah ada GDrive link:**
  - Button "View Your Photos" (primary maroon, full width, icon ExternalLink)
  - Link: buka GDrive di new tab
  - Note: "Foto kamu sudah siap! Klik button di atas untuk melihat." (text-sm green)
- **Jika belum ada GDrive link:**
  - Empty state icon Image (gray, large)
  - Message: "Foto kamu sedang dalam proses editing. Kami akan update segera!" (text-sm gray, center)

### Section 5 — Invoice Section ⭐

- **Show:** Always (even if not generated yet)
- **Card:** Rounded-xl, border, bg-white, p-5
- **Heading:** "Invoice" (icon FileText)
- **Jika sudah generate invoice:**
  - Button "Download Invoice" (outline, full width, icon Download)
  - Link: download PDF atau navigate ke invoice page
  - Note: "Invoice kamu tersedia untuk di-download." (text-sm gray)
- **Jika belum generate:**
  - Empty state icon FileText (gray, large)
  - Message: "Invoice akan tersedia setelah pembayaran dikonfirmasi." (text-sm gray, center)

### Section 6 — Booking Details Card

- **Card:** Rounded-xl, border, bg-white, p-5
- **Heading:** "Booking Details" (icon CalendarCheck)
- **Info:**
  - Tanggal: "Sabtu, 15 Februari 2026" (icon Calendar)
  - Jam: "09:00 - 11:00" (icon Clock)
  - Paket: "Birthday Smash Cake Session" (icon Package)
  - Jumlah Orang: "1 orang" (icon Users)
  - **Jika ada Print Order:**
    - Print Status: badge (contoh: "Sedang dicetak")
    - Kurir: "JNE" (icon Truck) — jika sudah shipped
    - No Resi: "JNE123456789" (monospace, copyable) — jika sudah shipped

### Section 7 — Studio Info Card

- **Card:** Rounded-xl, border, bg-gray-50, p-5
- **Heading:** "Yoonjaespace Studio" (icon Home)
- **Info:**
  - Alamat: "Jl. Studio No. 123, Jakarta" (icon MapPin)
  - Jam Operasional: "09:00 - 17:00 (Selasa libur)" (icon Clock)
  - Instagram: "@yoonjaespace" (clickable, icon Instagram)
  - WhatsApp: "+62 812-3456-7890" (clickable, icon Phone, buka WA)

### Section 8 — Footer

- **Message:** "Thank you for choosing Yoonjaespace! 💕" (text-sm, italic, center, maroon)
- **Button:** "Book Again" (primary maroon, full width, icon MessageCircle)
  - Link: buka WA studio dengan pre-filled message "Halo, saya ingin booking lagi!"
- **Social Media Icons Row:**
  - Instagram icon (clickable)
  - (Optional: Facebook, TikTok jika ada)
- **Copyright:** "© 2026 Yoonjaespace Studio" (text-xs gray, center)

### Mobile UX

- All sections stacked
- Full width cards dengan padding horizontal 16px
- Touch-friendly buttons (min height 44px)
- Large font sizes (text-base minimum)
- Generous spacing (gap-6)

### Empty States (Important!)

- **GDrive link belum ada:** Friendly message dengan icon (tidak error, hanya info)
- **Invoice belum ada:** Friendly message dengan icon
- **Print tracking belum ada:** Hide section atau empty message

### Data Mock

- Ambil dari mock booking by slug (booking ID)
- Jika slug tidak ditemukan:
  - 404-style page
  - Heading: "Booking Not Found"
  - Message: "Booking dengan kode tersebut tidak ditemukan. Pastikan link yang kamu buka benar."
  - Button: "Contact Us" (buka WA studio)

### Security Note (Frontend-only)

- Untuk frontend-only mock: tidak perlu auth/validation
- Nanti di production: backend akan validasi slug/ID dan ensure public access

```

---

## Tips Menjalankan Prompts di Claude Code

1. **Jalankan Prompt 0 dulu** — ini setup seluruh fondasi project
2. **Prompt 1-3 berurutan** — Login → Layout → Dashboard (karena saling depend)
3. **Prompt 4-6 berurutan** — Bookings flow (List → Create → Detail)
4. **Prompt 7-15 bisa paralel** — tapi pastikan layout sudah jadi dulu (Prompt 2)
5. **Setiap selesai 1 prompt**, test `npm run dev` dan cek visual di browser
6. **Jika ada error**, paste error message ke Claude Code dan minta fix
7. **Jika ada komponen shared yang belum dibuat**, Claude Code akan auto-create — tapi kalau bentrok, arahkan ke file yang sudah ada

---

## Catatan Penting

- **⛔ JANGAN SENTUH BACKEND** — src/app/api/, src/middleware.ts, src/schemas/, prisma/, src/types/, src/utils/ yang sudah ada JANGAN dihapus/dimodify. Hanya TAMBAH file baru.
- **Semua data mock** — tidak ada API calls, tidak ada database connection. Nanti setelah UI jadi, baru wiring ke backend yang sudah exist.
- **Bahasa UI:** Mix Indonesia-English (label Indonesia, technical terms English) sesuai konteks studio foto lokal
- **Currency:** Selalu format "Rp X.XXX.XXX" (titik sebagai separator ribuan)
- **Date format:** "15 Februari 2026" atau "15 Feb 2026" (bulan Indonesia)
- **Warna maroon konsisten:** #7A1F1F sebagai primary di seluruh app
- **Font Poppins konsisten:** Semua text, jangan mix font lain
- **Mobile-first:** Setiap komponen harus di-test di viewport 375px (iPhone SE) dan 390px (iPhone 14)
- **Jika ada konflik** dengan file existing, TANYAKAN dulu sebelum overwrite
```
