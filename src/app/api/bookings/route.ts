import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { format } from 'date-fns'

// GET — List bookings with filters
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
  const status = searchParams.get('status')
  const date = searchParams.get('date')
  const month = searchParams.get('month') // format: 2026-02
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where: any = {}

  if (status) {
    where.status = status
  }

  if (date) {
    const start = new Date(date)
    const end = new Date(date)
    end.setDate(end.getDate() + 1)
    where.date = { gte: start, lt: end }
  }

  if (month) {
    const [year, m] = month.split('-')
    const start = new Date(parseInt(year), parseInt(m) - 1, 1)
    const end = new Date(parseInt(year), parseInt(m), 1)
    where.date = { gte: start, lt: end }
  }

  if (search) {
    where.OR = [
      { bookingCode: { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } },
      { client: { phone: { contains: search } } },
    ]
  }

  // Packaging staff hanya lihat order yang ada print
  if (dbUser.role === 'PACKAGING_STAFF') {
    where.printOrder = { isNot: null }
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        client: true,
        package: true,
        handledBy: { select: { id: true, name: true } },
        addOns: true,
        bookingBackgrounds: { include: { background: true } },
        printOrder: true,
        customFields: { include: { field: true } },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ])

  return NextResponse.json({
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

// POST — Create new booking
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

  const body = await request.json()
  const {
    clientId,
    clientName,
    clientPhone,
    clientEmail,
    date,
    startTime,
    endTime,
    packageId,
    numberOfPeople,
    photoFor,
    bts,
    notes,
    internalNotes,
    backgroundIds,
    addOns,
    discountAmount,
    discountNote,
    customFields,
  } = body

  // Validasi
  if (!packageId || !date || !startTime || !endTime) {
    return NextResponse.json(
      { error: 'Package, tanggal, dan waktu harus diisi' },
      { status: 400 }
    )
  }

  if (!clientId && (!clientName || !clientPhone)) {
    return NextResponse.json(
      { error: 'Client harus dipilih atau data client baru harus diisi' },
      { status: 400 }
    )
  }

  // Get atau create client
  let finalClientId = clientId

  if (!clientId) {
    const newClient = await prisma.client.create({
      data: {
        name: clientName,
        phone: clientPhone,
        email: clientEmail || null,
      },
    })
    finalClientId = newClient.id
  }

  // Get package untuk snapshot harga
  const pkg = await prisma.package.findUnique({ where: { id: packageId } })

  if (!pkg) {
    return NextResponse.json({ error: 'Package tidak ditemukan' }, { status: 404 })
  }

  // Hitung total add-ons
  let addOnsTotal = 0
  if (addOns && addOns.length > 0) {
    addOnsTotal = addOns.reduce(
      (sum: number, ao: any) => sum + ao.quantity * ao.unitPrice,
      0
    )
  }

  // Hitung total
  const discount = discountAmount || 0
  const totalAmount = pkg.price + addOnsTotal - discount

  // Generate booking code: YJ-YYYYMMDD-XXX
  const today = format(new Date(), 'yyyyMMdd')
  const countToday = await prisma.booking.count({
    where: {
      bookingCode: { startsWith: `YJ-${today}` },
    },
  })
  const bookingCode = `YJ-${today}-${String(countToday + 1).padStart(3, '0')}`

  // Generate public slug
  const publicSlug = nanoid(8)

  // Get default payment status
  const defaultPaymentSetting = await prisma.studioSetting.findUnique({
    where: { key: 'default_payment_status' },
  })
  const defaultPayment = defaultPaymentSetting?.value === 'paid' ? 'PAID' : 'UNPAID'

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      bookingCode,
      publicSlug,
      clientId: finalClientId,
      date: new Date(date),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      packageId,
      numberOfPeople: numberOfPeople || 1,
      photoFor: photoFor || 'OTHER',
      bts: bts || false,
      status: defaultPayment === 'PAID' ? 'PAID' : 'BOOKED',
      paymentStatus: defaultPayment,
      packagePrice: pkg.price,
      discountAmount: discount,
      discountNote: discountNote || null,
      totalAmount,
      notes: notes || null,
      internalNotes: internalNotes || null,
      handledById: dbUser.id,

      // Backgrounds
      bookingBackgrounds: backgroundIds?.length
        ? {
            create: backgroundIds.map((bgId: string) => ({
              backgroundId: bgId,
            })),
          }
        : undefined,

      // Add-ons
      addOns: addOns?.length
        ? {
            create: addOns.map((ao: any) => ({
              itemName: ao.itemName,
              quantity: ao.quantity,
              unitPrice: ao.unitPrice,
              subtotal: ao.quantity * ao.unitPrice,
            })),
          }
        : undefined,

      // Custom fields
      customFields: customFields?.length
        ? {
            create: customFields.map((cf: any) => ({
              fieldId: cf.fieldId,
              value: cf.value,
            })),
          }
        : undefined,
    },
    include: {
      client: true,
      package: true,
      handledBy: { select: { id: true, name: true } },
      addOns: true,
      bookingBackgrounds: { include: { background: true } },
      customFields: { include: { field: true } },
    },
  })

  return NextResponse.json(booking, { status: 201 })
}