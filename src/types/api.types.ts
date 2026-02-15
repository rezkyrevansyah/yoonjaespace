/**
 * API Type Definitions
 *
 * This file contains TypeScript types for API requests, responses, and common patterns.
 */

import { Role, BookingStatus, PaymentStatus, PhotoFor, ExpenseCategory, PrintStatus } from '@prisma/client'

// ============================================
// PAGINATION
// ============================================

export type PaginationQuery = {
  page: number
  limit: number
}

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type PaginatedResponse<T> = {
  items: T[]
  pagination: PaginationMeta
}

// ============================================
// API RESPONSES
// ============================================

export type ApiSuccessResponse<T = unknown> = {
  data: T
}

export type ApiErrorResponse = {
  error: string
  details?: Record<string, unknown>
}

// ============================================
// QUERY FILTERS
// ============================================

export type DateRangeFilter = {
  gte?: Date
  lte?: Date
  lt?: Date
  gt?: Date
}

export type SearchFilter = {
  contains: string
  mode?: 'insensitive' | 'default'
}

// ============================================
// BOOKING TYPES
// ============================================

export type CreateBookingRequest = {
  // Client (either existing or new)
  clientId?: string
  clientName?: string
  clientPhone?: string
  clientEmail?: string

  // Schedule
  date: Date | string
  startTime: Date | string
  endTime: Date | string

  // Package
  packageId: string
  numberOfPeople?: number
  photoFor?: PhotoFor
  bts?: boolean

  // Pricing
  discountAmount?: number
  discountNote?: string

  // Details
  notes?: string
  internalNotes?: string

  // Relations
  backgroundIds?: string[]
  addOns?: AddOnItemInput[]
  customFields?: CustomFieldValueInput[]
}

export type UpdateBookingRequest = Partial<Omit<CreateBookingRequest, 'clientId' | 'clientName' | 'clientPhone' | 'clientEmail'>>

export type BookingQueryFilter = {
  status?: BookingStatus
  paymentStatus?: PaymentStatus
  date?: string
  month?: string
  search?: string
} & PaginationQuery

export type AddOnItemInput = {
  itemName: string
  quantity: number
  unitPrice: number
}

export type CustomFieldValueInput = {
  fieldId: string
  value: string
}

// ============================================
// CLIENT TYPES
// ============================================

export type CreateClientRequest = {
  name: string
  phone: string
  email?: string
  address?: string
  notes?: string
}

export type UpdateClientRequest = Partial<CreateClientRequest>

export type ClientQueryFilter = {
  search?: string
} & PaginationQuery

// ============================================
// PACKAGE TYPES
// ============================================

export type CreatePackageRequest = {
  name: string
  description?: string
  price: number
  duration: number
  maxPeople?: number
  isActive?: boolean
}

export type UpdatePackageRequest = Partial<CreatePackageRequest>

export type PackageQueryFilter = {
  isActive?: boolean
} & PaginationQuery

// ============================================
// USER TYPES
// ============================================

export type CreateUserRequest = {
  email: string
  password: string
  name: string
  role?: Role
  isActive?: boolean
}

export type UpdateUserRequest = {
  name?: string
  role?: Role
  isActive?: boolean
}

export type UserQueryFilter = {
  role?: Role
  isActive?: boolean
  search?: string
} & PaginationQuery

// ============================================
// EXPENSE TYPES
// ============================================

export type CreateExpenseRequest = {
  description: string
  amount: number
  category: ExpenseCategory
  date: Date | string
  relatedBookingId?: string
  notes?: string
}

export type UpdateExpenseRequest = Partial<CreateExpenseRequest>

export type ExpenseQueryFilter = {
  month?: string
  category?: ExpenseCategory
  startDate?: string
  endDate?: string
} & PaginationQuery

// ============================================
// VOUCHER TYPES
// ============================================

export type CreateVoucherRequest = {
  code: string
  description?: string
  discountType: 'fixed' | 'percentage'
  discountValue: number
  minPurchase?: number
  maxUsage?: number
  isActive?: boolean
  validFrom?: Date | string
  validUntil?: Date | string
}

export type UpdateVoucherRequest = Partial<CreateVoucherRequest>

export type VoucherQueryFilter = {
  isActive?: boolean
  code?: string
} & PaginationQuery

// ============================================
// PRINT ORDER TYPES
// ============================================

export type UpdatePrintOrderRequest = {
  status?: PrintStatus
  selectedPhotos?: string
  vendorName?: string
  vendorNotes?: string
  shippingAddress?: string
  courier?: string
  trackingNumber?: string
  shippedAt?: Date | string
}

// ============================================
// COMMISSION TYPES
// ============================================

export type CreateCommissionRequest = {
  userId: string
  month: number
  year: number
  totalBookings: number
  amount: number
  notes?: string
}

// ============================================
// CUSTOM FIELD TYPES
// ============================================

export type CreateCustomFieldDefinitionRequest = {
  fieldName: string
  fieldType?: 'text' | 'select' | 'boolean'
  options?: string
  isRequired?: boolean
  isActive?: boolean
  sortOrder?: number
}

export type UpdateCustomFieldDefinitionRequest = Partial<CreateCustomFieldDefinitionRequest>

// ============================================
// AUTH TYPES
// ============================================

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  user: {
    id: string
    email: string
    name: string
    role: Role
  }
}

// ============================================
// FINANCE TYPES
// ============================================

export type FinanceSummaryQuery = {
  month?: string
}

export type FinanceSummaryResponse = {
  period: {
    start: Date
    end: Date
  }
  income: number
  expense: number
  grossProfit: number
  expenseByCategory: Record<string, number>
  bookingStats: {
    total: number
    cancelled: number
  }
}
