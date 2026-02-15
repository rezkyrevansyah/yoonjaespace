/**
 * Voucher Validation Schemas
 */

import { z } from 'zod'
import { paginationQuerySchema, isActiveFilterSchema } from './shared.schema'

// ============================================
// CREATE VOUCHER
// ============================================

export const createVoucherSchema = z.object({
  code: z.string().min(1, 'Voucher code is required').toUpperCase(),
  description: z.string().optional(),
  discountType: z.enum(['fixed', 'percentage']),
  discountValue: z.number().positive('Discount value must be positive'),
  minPurchase: z.number().nonnegative().optional(),
  maxUsage: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.discountType === 'percentage') {
      return data.discountValue <= 100
    }
    return true
  },
  {
    message: 'Percentage discount cannot exceed 100%',
    path: ['discountValue'],
  }
).refine(
  (data) => {
    if (data.validFrom && data.validUntil) {
      return data.validUntil > data.validFrom
    }
    return true
  },
  {
    message: 'Valid until date must be after valid from date',
    path: ['validUntil'],
  }
)

export type CreateVoucherInput = z.infer<typeof createVoucherSchema>

// ============================================
// UPDATE VOUCHER
// ============================================

export const updateVoucherSchema = createVoucherSchema.partial()

export type UpdateVoucherInput = z.infer<typeof updateVoucherSchema>

// ============================================
// QUERY FILTERS
// ============================================

export const voucherQuerySchema = paginationQuerySchema
  .merge(isActiveFilterSchema)
  .extend({
    code: z.string().optional(),
  })

export type VoucherQuery = z.infer<typeof voucherQuerySchema>

// ============================================
// VALIDATE VOUCHER
// ============================================

export const validateVoucherSchema = z.object({
  code: z.string().min(1, 'Voucher code is required'),
  purchaseAmount: z.number().nonnegative('Purchase amount must be non-negative'),
})

export type ValidateVoucherInput = z.infer<typeof validateVoucherSchema>
