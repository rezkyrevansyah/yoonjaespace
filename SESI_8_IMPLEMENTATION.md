# SESI 8 - User Management & Client Export Implementation

## ✅ Fitur yang Telah Diimplementasikan

### 1. **Custom Roles & Dynamic Menu Permissions**

#### Database Schema
- **CustomRole Table**: Menyimpan role custom dengan nama, deskripsi, dan flag isSystem
- **Menu Table**: Menyimpan daftar menu yang tersedia (Dashboard, Bookings, Clients, dll.)
- **RolePermission Table**: Relasi many-to-many antara Role dan Menu dengan permissions (canView, canEdit, canDelete)
- **User.customRoleId**: Foreign key ke CustomRole (optional, backward compatible dengan enum Role)

#### Migration
File: `prisma/migrations/20260221_add_custom_roles/migration.sql`
- Membuat 3 tabel baru (custom_roles, menus, role_permissions)
- Insert 11 menu default (dashboard, bookings, clients, calendar, reminders, finance, commissions, users, roles, activities, settings)
- Insert 4 system roles (Owner, Admin, Photographer, Packaging Staff) dengan permissions default
- Migrasi existing users ke custom roles

#### API Endpoints
1. **GET /api/roles** - List semua roles dengan permissions
2. **POST /api/roles** - Create role baru
3. **GET /api/roles/[id]** - Get detail role
4. **PATCH /api/roles/[id]** - Update role (nama, deskripsi, permissions)
5. **DELETE /api/roles/[id]** - Delete role (tidak bisa delete system role atau role yang masih digunakan)
6. **GET /api/menus** - List semua menu yang tersedia
7. **GET /api/permissions** - Get permissions user yang sedang login

#### Frontend Components
1. **Role Management Page** (`/dashboard/roles`)
   - Grid view semua roles
   - Modal untuk Add/Edit/Delete role
   - Checkbox matrix untuk set permissions per menu (View, Edit, Delete)
   - System roles diberi badge dan tidak bisa dihapus
   - Role yang masih digunakan user tidak bisa dihapus

2. **Dynamic Sidebar** (`src/components/layout/sidebar.tsx`)
   - Menggunakan hook `usePermissions()` untuk fetch menu permissions user
   - Menu muncul/hilang otomatis sesuai canView permission
   - Fallback ke enum Role jika user belum punya customRole

3. **Hooks**
   - `useRoles()` - CRUD operations untuk role management
   - `useMenus()` - Fetch available menus
   - `usePermissions()` - Get user's menu permissions + helper functions

#### Fitur Utama
✅ Owner bisa buat role baru dengan nama custom
✅ Owner bisa tentukan menu mana saja yang bisa diakses role tersebut
✅ Permission level: View, Edit, Delete per menu
✅ Role yang sudah ada bisa diedit (nama, deskripsi, permissions)
✅ Sidebar menu muncul/hilang secara dinamis sesuai role
✅ System roles (Owner, Admin, Photographer, Packaging) tidak bisa dihapus
✅ Role yang masih digunakan user tidak bisa dihapus
✅ Backward compatible dengan existing enum Role

---

### 2. **Client Data Export (CSV & Excel)**

#### Library
- **xlsx** - Sudah terinstall untuk Excel export
- **Native JavaScript** - Untuk CSV export (tidak perlu library tambahan)

#### Frontend Implementation
File: `src/app/dashboard/clients/page.tsx`

**Fitur:**
1. **Export Dropdown Button** di header Clients page
2. **Export to CSV**
   - Format: UTF-8 with BOM (support Indonesian characters)
   - Columns: Nama, No. WhatsApp, Email, Instagram, Alamat, Total Bookings, Total Spent, Last Visit, Catatan
   - Filename: `clients_YYYY-MM-DD.csv`

3. **Export to Excel**
   - Format: .xlsx
   - Auto column widths untuk readability
   - Same columns as CSV
   - Filename: `clients_YYYY-MM-DD.xlsx`

**UI:**
- Dropdown menu dengan hover effect
- Icons untuk distinguish CSV vs Excel
- Disabled state ketika tidak ada data
- Toast notification setelah export berhasil

#### Data yang Diexport
```
Nama | No. WhatsApp | Email | Instagram | Alamat | Total Bookings | Total Spent | Last Visit | Catatan
```

---

## 📋 Cara Testing

### 1. Restart Development Server
```bash
# Stop current dev server (Ctrl+C)
npm run dev
```

### 2. Run Migration
```bash
npx prisma db push --accept-data-loss
npx prisma generate
```

### 3. Test Custom Roles
1. Login sebagai Owner
2. Buka `/dashboard/roles`
3. Klik "Add Role" untuk buat role baru (misalnya "Marketing Staff")
4. Pilih menu yang bisa diakses:
   - ✅ Dashboard (View)
   - ✅ Clients (View, Edit)
   - ✅ Bookings (View)
5. Save role baru
6. Edit role: ubah permissions atau nama
7. Coba delete role (pastikan tidak ada user yang menggunakan role tersebut)

### 4. Test Dynamic Menu
1. Buat user baru di `/dashboard/users` dengan role custom
2. Logout dan login dengan user tersebut
3. Sidebar hanya menampilkan menu yang diberi permission
4. Menu yang tidak ada permission sama sekali **tidak muncul**

### 5. Test Client Export
1. Buka `/dashboard/clients`
2. Klik dropdown "Export"
3. Pilih "Export sebagai CSV"
   - File akan terdownload dengan nama `clients_2026-02-21.csv`
   - Buka di Excel/Google Sheets untuk verifikasi
4. Pilih "Export sebagai Excel"
   - File akan terdownload dengan nama `clients_2026-02-21.xlsx`
   - Buka di Excel untuk verifikasi formatting

---

## 🔧 Files Created/Modified

### New Files
```
src/app/api/roles/route.ts
src/app/api/roles/[id]/route.ts
src/app/api/menus/route.ts
src/app/api/permissions/route.ts
src/app/dashboard/roles/page.tsx
src/lib/hooks/use-roles.ts
src/lib/hooks/use-permissions.ts
prisma/migrations/20260221_add_custom_roles/migration.sql
```

### Modified Files
```
prisma/schema.prisma (added CustomRole, Menu, RolePermission models)
src/components/layout/sidebar.tsx (dynamic menu based on permissions)
src/app/dashboard/clients/page.tsx (added CSV & Excel export)
src/lib/constants.ts (added Roles menu)
```

---

## ⚠️ Important Notes

### System Roles
- **Owner**, **Admin**, **Photographer**, **Packaging Staff** adalah system roles
- System roles TIDAK BISA dihapus (isSystem = true)
- System roles BISA diedit permissions-nya kalau diperlukan

### Backward Compatibility
- User yang belum punya `customRoleId` masih bisa login
- Fallback ke enum `role` (OWNER, ADMIN, dll.)
- Menu permissions akan di-generate otomatis berdasarkan enum role

### Migration Strategy
- Migration SQL sudah include data migration dari enum role ke custom roles
- Semua existing users akan otomatis dapat customRoleId sesuai role mereka

### Security
- Hanya OWNER yang bisa access `/dashboard/roles`
- Hanya OWNER yang bisa create/update/delete roles
- API endpoints protected dengan auth check
- Role dengan users aktif tidak bisa dihapus

---

## 🎯 Checklist Completion

✅ Owner bisa buat role baru dengan akses menu custom
✅ Sidebar menu muncul/hilang sesuai role secara dinamis
✅ Export CSV di menu Client berfungsi
✅ Export Excel di menu Client berfungsi
✅ System roles tidak bisa dihapus
✅ Role yang digunakan user tidak bisa dihapus
✅ Backward compatible dengan existing roles

---

## 🚀 Next Steps (Optional)

Jika ingin enhance lebih lanjut:

1. **Permission Granularity**
   - Tambah permissions untuk specific actions (e.g., "can approve payment", "can edit price")

2. **Role Inheritance**
   - Implement role hierarchy (e.g., Admin inherits Photographer permissions)

3. **Audit Log**
   - Track role changes dan permission updates

4. **User Assignment UI**
   - Bulk assign users ke role tertentu
   - Dropdown role di user form

5. **Export Enhancements**
   - Filter export by date range, status, etc.
   - Export with custom columns selection
   - Schedule auto-export

---

## 📞 Support

Jika ada issue atau pertanyaan:
1. Check migration berhasil: `npx prisma studio` → lihat tables custom_roles, menus, role_permissions
2. Check console browser untuk error messages
3. Check server logs untuk API errors
4. Verify Prisma Client sudah di-generate ulang

**Selamat! SESI 8 selesai diimplementasikan! 🎉**
