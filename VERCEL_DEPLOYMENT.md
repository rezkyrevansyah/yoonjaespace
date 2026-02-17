# 🚀 Vercel Deployment Guide - Yoonjaespace

## ⚠️ Troubleshooting "Failed to load dashboard data"

### Kemungkinan Penyebab:
1. Environment variables belum di-set di Vercel
2. Database migration belum dijalankan
3. Client belum login atau session expired
4. Supabase credentials tidak valid

---

## ✅ Checklist Setup Vercel

### 1. **Set Environment Variables**

Buka Vercel Dashboard → Settings → Environment Variables, lalu add:

#### **Database (Supabase PostgreSQL)** ⚡ WAJIB
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
```

#### **Supabase Auth** ⚡ WAJIB
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **NextAuth** ⚡ WAJIB
```bash
NEXTAUTH_URL=https://yoonjaespace.vercel.app
NEXTAUTH_SECRET=your-secret-key-here
```

#### **App Settings** (Optional)
```bash
NEXT_PUBLIC_BASE_URL=https://yoonjaespace.vercel.app
```

**⚠️ PENTING:** Setelah add env vars, **Redeploy** project!

---

### 2. **Cara Mendapatkan Supabase Credentials**

1. Buka https://supabase.com/dashboard
2. Pilih project Anda
3. Settings → API
4. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Settings → Database → Connection String
   - Copy `Connection string` → `DATABASE_URL` & `DIRECT_URL`
   - Ganti `[YOUR-PASSWORD]` dengan password database Anda

---

### 3. **Cara Generate NEXTAUTH_SECRET**

Di terminal, jalankan:
```bash
openssl rand -base64 32
```

Copy output dan masukkan ke `NEXTAUTH_SECRET`

---

### 4. **Build Script Sudah Ditambahkan Migration**

Build script di `package.json` sudah updated:
```json
"build": "prisma generate && prisma migrate deploy && next build"
```

Ini akan otomatis:
- Generate Prisma Client
- Deploy database migrations
- Build Next.js app

---

## 🔍 Debugging Steps

### A. Check Vercel Logs

1. Buka Vercel Dashboard
2. Pilih project → Deployments
3. Klik deployment terakhir
4. Klik "View Function Logs"
5. Cari error di logs

### B. Check Database Connection

Pastikan di Supabase:
1. Database → Tables sudah ada semua tables (User, Booking, Client, dll)
2. SQL Editor → Jalankan: `SELECT COUNT(*) FROM "User";`
3. Kalau error berarti migration belum jalan

### C. Test API Endpoint

Buka browser atau Postman:
```
GET https://yoonjaespace.vercel.app/api/dashboard
```

**Expected Response (tanpa auth):**
```json
{"error": "Unauthorized"}
```

**Kalau error 500:** Berarti database connection issue atau env vars salah

---

## 👤 Cara Login untuk Client

### Opsi 1: Buat User via Supabase Dashboard
1. Buka Supabase → Authentication → Users
2. Klik "Add user"
3. Masukkan email & password
4. Copy User UID
5. Buka SQL Editor, jalankan:
```sql
INSERT INTO "User" (id, email, name, phone, role, "isActive", "createdAt", "updatedAt")
VALUES (
  '[USER-UID]',
  '[EMAIL]',
  '[NAMA]',
  '[PHONE]',
  'OWNER',
  true,
  NOW(),
  NOW()
);
```

### Opsi 2: Buat User via Seed Script
Sudah ada di `prisma/seed.ts`, jalankan:
```bash
npx prisma db seed
```

**Default OWNER Credentials:**
- Email: `owner@yoonjaespace.com`
- Password: `password123`

---

## 📱 Cara Client Login di Mobile

1. Buka: https://yoonjaespace.vercel.app/login
2. Masukkan email & password
3. Klik "Login"
4. Seharusnya redirect ke `/dashboard`

**⚠️ Kalau gagal login:**
- Check browser console (F12) untuk error
- Pastikan Supabase Auth berfungsi
- Pastikan user sudah ada di database

---

## 🆘 Masih Error?

### Error: "Failed to load dashboard data"
**Penyebab:** API `/api/dashboard` gagal
**Solusi:**
1. Check Vercel env vars (lihat Step 1)
2. Check Vercel Function Logs untuk error detail
3. Pastikan DATABASE_URL benar

### Error: "Unauthorized" terus menerus
**Penyebab:** Session cookie tidak tersimpan atau Supabase Auth issue
**Solusi:**
1. Clear browser cookies
2. Login ulang
3. Check NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY

### Error: Database query error
**Penyebab:** Migration belum jalan atau schema tidak sinkron
**Solusi:**
1. Redeploy project (akan otomatis jalankan migration)
2. Atau manual via Prisma Studio: `npx prisma migrate deploy`

---

## 📞 Contact

Jika masih ada issue, kirim screenshot:
1. Vercel Function Logs (error detail)
2. Browser Console (F12)
3. Supabase Dashboard → Database Tables

Semoga membantu! 🚀
