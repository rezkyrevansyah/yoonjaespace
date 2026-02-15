/**
 * Expense Validation Schemas
 */

import { z } from 'zod'
import { ExpenseCategory } from '@prisma/client'
import { paginationQuerySchema, monthFilterSchema } from './shared.schema'

// ============================================
// CREATE EXPENSE
// ============================================

export const createExpenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  category: z.nativeEnum(ExpenseCategory),
  date: z.coerce.date(),
  relatedBookingId: z.string().cuid().optional(),
  notes: z.string().optional(),
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>

// ============================================
// UPDATE EXPENSE
// ============================================

export const updateExpenseSchema = createExpenseSchema.partial()

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>

// ============================================
// QUERY FILTERS
// ============================================

export const expenseQuerySchema = paginationQuerySchema
  .merge(monthFilterSchema)
  .extend({
    category: z.nativeEnum(ExpenseCategory).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })

export type ExpenseQuery = z.infer<typeof expenseQuerySchema>
