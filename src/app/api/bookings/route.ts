import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { nanoid } from 'nanoid'
import { format } from 'date-fns'
import {
  withAuth,
  withAdmin,
  withErrorHandler,
  validateRequest,
  NotFoundError,
} from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { bookingQuerySchema, createBookingSchema } from '@/schemas'
import { apiLogger } from '@/lib/logger'

// GET — List bookings with filters
export const GET = withAuth(
  withErrorHandler(async (request: NextRequest, { user }) => {
    // Validate query parameters
    const validation = await validateRequest(request, bookingQuerySchema, 'query')
    if (!validation.success) return validation.error

    const { status, date, month, search, page, limit } = validation.data
    const skip = (page - 1) * limit

    // Build where clause with proper typing
    const where: Prisma.BookingWhereInput = {}

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

    // Packaging staff only see orders with print
    if (user.role === 'PACKAGING_STAFF') {
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

    apiLogger.info({
      msg: 'Bookings fetched',
      userId: user.id,
      count: bookings.length,
      filters: { status, date, month, search },
    })

    return ApiResponse.paginated(bookings, page, limit, total)
  })
)

// POST — Create new booking
export const POST = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }) => {
    // Validate request body
    const validation = await validateRequest(request, createBookingSchema, 'body')
    if (!validation.success) return validation.error

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
    } = validation.data

    // Get or create client
    let finalClientId: string

    if (clientId) {
      finalClientId = clientId
    } else {
      const newClient = await prisma.client.create({
        data: {
          name: clientName!,
          phone: clientPhone!,
          email: clientEmail || null,
        },
      })
      finalClientId = newClient.id
    }

    // Get package for price snapshot
    const pkg = await prisma.package.findUnique({ where: { id: packageId } })

    if (!pkg) {
      throw new NotFoundError('Package')
    }

    // Calculate total add-ons
    const addOnsTotal = addOns.reduce(
      (sum, ao) => sum + ao.quantity * ao.unitPrice,
      0
    )

    // Calculate total
    const totalAmount = pkg.price + addOnsTotal - discountAmount

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
        numberOfPeople,
        photoFor,
        bts,
        status: defaultPayment === 'PAID' ? 'PAID' : 'BOOKED',
        paymentStatus: defaultPayment,
        packagePrice: pkg.price,
        discountAmount,
        discountNote: discountNote || null,
        totalAmount,
        notes: notes || null,
        internalNotes: internalNotes || null,
        handledById: user.id,

        // Backgrounds
        bookingBackgrounds: backgroundIds.length
          ? {
              create: backgroundIds.map((bgId) => ({
                backgroundId: bgId,
              })),
            }
          : undefined,

        // Add-ons
        addOns: addOns.length
          ? {
              create: addOns.map((ao) => ({
                itemName: ao.itemName,
                quantity: ao.quantity,
                unitPrice: ao.unitPrice,
                subtotal: ao.quantity * ao.unitPrice,
              })),
            }
          : undefined,

        // Custom fields
        customFields: customFields.length
          ? {
              create: customFields.map((cf) => ({
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

    apiLogger.info({
      msg: 'Booking created',
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      createdBy: user.id,
      totalAmount,
    })

    return ApiResponse.created(booking)
  })
)
