import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET — Dashboard overview
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser || !dbUser.isActive) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

  // Today's schedule
  const todayBookings = await prisma.booking.findMany({
    where: {
      date: { gte: startOfDay, lt: endOfDay },
      status: { not: 'CANCELLED' },
    },
    include: {
      client: true,
      package: true,
      handledBy: { select: { name: true } },
      bookingBackgrounds: { include: { background: true } },
      addOns: true,
      customFields: { include: { field: true } },
    },
    orderBy: { startTime: 'asc' },
  })

  // Action items
  const waitingClientSelection = await prisma.printOrder.count({
    where: { status: 'WAITING_CLIENT_SELECTION' },
  })

  const sentToVendor = await prisma.printOrder.count({
    where: { status: { in: ['SENT_TO_VENDOR', 'PRINTING_IN_PROGRESS'] } },
  })

  const needPackaging = await prisma.printOrder.count({
    where: { status: 'PRINT_RECEIVED' },
  })

  const needShipping = await prisma.printOrder.count({
    where: { status: 'PACKAGING' },
  })

  // Monthly stats
  const monthlyBookings = await prisma.booking.count({
    where: {
      date: { gte: startOfMonth, lt: endOfMonth },
      status: { not: 'CANCELLED' },
    },
  })

  const monthlyRevenue = await prisma.booking.aggregate({
    where: {
      date: { gte: startOfMonth, lt: endOfMonth },
      paymentStatus: 'PAID',
      status: { not: 'CANCELLED' },
    },
    _sum: { totalAmount: true },
  })

  const unpaidBookings = await prisma.booking.count({
    where: {
      paymentStatus: 'UNPAID',
      status: { not: 'CANCELLED' },
    },
  })

  return NextResponse.json({
    todaySchedule: todayBookings.map(b => ({
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
}
