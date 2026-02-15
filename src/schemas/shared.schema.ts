/**
 * Shared Zod Schemas
 *
 * Common validation schemas used across multiple API routes
 */

import { z } from 'zod'

// ============================================
// PAGINATION
// ============================================

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>

// ============================================
// COMMON PARAMS
// ============================================

export const idParamSchema = z.object({
  id: z.string().cuid(),
})

export const slugParamSchema = z.object({
  slug: z.string().min(1),
})

// ============================================
// DATE FILTERS
// ============================================

export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

export const monthFilterSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format').optional(),
})

export const singleDateSchema = z.object({
  date: z.coerce.date().optional(),
})

// ============================================
// SEARCH
// ============================================

export const searchQuerySchema = z.object({
  search: z.string().optional(),
})

// ============================================
// BOOLEAN FILTERS
// ============================================

export const isActiveFilterSchema = z.object({
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined
      return val === 'true'
    }),
})

// ============================================
// RESPONSE SCHEMAS
// ============================================

export const errorResponseSchema = z.object({
  error: z.string(),
  details: z.record(z.string(), z.any()).optional(),
})

export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
})

// ============================================
// HELPERS
// ============================================

/**
 * Creates a paginated response schema
 */
export function paginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })
}
