import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { logActivity } from '@/lib/activities'

// PATCH — Update add-on payment status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addonId: string }> }
) {
  const { id, addonId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  // Hanya OWNER dan ADMIN yang bisa mengubah status pembayaran Add-on
  if (!dbUser || !['OWNER', 'ADMIN'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { paymentStatus } = await request.json()

  if (!paymentStatus || !['PAID', 'UNPAID', 'PARTIALLY_PAID'].includes(paymentStatus)) {
      return NextResponse.json({ error: 'Invalid paymentStatus' }, { status: 400 })
  }

  const existingAddOn = await prisma.bookingAddOn.findUnique({
    where: { id: addonId },
    include: { booking: { include: { client: true } } }
  })

  if (!existingAddOn || existingAddOn.bookingId !== id) {
    return NextResponse.json({ error: 'Add-on tidak ditemukan' }, { status: 404 })
  }

  const updatedAddOn = await prisma.bookingAddOn.update({
    where: { id: addonId },
    data: { paymentStatus: paymentStatus as any },
  })

  // Log activity
  if (existingAddOn.paymentStatus !== paymentStatus) {
    await logActivity({
      userId: user.id,
      action: `Mengubah pembayaran Add-on`,
      details: `Add-on ${existingAddOn.itemName} untuk booking ${existingAddOn.booking.bookingCode} (${existingAddOn.booking.client.name}): ${existingAddOn.paymentStatus} → ${paymentStatus}`,
      type: 'UPDATE',
    })
  }

  return NextResponse.json(updatedAddOn)
}
