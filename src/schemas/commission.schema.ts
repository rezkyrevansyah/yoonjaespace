/**
 * Commission Validation Schemas
 */

import { z } from 'zod'
import { paginationQuerySchema, monthFilterSchema } from './shared.schema'

// ============================================
// CREATE COMMISSION
// ============================================

export const createCommissionSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  month: z.number().int().min(1).max(12, 'Month must be between 1 and 12'),
  year: z.number().int().min(2020).max(2100, 'Year must be between 2020 and 2100'),
  totalBookings: z.number().int().nonnegative('Total bookings must be non-negative'),
  amount: z.number().nonnegative('Amount must be non-negative'),
  notes: z.string().optional(),
})

export type CreateCommissionInput = z.infer<typeof createCommissionSchema>

// ============================================
// QUERY FILTERS
// ============================================

export const commissionQuerySchema = paginationQuerySchema
  .merge(monthFilterSchema)
  .extend({
    userId: z.string().cuid().optional(),
    year: z.coerce.number().int().optional(),
  })

export type CommissionQuery = z.infer<typeof commissionQuerySchema>
