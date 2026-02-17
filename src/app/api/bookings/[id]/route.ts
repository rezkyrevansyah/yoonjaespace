import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — Get single booking
export async function GET(
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

  if (!dbUser || !dbUser.isActive) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      client: true,
      package: true,
      handledBy: { select: { id: true, name: true } },
      addOns: true,
      bookingBackgrounds: { include: { background: true } },
      printOrder: true,
      invoice: true,
      customFields: { include: { field: true } },
      expenses: true,
      history: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: 'Booking tidak ditemukan' }, { status: 404 })
  }

  // Flatten backgrounds to single background for frontend compatibility
  const responseData = {
    ...booking,
    background: booking.bookingBackgrounds?.[0]?.background || null
  }

  return NextResponse.json(responseData)
}

// PATCH — Update booking
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
  const {
    date,
    startTime,
    endTime,
    packageId,
    numberOfPeople,
    photoFor,
    bts,
    notes,
    internalNotes,
    discountAmount,
    discountNote,
    backgroundIds,
    addOns,
    customFields,
  } = body

  // Get existing booking
  const existing = await prisma.booking.findUnique({
    where: { id },
    include: { addOns: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Booking tidak ditemukan' }, { status: 404 })
  }

  if (existing.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Booking yang dibatalkan tidak bisa diedit' }, { status: 400 })
  }

  // Track reschedule changes for history
  const historyEntries: any[] = []

  if (date && new Date(date).toISOString() !== existing.date.toISOString()) {
    historyEntries.push({
      bookingId: id,
      action: 'RESCHEDULED',
      field: 'date',
      oldValue: existing.date.toISOString(),
      newValue: new Date(date).toISOString(),
      changedBy: dbUser.id,
    })
  }

  if (startTime && new Date(startTime).toISOString() !== existing.startTime.toISOString()) {
    historyEntries.push({
      bookingId: id,
      action: 'RESCHEDULED',
      field: 'startTime',
      oldValue: existing.startTime.toISOString(),
      newValue: new Date(startTime).toISOString(),
      changedBy: dbUser.id,
    })
  }

  if (endTime && new Date(endTime).toISOString() !== existing.endTime.toISOString()) {
    historyEntries.push({
      bookingId: id,
      action: 'RESCHEDULED',
      field: 'endTime',
      oldValue: existing.endTime.toISOString(),
      newValue: new Date(endTime).toISOString(),
      changedBy: dbUser.id,
    })
  }

  // Recalculate total jika ada perubahan
  let newPackagePrice = existing.packagePrice
  if (packageId && packageId !== existing.packageId) {
    const pkg = await prisma.package.findUnique({ where: { id: packageId } })
    if (pkg) newPackagePrice = pkg.price
  }

  let addOnsTotal = 0
  if (addOns) {
    addOnsTotal = addOns.reduce(
      (sum: number, ao: any) => sum + ao.quantity * ao.unitPrice,
      0
    )
  } else {
    addOnsTotal = existing.addOns.reduce((sum, ao) => sum + ao.subtotal, 0)
  }

  const discount = discountAmount !== undefined ? discountAmount : existing.discountAmount
  const totalAmount = newPackagePrice + addOnsTotal - discount

  // Update booking + log history in a transaction
  const updated = await prisma.$transaction(async (tx) => {
    // Update backgrounds jika ada
    if (backgroundIds) {
      await tx.bookingBackground.deleteMany({ where: { bookingId: id } })
      if (backgroundIds.length > 0) {
        await tx.bookingBackground.createMany({
          data: backgroundIds.map((bgId: string) => ({
            bookingId: id,
            backgroundId: bgId,
          })),
        })
      }
    }

    // Update add-ons jika ada
    if (addOns) {
      await tx.bookingAddOn.deleteMany({ where: { bookingId: id } })
      if (addOns.length > 0) {
        await tx.bookingAddOn.createMany({
          data: addOns.map((ao: any) => ({
            bookingId: id,
            itemName: ao.itemName,
            quantity: ao.quantity,
            unitPrice: ao.unitPrice,
            subtotal: ao.quantity * ao.unitPrice,
          })),
        })
      }
    }

    // Update custom fields jika ada
    if (customFields) {
      await tx.bookingCustomField.deleteMany({ where: { bookingId: id } })
      if (customFields.length > 0) {
        await tx.bookingCustomField.createMany({
          data: customFields.map((cf: any) => ({
            bookingId: id,
            fieldId: cf.fieldId,
            value: cf.value,
          })),
        })
      }
    }

    // Update booking
    const result = await tx.booking.update({
      where: { id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(packageId && { packageId, packagePrice: newPackagePrice }),
        ...(numberOfPeople && { numberOfPeople }),
        ...(photoFor && { photoFor }),
        ...(bts !== undefined && { bts }),
        ...(notes !== undefined && { notes }),
        ...(internalNotes !== undefined && { internalNotes }),
        ...(discountAmount !== undefined && { discountAmount: discount }),
        ...(discountNote !== undefined && { discountNote }),
        totalAmount,
      },
      include: {
        client: true,
        package: true,
        handledBy: { select: { id: true, name: true } },
        addOns: true,
        bookingBackgrounds: { include: { background: true } },
        customFields: { include: { field: true } },
      },
    })

    // Log history entries
    if (historyEntries.length > 0) {
      await tx.bookingHistory.createMany({
        data: historyEntries,
      })
    }

    return result
  })

  // Flatten backgrounds for frontend
  const responseData = {
    ...updated,
    background: updated.bookingBackgrounds?.[0]?.background || null
  }

  return NextResponse.json(responseData)
}

// DELETE — Delete booking (Owner only)
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

  if (!dbUser || dbUser.role !== 'OWNER') {
    return NextResponse.json({ error: 'Hanya Owner yang bisa menghapus booking' }, { status: 403 })
  }

  await prisma.booking.delete({ where: { id } })

  return NextResponse.json({ success: true })
}