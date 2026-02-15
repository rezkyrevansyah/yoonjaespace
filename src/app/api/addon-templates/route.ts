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
import { addOnTemplateQuerySchema, createAddOnTemplateSchema } from '@/schemas'
import { apiLogger } from '@/lib/logger'

// GET — List add-on templates
export const GET = withAuth(
  withErrorHandler(async (request: NextRequest) => {
    const validation = await validateRequest(request, addOnTemplateQuerySchema, 'query')
    if (!validation.success) return validation.error

    const { isActive } = validation.data

    const where: Prisma.AddOnTemplateWhereInput =
      isActive !== undefined ? { isActive } : {}

    const templates = await prisma.addOnTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return ApiResponse.success(templates)
  })
)

// POST — Create add-on template
export const POST = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }) => {
    const validation = await validateRequest(request, createAddOnTemplateSchema, 'body')
    if (!validation.success) return validation.error

    const { name, defaultPrice, isActive } = validation.data

    const template = await prisma.addOnTemplate.create({
      data: { name, defaultPrice, isActive },
    })

    apiLogger.info({
      msg: 'Add-on template created',
      templateId: template.id,
      createdBy: user.id,
    })

    return ApiResponse.created(template)
  })
)
