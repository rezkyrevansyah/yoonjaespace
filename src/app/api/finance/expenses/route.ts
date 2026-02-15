import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import {
  withAdmin,
  withErrorHandler,
  validateRequest,
} from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { expenseQuerySchema, createExpenseSchema } from '@/schemas'
import { financeLogger } from '@/lib/logger'

// GET — List expenses
export const GET = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }) => {
    // Validate query parameters
    const validation = await validateRequest(request, expenseQuerySchema, 'query')
    if (!validation.success) return validation.error

    const { month, category, page, limit } = validation.data
    const skip = (page - 1) * limit

    // Build where clause with proper typing
    const where: Prisma.ExpenseWhereInput = {}

    if (month) {
      const [year, m] = month.split('-')
      const start = new Date(parseInt(year), parseInt(m) - 1, 1)
      const end = new Date(parseInt(year), parseInt(m), 1)
      where.date = { gte: start, lt: end }
    }

    if (category) {
      where.category = category
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          relatedBooking: {
            select: { id: true, bookingCode: true, client: { select: { name: true } } },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ])

    financeLogger.info({
      msg: 'Expenses fetched',
      userId: user.id,
      count: expenses.length,
      filters: { month, category },
    })

    return ApiResponse.paginated(expenses, page, limit, total)
  })
)

// POST — Create expense
export const POST = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }) => {
    // Validate request body
    const validation = await validateRequest(request, createExpenseSchema, 'body')
    if (!validation.success) return validation.error

    const { description, amount, category, date, relatedBookingId, notes } = validation.data

    const expense = await prisma.expense.create({
      data: {
        description,
        amount,
        category,
        date: new Date(date),
        relatedBookingId: relatedBookingId || null,
        notes: notes || null,
      },
    })

    financeLogger.info({
      msg: 'Expense created',
      expenseId: expense.id,
      amount,
      category,
      createdBy: user.id,
    })

    return ApiResponse.created(expense)
  })
)
