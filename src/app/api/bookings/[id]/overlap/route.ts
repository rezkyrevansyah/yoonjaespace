import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getOverlapInfo } from '@/lib/mua-overlap'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser || !dbUser.isActive) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: bookingId } = await params

  // Get current booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      client: { select: { name: true } },
      addOns: true,
    },
  })

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Get all bookings on the same date
  const startOfDay = new Date(booking.date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(booking.date)
  endOfDay.setHours(23, 59, 59, 999)

  const sameDayBookings = await prisma.booking.findMany({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        notIn: ['CANCELLED'], // Exclude cancelled bookings
      },
    },
    include: {
      client: { select: { name: true } },
      addOns: true,
    },
  })

  // Calculate overlap info
  const overlapInfo = getOverlapInfo(
    {
      id: booking.id,
      startTime: booking.startTime,
      endTime: booking.endTime,
      muaStartTime: booking.muaStartTime,
    },
    sameDayBookings.map(b => ({
      id: b.id,
      bookingCode: b.bookingCode,
      startTime: b.startTime,
      endTime: b.endTime,
      muaStartTime: b.muaStartTime,
      client: b.client,
    }))
  )

  return NextResponse.json(overlapInfo)
}
