import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import {
  withOwner,
  withErrorHandler,
  validateRequest,
} from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { createCommissionSchema, commissionQuerySchema } from '@/schemas'
import { apiLogger } from '@/lib/logger'

// GET — List commissions (with auto-calculated booking count)
export const GET = withOwner(
  withErrorHandler(async (request: NextRequest, { user }) => {
    // Validate query parameters
    const validation = await validateRequest(request, commissionQuerySchema, 'query')
    if (!validation.success) return validation.error

    const { month: monthFilter, year: yearFilter, userId } = validation.data

    // Default to current month if not specified
    const currentDate = new Date()
    const month = monthFilter
      ? parseInt(monthFilter.split('-')[1])
      : currentDate.getMonth() + 1
    const year = yearFilter || currentDate.getFullYear()

    // Get all active staff (or specific user if userId provided)
    const staff = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(userId && { id: userId }),
      },
      select: { id: true, name: true, role: true },
    })

    // Count bookings per staff for this month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 1)

    const result = await Promise.all(
      staff.map(async (s) => {
        const bookingCount = await prisma.booking.count({
          where: {
            handledById: s.id,
            date: { gte: startDate, lt: endDate },
            status: { not: 'CANCELLED' },
          },
        })

        // Get existing commission record
        const commission = await prisma.commission.findUnique({
          where: {
            userId_month_year: {
              userId: s.id,
              month,
              year,
            },
          },
        })

        return {
          staff: s,
          bookingCount,
          commission: commission
            ? { id: commission.id, amount: commission.amount, notes: commission.notes }
            : null,
        }
      })
    )

    apiLogger.info({
      msg: 'Commissions fetched',
      userId: user.id,
      month,
      year,
    })

    return ApiResponse.success({
      month,
      year,
      data: result,
    })
  })
)

// POST — Set/update commission for a staff member
export const POST = withOwner(
  withErrorHandler(async (request: NextRequest, { user }) => {
    // Validate request body
    const validation = await validateRequest(request, createCommissionSchema, 'body')
    if (!validation.success) return validation.error

    const { userId, month, year, totalBookings, amount, notes } = validation.data

    // Count bookings for reference (use provided value or calculate)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 1)

    const calculatedBookings = await prisma.booking.count({
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
        totalBookings: calculatedBookings,
        notes: notes || null,
      },
      create: {
        userId,
        month,
        year,
        amount,
        totalBookings: calculatedBookings,
        notes: notes || null,
      },
      include: {
        user: { select: { name: true } },
      },
    })

    apiLogger.info({
      msg: 'Commission upserted',
      commissionId: commission.id,
      staffUserId: userId,
      createdBy: user.id,
    })

    return ApiResponse.success(commission)
  })
)
