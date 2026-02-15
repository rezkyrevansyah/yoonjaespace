import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import {
  withAdmin,
  withErrorHandler,
  validateRequest,
  validateParams,
} from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { updateCustomFieldDefinitionSchema, idParamSchema } from '@/schemas'
import { apiLogger } from '@/lib/logger'

// PATCH — Update custom field
export const PATCH = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }, params) => {
    // Validate params
    const paramValidation = validateParams(params, idParamSchema)
    if (!paramValidation.success) return paramValidation.error

    const { id } = paramValidation.data

    // Validate request body
    const validation = await validateRequest(request, updateCustomFieldDefinitionSchema, 'body')
    if (!validation.success) return validation.error

    // Update custom field definition
    const field = await prisma.customFieldDefinition.update({
      where: { id },
      data: validation.data,
    })

    apiLogger.info({
      msg: 'Custom field definition updated',
      fieldId: id,
      updatedBy: user.id,
    })

    return ApiResponse.success(field)
  })
)

// DELETE — Soft delete custom field
export const DELETE = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }, params) => {
    // Validate params
    const paramValidation = validateParams(params, idParamSchema)
    if (!paramValidation.success) return paramValidation.error

    const { id } = paramValidation.data

    // Soft delete by setting isActive to false
    const field = await prisma.customFieldDefinition.update({
      where: { id },
      data: { isActive: false },
    })

    apiLogger.info({
      msg: 'Custom field definition deleted',
      fieldId: id,
      deletedBy: user.id,
    })

    return ApiResponse.success(field)
  })
)
