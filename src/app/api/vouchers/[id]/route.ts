import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import {
  withAdmin,
  withErrorHandler,
  validateRequest,
  validateParams,
} from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { updateVoucherSchema, idParamSchema } from '@/schemas'
import { apiLogger } from '@/lib/logger'

// PATCH — Update voucher
export const PATCH = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }, params) => {
    // Validate params
    const paramValidation = validateParams(params, idParamSchema)
    if (!paramValidation.success) return paramValidation.error

    const { id } = paramValidation.data

    // Validate request body
    const validation = await validateRequest(request, updateVoucherSchema, 'body')
    if (!validation.success) return validation.error

    const { code, ...otherData } = validation.data

    // Check unique code if changed
    if (code) {
      const existing = await prisma.voucher.findFirst({
        where: { code, NOT: { id } },
      })
      if (existing) {
        return ApiResponse.conflict('Voucher code already exists')
      }
    }

    // Update voucher
    const voucher = await prisma.voucher.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...otherData,
      },
    })

    apiLogger.info({
      msg: 'Voucher updated',
      voucherId: id,
      updatedBy: user.id,
    })

    return ApiResponse.success(voucher)
  })
)

// DELETE — Delete voucher
export const DELETE = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }, params) => {
    // Validate params
    const paramValidation = validateParams(params, idParamSchema)
    if (!paramValidation.success) return paramValidation.error

    const { id } = paramValidation.data

    // Delete voucher
    await prisma.voucher.delete({ where: { id } })

    apiLogger.info({
      msg: 'Voucher deleted',
      voucherId: id,
      deletedBy: user.id,
    })

    return ApiResponse.success({ success: true })
  })
)
