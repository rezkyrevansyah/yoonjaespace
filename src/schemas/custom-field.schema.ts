/**
 * Custom Field Validation Schemas
 */

import { z } from 'zod'
import { paginationQuerySchema, isActiveFilterSchema } from './shared.schema'

// ============================================
// CREATE CUSTOM FIELD DEFINITION
// ============================================

export const createCustomFieldDefinitionSchema = z.object({
  fieldName: z.string().min(1, 'Field name is required'),
  fieldType: z.enum(['text', 'select', 'boolean']).default('text'),
  options: z.string().optional(), // JSON string for select options
  isRequired: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().nonnegative().default(0),
}).refine(
  (data) => {
    if (data.fieldType === 'select' && !data.options) {
      return false
    }
    return true
  },
  {
    message: 'Options are required for select field type',
    path: ['options'],
  }
)

export type CreateCustomFieldDefinitionInput = z.infer<typeof createCustomFieldDefinitionSchema>

// ============================================
// UPDATE CUSTOM FIELD DEFINITION
// ============================================

export const updateCustomFieldDefinitionSchema = createCustomFieldDefinitionSchema.partial()

export type UpdateCustomFieldDefinitionInput = z.infer<typeof updateCustomFieldDefinitionSchema>

// ============================================
// QUERY FILTERS
// ============================================

export const customFieldQuerySchema = paginationQuerySchema.merge(isActiveFilterSchema)

export type CustomFieldQuery = z.infer<typeof customFieldQuerySchema>
