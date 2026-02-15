/**
 * Studio Settings Validation Schemas
 */

import { z } from 'zod'

// ============================================
// UPDATE SETTINGS
// ============================================

export const updateSettingsSchema = z.object({
  key: z.string().min(1, 'Setting key is required'),
  value: z.string().min(1, 'Setting value is required'),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>

// ============================================
// BULK UPDATE SETTINGS
// ============================================

export const bulkUpdateSettingsSchema = z.object({
  settings: z.array(updateSettingsSchema).min(1, 'At least one setting is required'),
})

export type BulkUpdateSettingsInput = z.infer<typeof bulkUpdateSettingsSchema>
