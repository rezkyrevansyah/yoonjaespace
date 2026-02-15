import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — Export finance data as JSON (frontend will convert to Excel)
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

  if (!month) {
    return NextResponse.json({ error: 'Parameter month harus diisi' }, { status: 400 })
  }

  const [year, m] = month.split('-')
  const startDate = new Date(parseInt(year), parseInt(m) - 1, 1)
  const endDate = new Date(parseInt(year), parseInt(m), 1)

  // Income data
  const bookings = await prisma.booking.findMany({
    where: {
      date: { gte: startDate, lt: endDate },
      status: { not: 'CANCELLED' },
    },
    include: {
      client: true,
      package: true,
      handledBy: { select: { name: true } },
      addOns: true,
    },
    orderBy: { date: 'asc' },
  })

  const incomeData = bookings.map((b) => ({
    'Booking ID': b.bookingCode,
    'Tanggal': b.date.toISOString().split('T')[0],
    'Client': b.client.name,
    'No WA': b.client.phone,
    'Paket': b.package.name,
    'Harga Paket': b.packagePrice,
    'Add-ons': b.addOns.map((a) => `${a.itemName} (${a.quantity}x)`).join(', '),
    'Total Add-ons': b.addOns.reduce((s, a) => s + a.subtotal, 0),
    'Diskon': b.discountAmount,
    'Total': b.totalAmount,
    'Status Pembayaran': b.paymentStatus,
    'Status': b.status,
    'Handled By': b.handledBy.name,
  }))

  // Expense data
  const expenses = await prisma.expense.findMany({
    where: {
      date: { gte: startDate, lt: endDate },
    },
    include: {
      relatedBooking: { select: { bookingCode: true } },
    },
    orderBy: { date: 'asc' },
  })

  const expenseData = expenses.map((e) => ({
    'Tanggal': e.date.toISOString().split('T')[0],
    'Deskripsi': e.description,
    'Kategori': e.category,
    'Jumlah': e.amount,
    'Booking Terkait': e.relatedBooking?.bookingCode || '-',
    'Catatan': e.notes || '-',
  }))

  // Summary
  const totalIncome = bookings
    .filter((b) => b.paymentStatus === 'PAID')
    .reduce((s, b) => s + b.totalAmount, 0)
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0)

  return NextResponse.json({
    income: incomeData,
    expenses: expenseData,
    summary: {
      totalIncome,
      totalExpense,
      grossProfit: totalIncome - totalExpense,
    },
  })
}
