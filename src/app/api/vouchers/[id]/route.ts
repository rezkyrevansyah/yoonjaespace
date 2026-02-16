import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// PATCH — Update voucher
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
  const { code, description, discountType, discountValue, minPurchase, maxUsage, isActive, validFrom, validUntil } = body

  // Cek kode unik jika berubah
  if (code) {
    const existing = await prisma.voucher.findFirst({
      where: { code: code.toUpperCase(), NOT: { id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Kode voucher sudah digunakan' }, { status: 400 })
    }
  }

  const updated = await prisma.voucher.update({
    where: { id },
    data: {
      ...(code && { code: code.toUpperCase() }),
      ...(description !== undefined && { description: description || null }),
      ...(discountType && { discountType }),
      ...(discountValue !== undefined && { discountValue }),
      ...(minPurchase !== undefined && { minPurchase: minPurchase || null }),
      ...(maxUsage !== undefined && { maxUsage: maxUsage || null }),
      ...(isActive !== undefined && { isActive }),
      ...(validFrom !== undefined && { validFrom: validFrom ? new Date(validFrom) : null }),
      ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
    },
  })

  return NextResponse.json(updated)
}

// DELETE — Delete voucher
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser || !['OWNER', 'ADMIN'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.voucher.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
