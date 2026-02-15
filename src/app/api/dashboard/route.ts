import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import {
  withAuth,
  withErrorHandler,
} from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'

// GET — Dashboard overview
export const GET = withAuth(
  withErrorHandler(async (request: NextRequest, { user }) => {
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

    apiLogger.info({
      msg: 'Dashboard data fetched',
      userId: user.id,
    })

    return ApiResponse.success({
      todaySchedule: todayBookings,
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
  })
)
