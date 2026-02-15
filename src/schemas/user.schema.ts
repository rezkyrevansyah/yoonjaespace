/**
 * User Validation Schemas
 */

import { z } from 'zod'
import { Role } from '@prisma/client'
import { paginationQuerySchema, searchQuerySchema, isActiveFilterSchema } from './shared.schema'

// ============================================
// CREATE USER
// ============================================

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.nativeEnum(Role).default('ADMIN'),
  isActive: z.boolean().default(true),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

// ============================================
// UPDATE USER
// ============================================

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

// ============================================
// QUERY FILTERS
// ============================================

export const userQuerySchema = paginationQuerySchema
  .merge(searchQuerySchema)
  .merge(isActiveFilterSchema)
  .extend({
    role: z.nativeEnum(Role).optional(),
  })

export type UserQuery = z.infer<typeof userQuerySchema>
