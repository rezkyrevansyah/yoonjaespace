import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import {
  withAuth,
  withErrorHandler,
  validateRequest,
} from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { validateVoucherSchema } from '@/schemas'
import { apiLogger } from '@/lib/logger'

// POST — Validate voucher code
export const POST = withAuth(
  withErrorHandler(async (request: NextRequest, { user }) => {
    // Validate request body
    const validation = await validateRequest(request, validateVoucherSchema, 'body')
    if (!validation.success) return validation.error

    const { code, purchaseAmount } = validation.data

    // Find voucher
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!voucher) {
      return ApiResponse.notFound('Voucher')
    }

    if (!voucher.isActive) {
      return ApiResponse.validationError('Voucher is not active')
    }

    // Check validity period
    const now = new Date()
    if (voucher.validFrom && now < voucher.validFrom) {
      return ApiResponse.validationError('Voucher is not yet valid')
    }
    if (voucher.validUntil && now > voucher.validUntil) {
      return ApiResponse.validationError('Voucher has expired')
    }

    // Check max usage
    if (voucher.maxUsage && voucher.usedCount >= voucher.maxUsage) {
      return ApiResponse.validationError('Voucher has reached maximum usage limit')
    }

    // Check min purchase
    if (voucher.minPurchase && purchaseAmount < voucher.minPurchase) {
      return ApiResponse.validationError(
        `Minimum purchase amount is ${voucher.minPurchase.toLocaleString('id-ID')}`
      )
    }

    // Calculate discount
    let discountAmount = 0
    if (voucher.discountType === 'fixed') {
      discountAmount = voucher.discountValue
    } else if (voucher.discountType === 'percentage') {
      discountAmount = (purchaseAmount * voucher.discountValue) / 100
    }

    apiLogger.info({
      msg: 'Voucher validated',
      voucherCode: code,
      userId: user.id,
      discountAmount,
    })

    return ApiResponse.success({
      valid: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        discountAmount,
      },
    })
  })
)
