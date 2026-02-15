/**
 * Authentication Validation Schemas
 */

import { z } from 'zod'

// ============================================
// LOGIN
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>
