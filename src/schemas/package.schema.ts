/**
 * Package Validation Schemas
 */

import { z } from 'zod'
import { paginationQuerySchema, isActiveFilterSchema } from './shared.schema'

// ============================================
// CREATE PACKAGE
// ============================================

export const createPackageSchema = z.object({
  name: z.string().min(1, 'Package name is required'),
  description: z.string().optional(),
  price: z.number().nonnegative('Price must be non-negative'),
  duration: z.number().int().positive('Duration must be positive'),
  maxPeople: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
})

export type CreatePackageInput = z.infer<typeof createPackageSchema>

// ============================================
// UPDATE PACKAGE
// ============================================

export const updatePackageSchema = createPackageSchema.partial()

export type UpdatePackageInput = z.infer<typeof updatePackageSchema>

// ============================================
// QUERY FILTERS
// ============================================

export const packageQuerySchema = paginationQuerySchema.merge(isActiveFilterSchema)

export type PackageQuery = z.infer<typeof packageQuerySchema>
