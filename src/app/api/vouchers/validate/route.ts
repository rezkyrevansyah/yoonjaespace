import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// POST — Validate voucher code
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code, orderTotal } = await request.json()

  if (!code) {
    return NextResponse.json({ error: 'Kode voucher harus diisi' }, { status: 400 })
  }

  const voucher = await prisma.voucher.findUnique({
    where: { code: code.toUpperCase() },
  })

  if (!voucher) {
    return NextResponse.json({ error: 'Voucher tidak ditemukan' }, { status: 404 })
  }

  if (!voucher.isActive) {
    return NextResponse.json({ error: 'Voucher sudah tidak aktif' }, { status: 400 })
  }

  // Cek expired
  const now = new Date()
  if (voucher.validFrom && now < voucher.validFrom) {
    return NextResponse.json({ error: 'Voucher belum berlaku' }, { status: 400 })
  }
  if (voucher.validUntil && now > voucher.validUntil) {
    return NextResponse.json({ error: 'Voucher sudah expired' }, { status: 400 })
  }

  // Cek max usage
  if (voucher.maxUsage && voucher.usedCount >= voucher.maxUsage) {
    return NextResponse.json({ error: 'Voucher sudah mencapai batas pemakaian' }, { status: 400 })
  }

  // Cek min purchase
  if (voucher.minPurchase && orderTotal && orderTotal < voucher.minPurchase) {
    return NextResponse.json(
      { error: `Minimum pembelian Rp ${voucher.minPurchase.toLocaleString('id-ID')}` },
      { status: 400 }
    )
  }

  // Hitung diskon
  let discountAmount = 0
  if (voucher.discountType === 'fixed') {
    discountAmount = voucher.discountValue
  } else if (voucher.discountType === 'percentage') {
    discountAmount = orderTotal ? (orderTotal * voucher.discountValue) / 100 : 0
  }

  return NextResponse.json({
    valid: true,
    voucher: {
      id: voucher.id,
      code: voucher.code,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      discountAmount,
    },
  })
}
