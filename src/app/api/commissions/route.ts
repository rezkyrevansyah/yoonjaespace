import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getCommissionPeriod } from '@/lib/utils/commission-period'

// GET — List commissions (with auto-calculated booking count)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser || dbUser.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

  // Count bookings per staff for this commission period (26th prev month - 25th current month)
  const { startDate, endDate } = getCommissionPeriod(month, year)

  // CRITICAL FIX: Use $transaction to batch queries into ONE transaction
  // Eliminates DEALLOCATE ALL overhead (3 transactions → 1)
  const [staff, allBookings, allCommissions] = await prisma.$transaction([
    // Query 1: Get all active staff
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
    }),

    // Query 2: Get ALL bookings for ALL staff in one query
    prisma.booking.findMany({
      where: {
        date: { gte: startDate, lt: endDate },
        status: { not: 'CANCELLED' },
        handledBy: { isActive: true }, // Only bookings for active staff
      },
      select: {
        id: true,
        bookingCode: true,
        totalAmount: true,
        paymentStatus: true,
        handledById: true,
        client: { select: { name: true } },
        package: { select: { name: true } },
      }
    }),

    // Query 3: Get ALL commissions for this month in one query
    prisma.commission.findMany({
      where: { month, year },
    })
  ])

  // Group bookings by staff ID for fast lookup
  const bookingsByStaff = allBookings.reduce<Record<string, typeof allBookings>>((acc, booking) => {
    if (!acc[booking.handledById]) {
      acc[booking.handledById] = []
    }
    acc[booking.handledById].push(booking)
    return acc
  }, {})

  // Map results - processing in memory is faster than multiple DB queries
  const result = staff.map((s) => {
    const bookings = bookingsByStaff[s.id] || []
    const bookingCount = bookings.length
    const revenueGenerated = bookings.reduce((sum, b) =>
      sum + (b.paymentStatus === 'PAID' ? b.totalAmount : 0), 0
    )

    // Find commission for this staff
    const commission = allCommissions.find(c => c.userId === s.id)

    return {
      staff: s,
      bookingCount,
      revenueGenerated,
      bookings,
      commission: commission
        ? {
            id: commission.id,
            amount: commission.amount,
            notes: commission.notes,
            isPaid: !!commission.paidAt,
            paidAt: commission.paidAt
          }
        : null,
    }
  })

  return NextResponse.json({
    month,
    year,
    data: result,
  })
}

// POST — Set/update commission for a staff member
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser || dbUser.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, month, year, amount, notes, isPaid } = await request.json()

  if (!userId || !month || !year || amount === undefined) {
    return NextResponse.json(
      { error: 'userId, month, year, dan amount harus diisi' },
      { status: 400 }
    )
  }

  // Count bookings for commission period (26th prev month - 25th current month)
  const { startDate, endDate } = getCommissionPeriod(month, year)

  const totalBookings = await prisma.booking.count({
    where: {
      handledById: userId,
      date: { gte: startDate, lt: endDate },
      status: { not: 'CANCELLED' },
    },
  })

  // Upsert commission
  const commission = await prisma.commission.upsert({
    where: {
      userId_month_year: { userId, month, year },
    },
    update: {
      amount,
      totalBookings,
      notes: notes || null,
      paidAt: isPaid ? new Date() : null,
    },
    create: {
      userId,
      month,
      year,
      amount,
      totalBookings,
      notes: notes || null,
      paidAt: isPaid ? new Date() : null,
    },
    include: {
      user: { select: { name: true } },
    },
  })

  return NextResponse.json(commission)
}
