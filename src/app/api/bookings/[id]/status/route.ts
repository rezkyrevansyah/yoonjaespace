import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// PATCH — Update booking status
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

  const { status, paymentStatus, photoLink } = await request.json()

  const existing = await prisma.booking.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: 'Booking tidak ditemukan' }, { status: 404 })
  }

  const updateData: any = {}

  if (status) {
    updateData.status = status

    // Jika status PHOTOS_DELIVERED, set deliveredAt
    if (status === 'PHOTOS_DELIVERED') {
      updateData.deliveredAt = new Date()
    }
  }

  if (paymentStatus) {
    updateData.paymentStatus = paymentStatus

    // Jika payment berubah ke PAID dan status masih BOOKED, update ke PAID
    if (paymentStatus === 'PAID' && existing.status === 'BOOKED') {
      updateData.status = 'PAID'
    }
  }

  if (photoLink !== undefined) {
    updateData.photoLink = photoLink
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: updateData,
    include: {
      client: true,
      package: true,
      handledBy: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(updated)
}