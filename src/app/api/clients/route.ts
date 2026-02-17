import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — List clients with search
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser || !dbUser.isActive) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where: any = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        bookings: {
          select: {
            date: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.client.count({ where }),
  ])

  // Enhance clients with stats
  const clientsWithStats = clients.map((client) => {
    const validBookings = client.bookings.filter(
      (b) => b.status !== 'CANCELLED'
    )
    
    // Total spent (paid bookings only)
    const totalSpent = validBookings
      .filter((b) => b.paymentStatus === 'PAID')
      .reduce((sum, b) => sum + b.totalAmount, 0)

    // Last visit (latest booking date)
    const lastVisit = validBookings.length > 0
      ? validBookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
      : null

    // Remove bookings from response to keep it light, unless needed detailed
    const { bookings, ...clientData } = client
    return {
      ...clientData,
      totalBookings: validBookings.length,
      totalSpent,
      lastVisit,
    }
  })

  return NextResponse.json({
    data: clientsWithStats,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

// POST — Create new client
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

  const { name, phone, email, instagram, address, notes } = await request.json()

  if (!name || !phone) {
    return NextResponse.json(
      { error: 'Nama dan nomor WA harus diisi' },
      { status: 400 }
    )
  }

  const client = await prisma.client.create({
    data: {
      name,
      phone,
      email: email || null,
      instagram: instagram || null,
      address: address || null,
      notes: notes || null,
    },
  })

  return NextResponse.json(client, { status: 201 })
}
