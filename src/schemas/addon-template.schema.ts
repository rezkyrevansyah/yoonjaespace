/**
 * Add-on Template Validation Schemas
 */

import { z } from 'zod'
import { paginationQuerySchema, isActiveFilterSchema } from './shared.schema'

// ============================================
// CREATE ADD-ON TEMPLATE
// ============================================

export const createAddOnTemplateSchema = z.object({
  name: z.string().min(1, 'Add-on name is required'),
  defaultPrice: z.number().nonnegative('Default price must be non-negative'),
  isActive: z.boolean().default(true),
})

export type CreateAddOnTemplateInput = z.infer<typeof createAddOnTemplateSchema>

// ============================================
// UPDATE ADD-ON TEMPLATE
// ============================================

export const updateAddOnTemplateSchema = createAddOnTemplateSchema.partial()

export type UpdateAddOnTemplateInput = z.infer<typeof updateAddOnTemplateSchema>

// ============================================
// QUERY FILTERS
// ============================================

export const addOnTemplateQuerySchema = paginationQuerySchema.merge(isActiveFilterSchema)

export type AddOnTemplateQuery = z.infer<typeof addOnTemplateQuerySchema>
