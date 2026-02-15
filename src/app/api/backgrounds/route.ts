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
import { backgroundQuerySchema, createBackgroundSchema } from '@/schemas'
import { apiLogger } from '@/lib/logger'

// GET — List backgrounds
export const GET = withAuth(
  withErrorHandler(async (request: NextRequest) => {
    const validation = await validateRequest(request, backgroundQuerySchema, 'query')
    if (!validation.success) return validation.error

    const { isActive } = validation.data

    const where: Prisma.BackgroundWhereInput =
      isActive !== undefined ? { isActive } : {}

    const backgrounds = await prisma.background.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return ApiResponse.success(backgrounds)
  })
)

// POST — Create background
export const POST = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }) => {
    const validation = await validateRequest(request, createBackgroundSchema, 'body')
    if (!validation.success) return validation.error

    const { name, isActive } = validation.data

    const background = await prisma.background.create({
      data: { name, isActive },
    })

    apiLogger.info({
      msg: 'Background created',
      backgroundId: background.id,
      createdBy: user.id,
    })

    return ApiResponse.created(background)
  })
)
