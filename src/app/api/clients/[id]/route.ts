import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { logActivity } from '@/lib/activities'

// GET — Get single client with booking history
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

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      bookings: {
        include: {
          package: true,
          handledBy: { select: { id: true, name: true } },
          printOrder: true,
        },
        orderBy: { date: 'desc' },
      },
    },
  })

  if (!client) {
    return NextResponse.json({ error: 'Client tidak ditemukan' }, { status: 404 })
  }

  // Hitung summary
  const totalBookings = client.bookings.length
  const totalSpent = client.bookings
    .filter((b) => b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + b.totalAmount, 0)
  const lastVisit = client.bookings.length > 0 ? client.bookings[0].date : null

  return NextResponse.json({
    ...client,
    summary: {
      totalBookings,
      totalSpent,
      lastVisit,
    },
  })
}

// PATCH — Update client
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
  const { name, phone, email, instagram, address, notes } = body

  const existing = await prisma.client.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: 'Client tidak ditemukan' }, { status: 404 })
  }

  const updated = await prisma.client.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(email !== undefined && { email: email || null }),
      ...(instagram !== undefined && { instagram: instagram || null }),
      ...(address !== undefined && { address: address || null }),
      ...(notes !== undefined && { notes: notes || null }),
    },
  })

  await logActivity({
    userId: user.id,
    action: `Mengupdate data client`,
    details: `Data client ${updated.name} (${updated.phone}) telah diperbarui`,
    type: 'UPDATE',
  })

  return NextResponse.json(updated)
}

// DELETE — Delete client (Owner only, hanya jika tidak ada booking)
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
    return NextResponse.json({ error: 'Hanya Owner yang bisa menghapus client' }, { status: 403 })
  }

  // Cek apakah client punya booking
  const bookingCount = await prisma.booking.count({
    where: { clientId: id },
  })

  if (bookingCount > 0) {
    return NextResponse.json(
      { error: `Client tidak bisa dihapus karena memiliki ${bookingCount} booking. Hapus semua booking terlebih dahulu.` },
      { status: 400 }
    )
  }

  const clientToDelete = await prisma.client.findUnique({ where: { id } })

  await prisma.client.delete({ where: { id } })

  if (clientToDelete) {
    await logActivity({
      userId: user.id,
      action: `Menghapus client`,
      details: `Client ${clientToDelete.name} (${clientToDelete.phone}) telah dihapus`,
      type: 'DELETE',
    })
  }

  return NextResponse.json({ success: true })
}
