# Migration Guide - MUA Overlap Detection Feature

## Status
⚠️ **MIGRATION REQUIRED** - Fitur deteksi overlap MUA memerlukan database migration sebelum dapat digunakan.

## Perubahan Database
Migration ini menambahkan kolom `muaStartTime` pada tabel `bookings` untuk menyimpan waktu mulai makeup (1 jam sebelum sesi studio) jika booking memiliki add-on MUA.

## Cara Menjalankan Migration

### Opsi 1: Via Prisma CLI (Development)
```bash
# 1. Pastikan koneksi database sudah benar di .env
# DATABASE_URL dan DIRECT_URL harus terisi

# 2. Jalankan migration
npx prisma migrate deploy

# 3. Generate Prisma Client baru
npx prisma generate
```

### Opsi 2: Via SQL Manual (Production/Supabase)
```sql
-- Jalankan query ini di Supabase SQL Editor atau database console
ALTER TABLE "bookings" ADD COLUMN "muaStartTime" TIMESTAMP(3);
```

### Opsi 3: Via Vercel/Deployment
Jika menggunakan Vercel, migration akan otomatis dijalankan saat build jika build command sudah include:
```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

## Setelah Migration Berhasil

Aktifkan kembali kode MUA detection di file berikut:

### 1. `src/app/api/bookings/route.ts`
Uncomment baris berikut:
```typescript
// Line 7: Uncomment import
import { hasMuaAddOn, calculateMuaStartTime } from '@/lib/mua-overlap'

// Line 231-233: Uncomment MUA calculation
const bookingHasMua = hasMuaAddOn(addOns || [])
const muaStartTime = bookingHasMua ? calculateMuaStartTime(new Date(startTime)) : null

// Line 253: Uncomment field
muaStartTime, // Set MUA start time if MUA add-on exists
```

## Verifikasi Migration Berhasil

1. **Cek di Prisma Studio**:
```bash
npx prisma studio
```
Buka tabel `bookings` dan pastikan kolom `muaStartTime` sudah ada.

2. **Cek di Database Console**:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name = 'muaStartTime';
```

3. **Test Create Booking**:
- Buat booking baru dengan add-on "MUA" atau "Makeup"
- Pastikan tidak ada error 500
- Cek di database bahwa `muaStartTime` terisi otomatis

## Rollback (Jika Diperlukan)

Jika ada masalah dan perlu rollback:
```sql
ALTER TABLE "bookings" DROP COLUMN "muaStartTime";
```

## Files yang Terpengaruh

### Migration File:
- `prisma/schema.prisma` (line 98)
- `prisma/migrations/20260221123701_add_mua_start_time/migration.sql`

### Backend:
- `src/app/api/bookings/route.ts` (POST endpoint)
- `src/app/api/bookings/[id]/overlap/route.ts` (overlap detection)
- `src/lib/mua-overlap.ts` (helper functions)

### Frontend:
- `src/app/dashboard/calendar/page.tsx` (Day & Week view alerts)
- `src/app/dashboard/bookings/[id]/page.tsx` (detail page alert)
- `src/lib/client-mua-overlap.ts` (client-side helpers)
- `src/lib/types.ts` (TypeScript types)

## Support

Jika ada masalah saat migration:
1. Cek log error di console
2. Pastikan DATABASE_URL dan DIRECT_URL benar
3. Pastikan user database punya permission untuk ALTER TABLE
4. Contact: developer atau buka issue di GitHub

---
**Created**: 2026-02-21
**Feature**: MUA Overlap Detection System
