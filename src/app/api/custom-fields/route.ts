import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import {
  withAuth,
  withAdmin,
  withErrorHandler,
  validateRequest,
} from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { createCustomFieldDefinitionSchema, customFieldQuerySchema } from '@/schemas'
import { apiLogger } from '@/lib/logger'
import { Prisma } from '@prisma/client'

// GET — List custom field definitions
export const GET = withAuth(
  withErrorHandler(async (request: NextRequest, { user }) => {
    // Validate query parameters
    const validation = await validateRequest(request, customFieldQuerySchema, 'query')
    if (!validation.success) return validation.error

    const { isActive } = validation.data

    // Build where clause
    const where: Prisma.CustomFieldDefinitionWhereInput = {}
    if (isActive !== undefined) {
      where.isActive = isActive
    }

    // Fetch custom field definitions
    const fields = await prisma.customFieldDefinition.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    })

    apiLogger.info({
      msg: 'Custom field definitions fetched',
      userId: user.id,
      count: fields.length,
    })

    return ApiResponse.success(fields)
  })
)

// POST — Create custom field
export const POST = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }) => {
    // Validate request body
    const validation = await validateRequest(request, createCustomFieldDefinitionSchema, 'body')
    if (!validation.success) return validation.error

    const { fieldName, fieldType, options, isRequired, isActive, sortOrder } = validation.data

    // Create custom field definition
    const field = await prisma.customFieldDefinition.create({
      data: {
        fieldName,
        fieldType,
        options: options || null,
        isRequired,
        isActive,
        sortOrder,
      },
    })

    apiLogger.info({
      msg: 'Custom field definition created',
      fieldId: field.id,
      createdBy: user.id,
    })

    return ApiResponse.created(field)
  })
)
