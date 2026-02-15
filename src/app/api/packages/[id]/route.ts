import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import {
  withAdmin,
  withErrorHandler,
  validateRequest,
  validateParams,
} from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { updatePackageSchema, idParamSchema } from '@/schemas'
import { apiLogger } from '@/lib/logger'

// PATCH — Update package
export const PATCH = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }, params) => {
    // Validate params
    const paramValidation = validateParams(params, idParamSchema)
    if (!paramValidation.success) return paramValidation.error

    const { id } = paramValidation.data

    // Validate request body
    const validation = await validateRequest(request, updatePackageSchema, 'body')
    if (!validation.success) return validation.error

    // Update package
    const pkg = await prisma.package.update({
      where: { id },
      data: validation.data,
    })

    apiLogger.info({
      msg: 'Package updated',
      packageId: id,
      updatedBy: user.id,
    })

    return ApiResponse.success(pkg)
  })
)

// DELETE — Soft delete package
export const DELETE = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }, params) => {
    // Validate params
    const paramValidation = validateParams(params, idParamSchema)
    if (!paramValidation.success) return paramValidation.error

    const { id } = paramValidation.data

    // Soft delete by setting isActive to false
    const pkg = await prisma.package.update({
      where: { id },
      data: { isActive: false },
    })

    apiLogger.info({
      msg: 'Package deleted',
      packageId: id,
      deletedBy: user.id,
    })

    return ApiResponse.success(pkg)
  })
)
