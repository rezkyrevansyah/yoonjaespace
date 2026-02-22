import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { logActivity } from '@/lib/activities'

// POST — Create print order untuk booking
export async function POST(
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

  // Cek apakah sudah ada print order
  const existing = await prisma.printOrder.findUnique({
    where: { bookingId: id },
  })

  if (existing) {
    return NextResponse.json({ error: 'Print order sudah ada' }, { status: 400 })
  }

  const body = await request.json()

  const printOrder = await prisma.printOrder.create({
    data: {
      bookingId: id,
      shippingAddress: body.shippingAddress || null,
    },
  })

  // Get booking info for logging
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { client: true }
  })

  if (booking) {
    await logActivity({
      userId: user.id,
      action: `Membuat print order`,
      details: `Print order untuk booking ${booking.bookingCode} (${booking.client.name}) telah dibuat`,
      type: 'CREATE',
    })
  }

  return NextResponse.json(printOrder, { status: 201 })
}

// PATCH — Update print order status
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

  if (!dbUser || !['OWNER', 'ADMIN', 'PACKAGING_STAFF'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { status, selectedPhotos, vendorName, vendorNotes, shippingAddress, courier, trackingNumber } = body

  const printOrder = await prisma.printOrder.findUnique({
    where: { bookingId: id },
  })

  if (!printOrder) {
    return NextResponse.json({ error: 'Print order tidak ditemukan' }, { status: 404 })
  }

  const updateData: any = {}

  if (status) updateData.status = status
  if (selectedPhotos !== undefined) updateData.selectedPhotos = selectedPhotos
  if (vendorName !== undefined) updateData.vendorName = vendorName
  if (vendorNotes !== undefined) updateData.vendorNotes = vendorNotes
  if (shippingAddress !== undefined) updateData.shippingAddress = shippingAddress
  if (courier !== undefined) updateData.courier = courier
  if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber

  if (status === 'SHIPPED') {
    updateData.shippedAt = new Date()
  }

  // Jika print completed, update booking utama ke CLOSED
  if (status === 'COMPLETED') {
    await prisma.booking.update({
      where: { id },
      data: { status: 'CLOSED' },
    })
  }

  const updated = await prisma.printOrder.update({
    where: { bookingId: id },
    data: updateData,
  })

  // Get booking info for logging
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { client: true }
  })

  // Log activity based on what was changed
  if (status && status !== printOrder.status && booking) {
    const printStatusMap: Record<string, string> = {
      'WAITING_CLIENT_SELECTION': 'Menunggu Pilihan Client',
      'SENT_TO_VENDOR': 'Dikirim ke Vendor',
      'PRINTING_IN_PROGRESS': 'Dalam Proses Cetak',
      'PRINT_RECEIVED': 'Print Diterima',
      'PACKAGING': 'Packaging',
      'SHIPPED': 'Dikirim',
      'COMPLETED': 'Selesai'
    }

    await logActivity({
      userId: user.id,
      action: `Mengubah status print order`,
      details: `Print order booking ${booking.bookingCode} (${booking.client.name}): ${printStatusMap[printOrder.status] || printOrder.status} → ${printStatusMap[status] || status}`,
      type: 'UPDATE',
    })
  }

  if (trackingNumber && trackingNumber !== printOrder.trackingNumber && booking) {
    await logActivity({
      userId: user.id,
      action: `Menambahkan nomor resi`,
      details: `Resi ${trackingNumber} untuk booking ${booking.bookingCode} (${booking.client.name})`,
      type: 'UPDATE',
    })
  }

  return NextResponse.json(updated)
}