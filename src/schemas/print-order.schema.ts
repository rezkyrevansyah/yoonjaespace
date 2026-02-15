/**
 * Print Order Validation Schemas
 */

import { z } from 'zod'
import { PrintStatus } from '@prisma/client'

// ============================================
// UPDATE PRINT ORDER
// ============================================

export const updatePrintOrderSchema = z.object({
  status: z.nativeEnum(PrintStatus).optional(),
  selectedPhotos: z.string().optional(),
  vendorName: z.string().optional(),
  vendorNotes: z.string().optional(),
  shippingAddress: z.string().optional(),
  courier: z.string().optional(),
  trackingNumber: z.string().optional(),
  shippedAt: z.coerce.date().optional(),
})

export type UpdatePrintOrderInput = z.infer<typeof updatePrintOrderSchema>
