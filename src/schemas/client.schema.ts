/**
 * Client Validation Schemas
 */

import { z } from 'zod'
import { paginationQuerySchema, searchQuerySchema } from './shared.schema'

// ============================================
// CREATE CLIENT
// ============================================

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export type CreateClientInput = z.infer<typeof createClientSchema>

// ============================================
// UPDATE CLIENT
// ============================================

export const updateClientSchema = createClientSchema.partial()

export type UpdateClientInput = z.infer<typeof updateClientSchema>

// ============================================
// QUERY FILTERS
// ============================================

export const clientQuerySchema = paginationQuerySchema.merge(searchQuerySchema)

export type ClientQuery = z.infer<typeof clientQuerySchema>
