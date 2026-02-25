import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { logActivity } from '@/lib/activities'

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

  // OPTIMIZED: Use database aggregation instead of fetching all bookings
  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        instagram: true,
        address: true,
        domisili: true,
        leads: true,
        createdAt: true,
        // Count total bookings (excluding cancelled)
        _count: {
          select: {
            bookings: {
              where: { status: { not: 'CANCELLED' } }
            }
          }
        },
        // Get only paid bookings for totalSpent calculation
        bookings: {
          where: {
            status: { not: 'CANCELLED' },
            paymentStatus: 'PAID'
          },
          select: { totalAmount: true, date: true },
          orderBy: { date: 'desc' },
          take: 1  // Only fetch most recent for lastVisit
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.client.count({ where }),
  ])

  // Minimal processing - just sum and format
  const clientsWithStats = clients.map((client) => {
    const totalSpent = client.bookings.reduce((sum, b) => sum + b.totalAmount, 0)
    const lastVisit = client.bookings[0]?.date || null

    return {
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      instagram: client.instagram,
      address: client.address,
      domisili: client.domisili,
      leads: client.leads,
      createdAt: client.createdAt,
      totalBookings: client._count.bookings,
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

  const { name, phone, email, instagram, address, domisili, leads, notes } = await request.json()

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
      domisili: domisili || null,
      leads: leads || null,
      notes: notes || null,
    },
  })

  await logActivity({
    userId: user.id,
    action: `Menambahkan client baru`,
    details: `Client ${name} (${phone}) telah ditambahkan`,
    type: 'CREATE',
  })

  return NextResponse.json(client, { status: 201 })
}
