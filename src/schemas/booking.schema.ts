/**
 * Booking Validation Schemas
 *
 * Zod schemas for booking-related API routes
 */

import { z } from 'zod'
import { BookingStatus, PaymentStatus, PhotoFor } from '@prisma/client'
import { paginationQuerySchema } from './shared.schema'

// ============================================
// NESTED SCHEMAS
// ============================================

export const addOnItemSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit price must be non-negative'),
})

export const customFieldValueSchema = z.object({
  fieldId: z.string().cuid('Invalid field ID'),
  value: z.string().min(1, 'Field value is required'),
})

// ============================================
// CREATE BOOKING
// ============================================

export const createBookingSchema = z
  .object({
    // Client (either existing or new)
    clientId: z.string().cuid().optional(),
    clientName: z.string().min(1).optional(),
    clientPhone: z.string().min(1).optional(),
    clientEmail: z.string().email().optional().or(z.literal('')),

    // Schedule
    date: z.coerce.date(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),

    // Package
    packageId: z.string().cuid('Invalid package ID'),
    numberOfPeople: z.number().int().positive().default(1),
    photoFor: z.nativeEnum(PhotoFor).default('OTHER'),
    bts: z.boolean().default(false),

    // Pricing
    discountAmount: z.number().nonnegative().default(0),
    discountNote: z.string().optional(),

    // Details
    notes: z.string().optional(),
    internalNotes: z.string().optional(),

    // Relations
    backgroundIds: z.array(z.string().cuid()).default([]),
    addOns: z.array(addOnItemSchema).default([]),
    customFields: z.array(customFieldValueSchema).default([]),
  })
  .refine(
    (data) => data.clientId || (data.clientName && data.clientPhone),
    {
      message: 'Either clientId or (clientName and clientPhone) must be provided',
      path: ['clientId'],
    }
  )
  .refine(
    (data) => data.endTime > data.startTime,
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  )

export type CreateBookingInput = z.infer<typeof createBookingSchema>

// ============================================
// UPDATE BOOKING
// ============================================

export const updateBookingSchema = z
  .object({
    // Schedule
    date: z.coerce.date().optional(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),

    // Package
    packageId: z.string().cuid().optional(),
    numberOfPeople: z.number().int().positive().optional(),
    photoFor: z.nativeEnum(PhotoFor).optional(),
    bts: z.boolean().optional(),

    // Status
    status: z.nativeEnum(BookingStatus).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),

    // Pricing
    discountAmount: z.number().nonnegative().optional(),
    discountNote: z.string().optional(),

    // Delivery
    photoLink: z.string().url().optional().or(z.literal('')),
    deliveredAt: z.coerce.date().optional(),

    // Details
    notes: z.string().optional(),
    internalNotes: z.string().optional(),

    // Relations (replace)
    backgroundIds: z.array(z.string().cuid()).optional(),
    addOns: z.array(addOnItemSchema).optional(),
    customFields: z.array(customFieldValueSchema).optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime
      }
      return true
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  )

export type UpdateBookingInput = z.infer<typeof updateBookingSchema>

// ============================================
// QUERY FILTERS
// ============================================

export const bookingQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(BookingStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  date: z.coerce.date().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  search: z.string().optional(),
})

export type BookingQuery = z.infer<typeof bookingQuerySchema>

// ============================================
// UPDATE STATUS
// ============================================

export const updateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  photoLink: z.string().url().optional().or(z.literal('')),
  deliveredAt: z.coerce.date().optional(),
})

export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>
