import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Prisma, BookingStatus, PaymentStatus } from '@prisma/client'
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

  const { status, paymentStatus, photoLink, paymentProof } = await request.json()

  const existing = await prisma.booking.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: 'Booking tidak ditemukan' }, { status: 404 })
  }

  const updateData: Prisma.BookingUpdateInput = {}
  const historyEntries: Prisma.BookingHistoryCreateManyInput[] = []

  if (status) {
    updateData.status = status

    // Log status change
    historyEntries.push({
      bookingId: id,
      action: 'STATUS_CHANGED',
      field: 'status',
      oldValue: existing.status,
      newValue: status as BookingStatus,
      changedBy: dbUser.id,
    })

    // Jika status PHOTOS_DELIVERED, set deliveredAt
    if (status === 'PHOTOS_DELIVERED') {
      updateData.deliveredAt = new Date()
    }
  }

  if (paymentStatus) {
    updateData.paymentStatus = paymentStatus

    // Log payment status change
    historyEntries.push({
      bookingId: id,
      action: 'PAYMENT_UPDATED',
      field: 'paymentStatus',
      oldValue: existing.paymentStatus,
      newValue: paymentStatus as PaymentStatus,
      changedBy: dbUser.id,
    })

    // Jika payment berubah ke PAID dan status masih BOOKED, update ke PAID
    if (paymentStatus === 'PAID' && existing.status === 'BOOKED') {
      updateData.status = 'PAID'
      updateData.paidAt = new Date()

      historyEntries.push({
        bookingId: id,
        action: 'STATUS_CHANGED',
        field: 'status',
        oldValue: existing.status,
        newValue: 'PAID',
        changedBy: dbUser.id,
      })
    }

    // Set paidAt jika payment berubah ke PAID
    if (paymentStatus === 'PAID' && !existing.paidAt) {
      updateData.paidAt = new Date()
    }
  }

  if (photoLink !== undefined) {
    updateData.photoLink = photoLink
  }

  if (paymentProof !== undefined) {
    updateData.paymentProof = paymentProof

    historyEntries.push({
      bookingId: id,
      action: 'PAYMENT_PROOF_UPLOADED',
      field: 'paymentProof',
      oldValue: existing.paymentProof || null,
      newValue: paymentProof,
      changedBy: dbUser.id,
    })
  }

  // Execute update + history logging in a transaction
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.booking.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        package: true,
        handledBy: { select: { id: true, name: true } },
      },
    })

    // Log all history entries
    if (historyEntries.length > 0) {
      await tx.bookingHistory.createMany({
        data: historyEntries,
      })
    }

    return result
  })

  return NextResponse.json(updated)
}