import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { withOwner, withErrorHandler, validateRequest } from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { financeSummaryQuerySchema } from '@/schemas'
import { financeLogger } from '@/lib/logger'

// GET — Finance summary (monthly)
export const GET = withOwner(
  withErrorHandler(async (request: NextRequest, { user }) => {
    // Validate query parameters
    const validation = await validateRequest(request, financeSummaryQuerySchema, 'query')
    if (!validation.success) return validation.error

    const { month } = validation.data

    let startDate: Date
    let endDate: Date

    if (month) {
      const [year, m] = month.split('-')
      startDate = new Date(parseInt(year), parseInt(m) - 1, 1)
      endDate = new Date(parseInt(year), parseInt(m), 1)
    } else {
      // Default to current month
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    }

    // Income: total from PAID bookings in period
    const paidBookings = await prisma.booking.findMany({
      where: {
        paymentStatus: 'PAID',
        date: { gte: startDate, lt: endDate },
        status: { not: 'CANCELLED' },
      },
      select: { totalAmount: true },
    })

    const totalIncome = paidBookings.reduce((sum, b) => sum + b.totalAmount, 0)

    // Expense: total expenses in period
    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: startDate, lt: endDate },
      },
      select: { amount: true, category: true },
    })

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)

    // Breakdown expense per category
    const expenseByCategory: Record<string, number> = {}
    expenses.forEach((e) => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount
    })

    // Booking stats
    const totalBookings = await prisma.booking.count({
      where: {
        date: { gte: startDate, lt: endDate },
        status: { not: 'CANCELLED' },
      },
    })

    const cancelledBookings = await prisma.booking.count({
      where: {
        date: { gte: startDate, lt: endDate },
        status: 'CANCELLED',
      },
    })

    financeLogger.info({
      msg: 'Finance summary fetched',
      userId: user.id,
      period: { start: startDate, end: endDate },
      income: totalIncome,
      expense: totalExpense,
    })

    return ApiResponse.success({
      period: {
        start: startDate,
        end: endDate,
      },
      income: totalIncome,
      expense: totalExpense,
      grossProfit: totalIncome - totalExpense,
      expenseByCategory,
      bookingStats: {
        total: totalBookings,
        cancelled: cancelledBookings,
      },
    })
  })
)
