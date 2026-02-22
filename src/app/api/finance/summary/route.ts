import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — Finance summary (monthly)
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
  const month = searchParams.get('month') // format: 2026-02

  let startDate: Date
  let endDate: Date

  if (month) {
    const [year, m] = month.split('-')
    startDate = new Date(parseInt(year), parseInt(m) - 1, 1)
    endDate = new Date(parseInt(year), parseInt(m), 1)
  } else {
    // Default bulan ini
    const now = new Date()
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  }

  // CRITICAL FIX: Single transaction with all queries
  // groupBy cannot be inside $transaction due to TypeScript typing, so we run it separately
  // But we use Promise.all to parallelize the 2 transactions
  const [bookingData, expenseData] = await Promise.all([
    // Transaction 1: All booking queries (3 queries in 1 transaction)
    prisma.$transaction([
      prisma.booking.aggregate({
        where: {
          paymentStatus: 'PAID',
          date: { gte: startDate, lt: endDate },
          status: { not: 'CANCELLED' },
        },
        _sum: { totalAmount: true },
      }),
      prisma.booking.count({
        where: {
          date: { gte: startDate, lt: endDate },
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.booking.count({
        where: {
          date: { gte: startDate, lt: endDate },
          status: 'CANCELLED',
        },
      }),
    ]),

    // Query 2: Expense aggregation (separate due to groupBy typing limitation)
    prisma.expense.groupBy({
      by: ['category'],
      where: {
        date: { gte: startDate, lt: endDate },
      },
      _sum: { amount: true },
    }),
  ])

  // Extract results
  const [incomeData, totalBookings, cancelledBookings] = bookingData
  const totalIncome = incomeData._sum.totalAmount || 0
  const totalExpense = expenseData.reduce((sum: number, e: any) => sum + ((e._sum?.amount) || 0), 0)

  // Breakdown expense per category
  const expenseByCategory: Record<string, number> = Object.fromEntries(
    expenseData.map((e: any) => [e.category, (e._sum?.amount) || 0])
  )

  return NextResponse.json({
    period: {
      start: startDate,
      end: endDate,
    },
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense,
    expenseByCategory,
    bookingStats: {
      total: totalBookings,
      cancelled: cancelledBookings,
    },
    incomeByMonth: [] // Optional: implement if needed for charts
  })
}
