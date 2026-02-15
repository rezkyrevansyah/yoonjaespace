import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import {
  withAuth,
  withAdmin,
  withOwner,
  withErrorHandler,
  validateRequest,
  validateParams,
} from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { updateClientSchema, idParamSchema } from '@/schemas'
import { apiLogger } from '@/lib/logger'

// GET — Get single client with booking history
export const GET = withAuth(
  withErrorHandler(async (request: NextRequest, { user }, params) => {
    // Validate params
    const paramValidation = validateParams(params, idParamSchema)
    if (!paramValidation.success) return paramValidation.error

    const { id } = paramValidation.data

    // Fetch client with bookings
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            package: true,
            handledBy: { select: { id: true, name: true } },
            printOrder: true,
          },
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!client) {
      return ApiResponse.notFound('Client')
    }

    // Calculate summary
    const totalBookings = client.bookings.length
    const totalSpent = client.bookings
      .filter((b) => b.paymentStatus === 'PAID')
      .reduce((sum, b) => sum + b.totalAmount, 0)
    const lastVisit = client.bookings.length > 0 ? client.bookings[0].date : null

    apiLogger.info({
      msg: 'Client fetched',
      clientId: id,
      userId: user.id,
    })

    return ApiResponse.success({
      ...client,
      summary: {
        totalBookings,
        totalSpent,
        lastVisit,
      },
    })
  })
)

// PATCH — Update client
export const PATCH = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }, params) => {
    // Validate params
    const paramValidation = validateParams(params, idParamSchema)
    if (!paramValidation.success) return paramValidation.error

    const { id } = paramValidation.data

    // Validate request body
    const validation = await validateRequest(request, updateClientSchema, 'body')
    if (!validation.success) return validation.error

    // Check if client exists
    const existing = await prisma.client.findUnique({ where: { id } })
    if (!existing) {
      return ApiResponse.notFound('Client')
    }

    // Update client
    const client = await prisma.client.update({
      where: { id },
      data: validation.data,
    })

    apiLogger.info({
      msg: 'Client updated',
      clientId: id,
      updatedBy: user.id,
    })

    return ApiResponse.success(client)
  })
)

// DELETE — Delete client (Owner only, only if no bookings exist)
export const DELETE = withOwner(
  withErrorHandler(async (request: NextRequest, { user }, params) => {
    // Validate params
    const paramValidation = validateParams(params, idParamSchema)
    if (!paramValidation.success) return paramValidation.error

    const { id } = paramValidation.data

    // Check if client has bookings
    const bookingCount = await prisma.booking.count({
      where: { clientId: id },
    })

    if (bookingCount > 0) {
      return ApiResponse.validationError(
        `Cannot delete client with ${bookingCount} existing bookings. Please delete all bookings first.`
      )
    }

    // Delete client
    await prisma.client.delete({ where: { id } })

    apiLogger.info({
      msg: 'Client deleted',
      clientId: id,
      deletedBy: user.id,
    })

    return ApiResponse.success({ success: true })
  })
)
