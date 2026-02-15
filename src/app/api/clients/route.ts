import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import {
  withAuth,
  withAdmin,
  withErrorHandler,
  validateRequest,
} from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { clientQuerySchema, createClientSchema } from '@/schemas'
import { apiLogger } from '@/lib/logger'

// GET — List clients with search
export const GET = withAuth(
  withErrorHandler(async (request: NextRequest, { user }) => {
    // Validate query parameters with Zod
    const validation = await validateRequest(request, clientQuerySchema, 'query')
    if (!validation.success) return validation.error

    const { search, page, limit } = validation.data
    const skip = (page - 1) * limit

    // Build where clause with proper typing
    const where: Prisma.ClientWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}

    // Execute query
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.client.count({ where }),
    ])

    apiLogger.info({
      msg: 'Clients fetched',
      userId: user.id,
      count: clients.length,
      search,
    })

    return ApiResponse.paginated(clients, page, limit, total)
  })
)

// POST — Create new client
export const POST = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }) => {
    // Validate request body with Zod
    const validation = await validateRequest(request, createClientSchema, 'body')
    if (!validation.success) return validation.error

    const { name, phone, email, address, notes } = validation.data

    // Create client
    const client = await prisma.client.create({
      data: {
        name,
        phone,
        email: email || null,
        address: address || null,
        notes: notes || null,
      },
    })

    apiLogger.info({
      msg: 'Client created',
      clientId: client.id,
      createdBy: user.id,
    })

    return ApiResponse.created(client)
  })
)
