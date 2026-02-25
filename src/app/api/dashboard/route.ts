import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET — Dashboard overview
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Session check only — no extra Prisma user query needed here
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

  try {
    // Batch ALL queries into ONE database transaction (8 queries → 1 trip)
    const [
      todayBookings,
      waitingClientSelection,
      sentToVendor,
      needPackaging,
      needShipping,
      monthlyBookings,
      monthlyRevenue,
      unpaidBookings,
    ] = await prisma.$transaction([
      // Query 1: Today's schedule
      prisma.booking.findMany({
        where: {
          date: { gte: startOfDay, lt: endOfDay },
          status: { not: 'CANCELLED' },
        },
        select: {
          id: true,
          bookingCode: true,
          status: true,
          paymentStatus: true,
          startTime: true,
          endTime: true,
          date: true,
          client: { select: { id: true, name: true, phone: true } },
          package: { select: { id: true, name: true } },
          handledBy: { select: { id: true, name: true } },
        },
        orderBy: { startTime: 'asc' },
      }),

      // Queries 2-5: Action items counts
      prisma.printOrder.count({ where: { status: 'WAITING_CLIENT_SELECTION' } }),
      prisma.printOrder.count({ where: { status: { in: ['SENT_TO_VENDOR', 'PRINTING_IN_PROGRESS'] } } }),
      prisma.printOrder.count({ where: { status: 'PRINT_RECEIVED' } }),
      prisma.printOrder.count({ where: { status: 'PACKAGING' } }),

      // Queries 6-8: Monthly stats
      prisma.booking.count({
        where: {
          date: { gte: startOfMonth, lt: endOfMonth },
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.booking.aggregate({
        where: {
          date: { gte: startOfMonth, lt: endOfMonth },
          paymentStatus: 'PAID',
          status: { not: 'CANCELLED' },
        },
        _sum: { totalAmount: true },
      }),
      prisma.booking.count({
        where: {
          paymentStatus: 'UNPAID',
          status: { not: 'CANCELLED' },
        },
      }),
    ])

    return NextResponse.json({
      todaySchedule: todayBookings.map((b) => ({
        ...b,
        sessionTime: b.startTime.toISOString().split('T')[1].slice(0, 5),
        sessionDate: b.date.toISOString().split('T')[0]
      })),
      actionItems: {
        waitingClientSelection,
        sentToVendor,
        needPackaging,
        needShipping,
      },
      monthlyStats: {
        totalBookings: monthlyBookings,
        revenue: monthlyRevenue._sum.totalAmount || 0,
        unpaidBookings,
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("Dashboard API Error:", error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
