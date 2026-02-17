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

  // Income: total dari booking yang PAID dalam periode
  const paidBookings = await prisma.booking.findMany({
    where: {
      paymentStatus: 'PAID',
      date: { gte: startDate, lt: endDate },
      status: { not: 'CANCELLED' },
    },
    select: { totalAmount: true },
  })

  const totalIncome = paidBookings.reduce((sum, b) => sum + b.totalAmount, 0)

  // Expense: total expense dalam periode
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
