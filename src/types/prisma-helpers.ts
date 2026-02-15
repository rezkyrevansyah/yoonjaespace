/**
 * Prisma Type Helpers
 *
 * This file exports Prisma-generated types for reuse across the application.
 * It eliminates the need for `any` types in query building and data manipulation.
 */

import { Prisma } from '@prisma/client'

// ============================================
// WHERE INPUT TYPES (for filtering)
// ============================================

export type BookingWhereInput = Prisma.BookingWhereInput
export type ClientWhereInput = Prisma.ClientWhereInput
export type PackageWhereInput = Prisma.PackageWhereInput
export type UserWhereInput = Prisma.UserWhereInput
export type ExpenseWhereInput = Prisma.ExpenseWhereInput
export type VoucherWhereInput = Prisma.VoucherWhereInput
export type BackgroundWhereInput = Prisma.BackgroundWhereInput
export type AddOnTemplateWhereInput = Prisma.AddOnTemplateWhereInput
export type CustomFieldDefinitionWhereInput = Prisma.CustomFieldDefinitionWhereInput
export type CommissionWhereInput = Prisma.CommissionWhereInput
export type PrintOrderWhereInput = Prisma.PrintOrderWhereInput

// ============================================
// UPDATE INPUT TYPES (for updates)
// ============================================

export type BookingUpdateInput = Prisma.BookingUpdateInput
export type ClientUpdateInput = Prisma.ClientUpdateInput
export type PackageUpdateInput = Prisma.PackageUpdateInput
export type UserUpdateInput = Prisma.UserUpdateInput
export type ExpenseUpdateInput = Prisma.ExpenseUpdateInput
export type VoucherUpdateInput = Prisma.VoucherUpdateInput
export type PrintOrderUpdateInput = Prisma.PrintOrderUpdateInput

// ============================================
// NESTED CREATE/UPDATE TYPES
// ============================================

export type AddOnInput = {
  itemName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export type CustomFieldInput = {
  fieldId: string
  value: string
}

export type BackgroundIdInput = {
  backgroundId: string
}

// ============================================
// INCLUDE TYPES (for relations)
// ============================================

export type BookingInclude = Prisma.BookingInclude
export type ClientInclude = Prisma.ClientInclude
export type UserInclude = Prisma.UserInclude
export type ExpenseInclude = Prisma.ExpenseInclude

// ============================================
// SELECT TYPES (for field selection)
// ============================================

export type BookingSelect = Prisma.BookingSelect
export type ClientSelect = Prisma.ClientSelect
export type UserSelect = Prisma.UserSelect

// ============================================
// ORDER BY TYPES (for sorting)
// ============================================

export type BookingOrderByWithRelationInput = Prisma.BookingOrderByWithRelationInput
export type ClientOrderByWithRelationInput = Prisma.ClientOrderByWithRelationInput
export type ExpenseOrderByWithRelationInput = Prisma.ExpenseOrderByWithRelationInput
