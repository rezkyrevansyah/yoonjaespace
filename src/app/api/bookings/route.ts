import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Prisma, BookingStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { format } from 'date-fns'
import { hasMuaAddOn, calculateMuaStartTime } from '@/lib/mua-overlap'
import { logActivity } from '@/lib/activities'

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
  const printStatus = searchParams.get('printStatus')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where: Prisma.BookingWhereInput = {}

  if (status && status !== 'ALL') {
    where.status = status as BookingStatus
  }

  if (printStatus && printStatus !== 'ALL') {
     // Assuming PrintOrderStatus is a valid enum or string you want to filter by
     // We need to link to the PrintOrder relation
     where.printOrder = {
        status: printStatus as any // Using as any for now if type is not strictly imported, or import PrintOrderStatus
     }
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
  // Unless they are filtering for a specific status, let's keep this constraint? 
  // Or maybe valid printStatus implies printOrder exists.
  if (dbUser.role === 'PACKAGING_STAFF') {
    where.printOrder = { isNot: null }
  }

  // OPTIMIZED: Use select instead of include to reduce data transfer
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      select: {
        id: true,
        bookingCode: true,
        publicSlug: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
        paymentStatus: true,
        packagePrice: true,
        discountAmount: true,
        totalAmount: true,
        notes: true,
        internalNotes: true,
        numberOfPeople: true,
        photoFor: true,
        bts: true,
        muaStartTime: true,
        photoLink: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          }
        },
        package: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          }
        },
        handledBy: {
          select: {
            id: true,
            name: true,
          }
        },
        addOns: {
          select: {
            id: true,
            itemName: true,
            quantity: true,
            unitPrice: true,
            subtotal: true,
          }
        },
        bookingBackgrounds: {
          select: {
            id: true,
            background: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        printOrder: {
          select: {
            id: true,
            status: true,
            vendorNotes: true,
            selectedPhotos: true,
          }
        },
        customFields: {
          select: {
            id: true,
            value: true,
            field: {
              select: {
                id: true,
                fieldName: true,
                fieldType: true,
              }
            }
          }
        },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ])

  return NextResponse.json({
    data: bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }, {
    headers: {
      // Browser cache: buka tab baru → data tampil instan dari cache HTTP,
      // fetch fresh di background
      'Cache-Control': 'private, max-age=0, stale-while-revalidate=30',
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
    createdAt, // Optional: for old booking mode (Owner only)
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

  // Get atau create client (upsert by phone to avoid duplicates)
  let finalClientId = clientId

  if (!clientId) {
    const existingClient = await prisma.client.findFirst({
      where: { phone: clientPhone }
    })

    if (existingClient) {
      finalClientId = existingClient.id
    } else {
      const newClient = await prisma.client.create({
        data: {
          name: clientName,
          phone: clientPhone,
          email: clientEmail || null,
          instagram: body.clientInstagram || null,
          address: body.clientAddress || null,
          domisili: body.clientDomisili || null,
          leads: body.clientLeads || null,
        },
      })
      finalClientId = newClient.id
    }
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
      (sum: number, ao: { quantity: number; unitPrice: number }) => sum + ao.quantity * ao.unitPrice,
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

  // Default payment status is always PAID (new requirement)
  // Bookings are created as PAID by default
  const defaultPayment = 'PAID'
  const defaultStatus = 'PAID'
  const paidAt = new Date()

  // Check if booking has MUA add-on and calculate MUA start time
  const bookingHasMua = hasMuaAddOn(addOns || [])
  const muaStartTime = bookingHasMua ? calculateMuaStartTime(new Date(startTime)) : null

  // Prepare booking data
  const bookingData: any = {
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
    status: defaultStatus,
    paymentStatus: defaultPayment,
    paidAt,
    packagePrice: pkg.price,
    discountAmount: discount,
    discountNote: discountNote || null,
    totalAmount,
    notes: notes || null,
    internalNotes: internalNotes || null,
    handledById: body.handledById || dbUser.id,
    muaStartTime, // Set MUA start time if MUA add-on exists

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
          create: addOns.map((ao: { itemName: string; quantity: number; unitPrice: number }) => ({
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
          create: customFields.map((cf: { fieldId: string; value: string }) => ({
            fieldId: cf.fieldId,
            value: cf.value,
          })),
        }
      : undefined,
  }

  // Add custom createdAt if provided (Owner only for old bookings)
  if (createdAt && dbUser.role === 'OWNER') {
    bookingData.createdAt = new Date(createdAt)
  }

  // Create booking
  const booking = await prisma.booking.create({
    data: bookingData,
    include: {
      client: true,
      package: true,
      handledBy: { select: { id: true, name: true } },
      addOns: true,
      bookingBackgrounds: { include: { background: true } },
      customFields: { include: { field: true } },
    },
  })

  await logActivity({
    userId: user.id,
    action: `Membuat booking baru`,
    details: `Booking ${bookingCode} untuk ${booking.client.name}, paket ${booking.package.name}, total Rp ${totalAmount.toLocaleString('id-ID')}`,
    type: 'CREATE',
  })

  return NextResponse.json({ data: booking }, { status: 201 })
}