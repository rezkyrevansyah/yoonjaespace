import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import {
  withAdmin,
  withErrorHandler,
  validateRequest,
} from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { createVoucherSchema, voucherQuerySchema } from '@/schemas'
import { apiLogger } from '@/lib/logger'
import { Prisma } from '@prisma/client'

// GET — List vouchers
export const GET = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }) => {
    // Validate query parameters
    const validation = await validateRequest(request, voucherQuerySchema, 'query')
    if (!validation.success) return validation.error

    const { isActive, code } = validation.data

    // Build where clause
    const where: Prisma.VoucherWhereInput = {}

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    if (code) {
      where.code = { contains: code, mode: 'insensitive' }
    }

    // Fetch vouchers
    const vouchers = await prisma.voucher.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    apiLogger.info({
      msg: 'Vouchers fetched',
      userId: user.id,
      count: vouchers.length,
    })

    return ApiResponse.success(vouchers)
  })
)

// POST — Create voucher
export const POST = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }) => {
    // Validate request body
    const validation = await validateRequest(request, createVoucherSchema, 'body')
    if (!validation.success) return validation.error

    const { code, description, discountType, discountValue, minPurchase, maxUsage, isActive, validFrom, validUntil } = validation.data

    // Check unique code
    const existing = await prisma.voucher.findUnique({ where: { code } })
    if (existing) {
      return ApiResponse.conflict('Voucher code already exists')
    }

    // Create voucher
    const voucher = await prisma.voucher.create({
      data: {
        code,
        description: description || null,
        discountType,
        discountValue,
        minPurchase: minPurchase || null,
        maxUsage: maxUsage || null,
        isActive,
        validFrom: validFrom || null,
        validUntil: validUntil || null,
      },
    })

    apiLogger.info({
      msg: 'Voucher created',
      voucherId: voucher.id,
      code: voucher.code,
      createdBy: user.id,
    })

    return ApiResponse.created(voucher)
  })
)
