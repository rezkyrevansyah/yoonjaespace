import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import {
  withAdmin,
  withErrorHandler,
  validateRequest,
  validateParams,
} from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { updateBackgroundSchema, idParamSchema } from '@/schemas'
import { apiLogger } from '@/lib/logger'

// PATCH — Update background
export const PATCH = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }, params) => {
    // Validate params
    const paramValidation = validateParams(params, idParamSchema)
    if (!paramValidation.success) return paramValidation.error

    const { id } = paramValidation.data

    // Validate request body
    const validation = await validateRequest(request, updateBackgroundSchema, 'body')
    if (!validation.success) return validation.error

    // Update background
    const background = await prisma.background.update({
      where: { id },
      data: validation.data,
    })

    apiLogger.info({
      msg: 'Background updated',
      backgroundId: id,
      updatedBy: user.id,
    })

    return ApiResponse.success(background)
  })
)

// DELETE — Soft delete background
export const DELETE = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }, params) => {
    // Validate params
    const paramValidation = validateParams(params, idParamSchema)
    if (!paramValidation.success) return paramValidation.error

    const { id } = paramValidation.data

    // Soft delete by setting isActive to false
    const background = await prisma.background.update({
      where: { id },
      data: { isActive: false },
    })

    apiLogger.info({
      msg: 'Background deleted',
      backgroundId: id,
      deletedBy: user.id,
    })

    return ApiResponse.success(background)
  })
)
