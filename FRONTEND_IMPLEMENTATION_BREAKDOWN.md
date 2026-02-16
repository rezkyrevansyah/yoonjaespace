# Yoonjaespace Frontend Implementation Breakdown

## 📊 **Backend Analysis - Existing APIs**

### ✅ **Backend APIs yang Sudah Ada:**

1. **Auth** - Login, Logout, Get Current User
2. **Bookings** - CRUD + Status Update + Print Tracking
3. **Clients** - CRUD
4. **Packages** - CRUD
5. **Backgrounds** - CRUD
6. **Add-on Templates** - CRUD
7. **Vouchers** - CRUD + Validate
8. **Custom Fields** - CRUD
9. **Users** - CRUD (User Management)
10. **Finance** - Expenses CRUD + Summary + Export Excel
11. **Commissions** - Get Summary per Staff
12. **Reminders** - List Reminders
13. **Invoices** - Generate Invoice PDF
14. **Dashboard** - Dashboard Stats
15. **Settings** - Studio Settings
16. **Status** - Public Client Status Page

---

## 🎯 **Frontend Features - Implementation Status**

### ✅ **Sudah Terimplementasi:**
- [x] Login Page
- [x] Dashboard (Main Overview)
- [x] Sidebar & Navigation
- [x] Mobile Hamburger Menu
- [x] Auth Context & Session Management
- [x] Logout Functionality

### ❌ **Belum Terimplementasi (PRIORITY):**

---

## 📋 **Menu yang Harus Dibuat**

### **1. BOOKINGS / ORDERS** 🎫

#### **1.1. Bookings List Page**
**Path**: `/dashboard/bookings`

**Features**:
- [ ] Table view (desktop) + Card view (mobile)
- [ ] Columns: Booking Code, Client Name, Date, Package, Status, Payment Status, Total
- [ ] Search bar (by nama, nomor WA, booking code)
- [ ] Filter by status (Booked, Paid, Shoot Done, dll)
- [ ] Filter by date range
- [ ] Sort by date, total, status
- [ ] Pagination
- [ ] Click row → navigate to detail

**Actions**:
- [ ] Button "New Booking" → navigate to `/dashboard/bookings/new`
- [ ] Each row clickable → detail page

---

#### **1.2. Create Booking Page** ⭐ **CRITICAL**
**Path**: `/dashboard/bookings/new`

**Features**:
- [ ] **Client Input Section** (INLINE - bukan dropdown!)
  - Search bar: "Cari nama atau nomor WA..."
  - Live search saat ketik (debounced)
  - Hasil search menampilkan: Nama + Nomor WA
  - Jika ditemukan: auto-fill form client dengan data existing
  - Jika tidak ditemukan: form kosong untuk input client baru
  - Fields client:
    - Nama (required)
    - Nomor WA (required)
    - Email (optional)
    - Instagram (optional)
    - Alamat (optional)

- [ ] **Booking Details Section**
  - Tanggal Sesi (date picker)
  - Waktu Sesi (time picker or dropdown)
  - Package (dropdown - dari backend packages)
  - Background (dropdown - dari backend backgrounds)
  - Jumlah Orang (number input)
  - Photo For (text input - e.g. "1st Birthday", "Graduation")
  - BTS Video (checkbox yes/no)
  - Notes (textarea)

- [ ] **Add-ons Section**
  - Button "Add Item"
  - Table: Nama Add-on, Qty, Unit Price, Subtotal
  - Bisa pilih dari template atau input manual
  - Auto calculate total

- [ ] **Discount/Voucher Section** (optional)
  - Input voucher code (text)
  - Input discount manual (Rp atau %)
  - Display discount di summary

- [ ] **Staff Handling** (for commission tracking)
  - Dropdown: Pilih staff yang handle booking ini
  - Default: Current logged-in user

- [ ] **Price Summary**
  - Package Price
  - Add-ons Total
  - Subtotal
  - Discount
  - **Grand Total**

- [ ] **Actions**
  - Button "Save as Booked" (default status)
  - Button "Save as Paid" (jika langsung bayar)
  - Button "Cancel"

**After Submit**:
- Redirect to booking detail page
- Show toast: "Booking berhasil dibuat! Order ID: YJS-20260216-001"
- Copy status link button

---

#### **1.3. Booking Detail Page** ⭐ **CRITICAL**
**Path**: `/dashboard/bookings/[id]`

**Sections**:

**A. Header**
- Booking Code (large, bold)
- Status Badge (current status)
- Payment Status Badge
- Dropdown Actions: "Edit", "Delete", "Copy Status Link"

**B. Client Info Card**
- Nama, WA, Email, Instagram
- Total Bookings dari client ini
- Button "Lihat Profil Client"

**C. Booking Details Card**
- Tanggal & Waktu Sesi
- Package Name
- Background
- Jumlah Orang
- Photo For
- BTS Video
- Notes
- Staff yang Handle

**D. Add-ons Section**
- Table: Item, Qty, Price, Subtotal
- Button "Add Item" (bisa tambah add-on setelah booking)
- Edit/Delete add-on

**E. Price Summary Card**
- Package Price
- Add-ons Total
- Discount
- **Grand Total**
- **Paid Amount**
- **Outstanding** (jika belum lunas)

**F. Status Management** ⭐
- Timeline/Tracker visual
- Buttons untuk change status:
  - "Mark as Paid" (Booked → Paid)
  - "Mark as Shoot Done" (Paid → Shoot Done)
  - "Mark as Photos Delivered" (Shoot Done → Photos Delivered)
  - "Close Order" (Photos Delivered → Closed)
  - "Cancel Order" (any → Cancelled)

**G. Photo Delivery Section**
- Input GDrive Link (text field)
- Button "Save Link"
- Display current link jika sudah ada
- Button "Mark as Photos Delivered" (otomatis update status)

**H. Print/Canvas Tracking** (if applicable)
- Checkbox: "Order ini ada cetak/canvas?"
- Jika yes, show print status tracker:
  - Status dropdown: Waiting Selection, Sent to Vendor, Print Received, Packaging, Shipped, Completed
  - Vendor Name (text input)
  - Tracking Number (text input)
  - Selected Photos Link/Notes (textarea)
- Button "Update Print Status"

**I. Invoice Section**
- Button "Generate Invoice" → download PDF
- Button "View Invoice" (jika sudah generate)
- Button "Copy Invoice Link" (shareable link)

**J. Activity Log** (optional - nice to have)
- History perubahan status
- Who changed, when, from → to

---

#### **1.4. Edit Booking Page**
**Path**: `/dashboard/bookings/[id]/edit`

**Features**:
- Same form as Create Booking
- Pre-filled with existing data
- Client section: show current client, bisa search untuk ganti
- Save button: "Update Booking"

---

### **2. CLIENTS** 👥

#### **2.1. Clients List Page**
**Path**: `/dashboard/clients`

**Features**:
- [ ] Table view: Nama, WA, Email, Total Bookings, Last Booking Date
- [ ] Search by name, WA, email
- [ ] Sort by name, total bookings, last booking
- [ ] Click row → client detail

**Actions**:
- [ ] Button "Add Client" → modal atau page
- [ ] Each row: Edit, Delete icons

---

#### **2.2. Client Detail Page**
**Path**: `/dashboard/clients/[id]`

**Features**:
- [ ] Client info card (editable)
- [ ] Booking history table (semua bookings dari client ini)
- [ ] Stats: Total Bookings, Total Spent, Average Order Value
- [ ] Button "New Booking for This Client"

---

### **3. PACKAGES** 📦

#### **3.1. Packages List Page**
**Path**: `/dashboard/settings/packages` (atau `/dashboard/packages`)

**Features**:
- [ ] Card grid view
- [ ] Each card: Nama, Price, Duration, Capacity, Active/Inactive
- [ ] Toggle active/inactive
- [ ] Search, Filter (active/inactive)

**Actions**:
- [ ] Button "Add Package"
- [ ] Each card: Edit, Delete icons

#### **3.2. Create/Edit Package Modal/Page**

**Fields**:
- Nama Package
- Description
- Price (Rp)
- Duration (minutes)
- Max People
- Edited Photos (number)
- All Photos (checkbox)
- Active (checkbox)

---

### **4. BACKGROUNDS** 🎨

**Path**: `/dashboard/settings/backgrounds`

**Similar to Packages**:
- List/grid view
- CRUD operations
- Fields: Name, Description, Available (checkbox)

---

### **5. ADD-ON TEMPLATES** 🛠️

**Path**: `/dashboard/settings/addon-templates`

**Fields**:
- Name
- Default Price
- Description
- Active (checkbox)

---

### **6. VOUCHERS** 🎟️

**Path**: `/dashboard/settings/vouchers`

**Features**:
- List view with filters (active/expired)
- Fields:
  - Code
  - Discount Type (Percentage / Fixed)
  - Discount Value
  - Min Purchase
  - Max Uses / Used Count
  - Valid From - Valid Until
  - Active (checkbox)

---

### **7. CUSTOM FIELDS** ⚙️

**Path**: `/dashboard/settings/custom-fields`

**Features**:
- List of custom fields untuk booking form
- CRUD operations
- Fields:
  - Field Name
  - Field Type (Text, Dropdown, Checkbox, Number)
  - Options (jika dropdown)
  - Required (checkbox)
  - Active (checkbox)

---

### **8. USERS / USER MANAGEMENT** 👤

**Path**: `/dashboard/users`

**Features**:
- Table: Name, Email, Role, Status (Active/Inactive)
- Filter by role
- Search by name, email

**Actions**:
- Button "Add User"
- Each row: Edit, Delete, Toggle Active/Inactive

**Create/Edit User Modal**:
- Name
- Email
- Phone
- Role (dropdown: Owner, Admin, Photographer, Packaging Staff)
- Password (only when creating)
- Active (checkbox)

---

### **9. FINANCE** 💰

#### **9.1. Finance Summary Page**
**Path**: `/dashboard/finance`

**Sections**:
- **Monthly Stats Cards**:
  - Total Income (dari paid bookings)
  - Total Expenses
  - Gross Profit
  - Net Profit (Income - Expenses - Commissions)

- **Chart**: Income vs Expense (bar chart, 6 bulan terakhir)

- **Recent Expenses** (latest 10)

**Actions**:
- Button "Export to Excel" (download semua data finance)
- Button "Add Expense"

---

#### **9.2. Expenses Page**
**Path**: `/dashboard/finance/expenses`

**Features**:
- Table: Date, Description, Category, Amount, Linked Order
- Filter by category, date range
- Search

**Actions**:
- Button "Add Expense"
- Each row: Edit, Delete

**Add/Edit Expense Modal**:
- Date
- Description
- Amount (Rp)
- Category (dropdown: Print Vendor, Packaging, Shipping, Operational, Salaries, Other)
- Linked to Order (optional - search booking)
- Receipt (file upload - optional)

**Export Feature**:
- Button "Export to Excel"
- Download .xlsx dengan semua expense data

---

### **10. COMMISSIONS** 🏆

**Path**: `/dashboard/commissions`

**Features**:
- **Period Selector** (bulan & tahun)
- **Staff Cards Grid**:
  - Each card:
    - Staff Name & Role
    - Total Bookings Handled (bulan ini)
    - Total Revenue Generated
    - Commission Amount (manual input - editable)
    - Status: Paid / Unpaid (toggle)
  - Click card → detail view

**Staff Detail View**:
- List semua bookings yang di-handle staff ini (periode selected)
- Table: Booking Code, Client, Date, Total
- Input manual: Commission Amount (Rp)
- Notes (textarea)
- Button "Mark Commission as Paid"

**Integration**:
- Commission yang sudah di-mark as Paid → masuk ke Finance sebagai Expense (kategori: Salaries)

---

### **11. REMINDERS** 🔔

**Path**: `/dashboard/reminders`

**Features**:
- List view: semua bookings dengan sesi hari ini atau upcoming
- Table: Booking Code, Client Name, WA, Time, Status
- Filters: Today, Tomorrow, This Week

**Actions per Row**:
- **Button "Send Reminder"**:
  - Generate WA link: `https://wa.me/628123456789?text=Halo [Nama], reminder untuk sesi foto kamu hari ini jam [Jam] di Yoonjaespace. Cek status booking kamu: [Status Link]. Ditunggu ya!`
  - Auto-copy link atau open in new tab

---

### **12. CALENDAR** 📅

**Path**: `/dashboard/calendar`

**Features**:
- **Monthly View**:
  - Calendar grid
  - Bookings muncul sebagai colored dots atau bars
  - Click date → show bookings hari itu

- **Daily View**:
  - Timeline view (jam 08:00 - 20:00)
  - Bookings ditampilkan sesuai time slot
  - Click booking → detail

**Filters**:
- View by: Month, Week, Day
- Filter by status

---

### **13. SETTINGS** ⚙️

**Path**: `/dashboard/settings`

**Tabs/Sections**:

1. **Studio Info**:
   - Studio Name
   - Address
   - Phone
   - Email
   - Instagram
   - Operating Hours (per hari)
   - Holiday List

2. **Booking Settings**:
   - Default Payment Status (Paid / Unpaid)
   - Auto-generate Booking Code Format
   - Time Slot Interval (30min, 60min, dll)

3. **Packages** → link to packages page
4. **Backgrounds** → link to backgrounds page
5. **Add-on Templates** → link to addon-templates page
6. **Vouchers** → link to vouchers page
7. **Custom Fields** → link to custom fields page

---

### **14. CLIENT STATUS PAGE** 🌐 (PUBLIC)

**Path**: `/status/[bookingId]`

**Features** (tanpa login):

**A. Header**:
- Logo Yoonjaespace
- Booking Code (large)
- Client Name

**B. Status Tracker**:
- Visual progress bar/timeline:
  - Booked ✓
  - Paid ✓
  - Shoot Done ⏳
  - Photos Delivered
  - Closed

**C. Booking Details Card**:
- Tanggal & Waktu Sesi
- Package Name
- Background
- Notes

**D. Photo Delivery Section**:
- **Jika sudah ada link GDrive**:
  - Button "View Your Photos" → link ke GDrive
- **Jika belum**:
  - Empty state: "Foto kamu sedang dalam proses editing. Kami akan update segera!"

**E. Invoice Section**:
- **Jika sudah generate**:
  - Button "Download Invoice" → download PDF
- **Jika belum**:
  - Empty state: "Invoice akan tersedia setelah pembayaran dikonfirmasi"

**F. Print/Canvas Tracking** (jika ada):
- Sub-status: "Sedang dicetak di vendor"
- Tracking number (jika ada)

**G. Studio Info Footer**:
- Alamat, Jam Buka
- Social Icons (Instagram, WA)
- Button "Book Again" → WA link

**H. Branding**:
- Powered by Yoonjaespace
- © 2026 Yoonjaespace Studio

---

## 🎨 **Design Guidelines untuk Semua Pages**

### **Konsistensi**:
- Brand color: Maroon (#7A1F1F)
- Font: Poppins
- Spacing: gap-6 untuk sections, gap-4 untuk cards
- Border radius: rounded-xl untuk cards, rounded-lg untuk buttons
- Shadows: shadow-sm untuk hover, shadow-lg untuk cards

### **Responsive**:
- Desktop: Table view
- Tablet: Responsive grid
- Mobile: Card view, stacked layout

### **Empty States**:
- Icon + Text yang friendly
- "Belum ada data. Tambahkan sekarang!"

### **Loading States**:
- Skeleton loaders
- Spinner untuk actions

### **Error States**:
- Toast notifications (error, success, info)
- Inline validation errors

---

## 📌 **Implementation Priority**

### **Phase 1 - Core Booking Flow** (MUST HAVE):
1. ✅ Dashboard (done)
2. 🔴 Bookings List
3. 🔴 Create Booking (dengan inline client search)
4. 🔴 Booking Detail (dengan status update)
5. 🔴 Client List & Detail
6. 🔴 Reminders (dengan WA link)

### **Phase 2 - Management** (SHOULD HAVE):
7. 🟡 Packages CRUD
8. 🟡 Backgrounds CRUD
9. 🟡 Add-on Templates CRUD
10. 🟡 Finance Summary & Expenses
11. 🟡 Calendar View
12. 🟡 Users Management

### **Phase 3 - Advanced** (NICE TO HAVE):
13. 🟢 Vouchers CRUD
14. 🟢 Custom Fields
15. 🟢 Commissions Management
16. 🟢 Invoice Generation
17. 🟢 Client Status Page (Public)
18. 🟢 Export to Excel
19. 🟢 Settings Page

---

## 🚀 **Next Steps**

1. Start with **Bookings List Page**
2. Then **Create Booking Page** (most complex!)
3. Then **Booking Detail Page** (with status update)
4. Continue with other CRUD pages

**All dummy data, no backend integration yet!**

---

**Note**: Semua ini **frontend-only** dengan **dummy data**. Backend sudah ada dan siap, tapi kita fokus dulu bikin UI/UX yang **estetik, clean, dan rapih** agar client suka tampilannya! 🎨
