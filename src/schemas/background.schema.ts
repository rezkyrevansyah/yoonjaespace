/**
 * Background Validation Schemas
 */

import { z } from 'zod'
import { paginationQuerySchema, isActiveFilterSchema } from './shared.schema'

// ============================================
// CREATE BACKGROUND
// ============================================

export const createBackgroundSchema = z.object({
  name: z.string().min(1, 'Background name is required'),
  isActive: z.boolean().default(true),
})

export type CreateBackgroundInput = z.infer<typeof createBackgroundSchema>

// ============================================
// UPDATE BACKGROUND
// ============================================

export const updateBackgroundSchema = createBackgroundSchema.partial()

export type UpdateBackgroundInput = z.infer<typeof updateBackgroundSchema>

// ============================================
// QUERY FILTERS
// ============================================

export const backgroundQuerySchema = paginationQuerySchema.merge(isActiveFilterSchema)

export type BackgroundQuery = z.infer<typeof backgroundQuerySchema>
