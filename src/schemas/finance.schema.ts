/**
 * Finance Validation Schemas
 */

import { z } from 'zod'
import { monthFilterSchema } from './shared.schema'

// ============================================
// FINANCE SUMMARY QUERY
// ============================================

export const financeSummaryQuerySchema = monthFilterSchema

export type FinanceSummaryQuery = z.infer<typeof financeSummaryQuerySchema>

// ============================================
// FINANCE EXPORT QUERY
// ============================================

export const financeExportQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  type: z.enum(['bookings', 'expenses', 'summary']).default('summary'),
})

export type FinanceExportQuery = z.infer<typeof financeExportQuerySchema>
