import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — List expenses
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser || !['OWNER', 'ADMIN'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') // format: 2026-02
  const category = searchParams.get('category')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where: any = {}

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

  return NextResponse.json({
    expenses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

// POST — Create expense
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser || !['OWNER', 'ADMIN'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { description, amount, category, date, relatedBookingId, notes } = await request.json()

  if (!description || amount === undefined || !category || !date) {
    return NextResponse.json(
      { error: 'Deskripsi, jumlah, kategori, dan tanggal harus diisi' },
      { status: 400 }
    )
  }

  // Validasi kategori matches Enum
  const validCategories = ['PRINT_VENDOR', 'PACKAGING', 'SHIPPING', 'OPERATIONAL', 'OTHER']
  if (!validCategories.includes(category)) {
    return NextResponse.json(
      { error: `Kategori tidak valid. Pilihan: ${validCategories.join(', ')}` },
      { status: 400 }
    )
  }

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

  return NextResponse.json(expense, { status: 201 })
}
