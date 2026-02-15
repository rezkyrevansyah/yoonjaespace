import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import {
  withAdmin,
  withErrorHandler,
  validateRequest,
  validateParams,
} from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { updateAddOnTemplateSchema, idParamSchema } from '@/schemas'
import { apiLogger } from '@/lib/logger'

// PATCH — Update add-on template
export const PATCH = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }, params) => {
    // Validate params
    const paramValidation = validateParams(params, idParamSchema)
    if (!paramValidation.success) return paramValidation.error

    const { id } = paramValidation.data

    // Validate request body
    const validation = await validateRequest(request, updateAddOnTemplateSchema, 'body')
    if (!validation.success) return validation.error

    // Update add-on template
    const addOnTemplate = await prisma.addOnTemplate.update({
      where: { id },
      data: validation.data,
    })

    apiLogger.info({
      msg: 'Add-on template updated',
      addOnTemplateId: id,
      updatedBy: user.id,
    })

    return ApiResponse.success(addOnTemplate)
  })
)

// DELETE — Soft delete
export const DELETE = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }, params) => {
    // Validate params
    const paramValidation = validateParams(params, idParamSchema)
    if (!paramValidation.success) return paramValidation.error

    const { id } = paramValidation.data

    // Soft delete by setting isActive to false
    const addOnTemplate = await prisma.addOnTemplate.update({
      where: { id },
      data: { isActive: false },
    })

    apiLogger.info({
      msg: 'Add-on template deleted',
      addOnTemplateId: id,
      deletedBy: user.id,
    })

    return ApiResponse.success(addOnTemplate)
  })
)
