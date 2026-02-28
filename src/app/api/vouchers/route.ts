import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — List vouchers
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser || !['OWNER', 'ADMIN'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const activeOnly = searchParams.get('active') === 'true'

  const where: any = {}
  if (activeOnly) {
    where.isActive = true
  }

  const vouchers = await prisma.voucher.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  // Ensure uppercase for frontend types
  const result = vouchers.map(v => ({
    ...v,
    discountType: v.discountType.toUpperCase()
  }))

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' },
  })
}

// POST — Create voucher
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser || !['OWNER', 'ADMIN'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { code, description, discountType, discountValue, minPurchase, maxUsage, validFrom, validUntil } = body

  if (!code || !discountValue) {
    return NextResponse.json(
      { error: 'Kode voucher dan nilai diskon harus diisi' },
      { status: 400 }
    )
  }

  // Cek kode unik
  const existing = await prisma.voucher.findUnique({ where: { code } })
  if (existing) {
    return NextResponse.json({ error: 'Kode voucher sudah digunakan' }, { status: 400 })
  }

  const voucher = await prisma.voucher.create({
    data: {
      code: code.toUpperCase(),
      description: description || null,
      discountType: (discountType || 'FIXED').toUpperCase(),
      discountValue,
      minPurchase: minPurchase || null,
      maxUsage: maxUsage || null,
      validFrom: validFrom ? new Date(validFrom) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
    },
  })

  return NextResponse.json(voucher, { status: 201 })
}
