import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { NextRequest } from 'next/server'
import {
  withOwner,
  withErrorHandler,
  validateRequest,
  validateParams,
} from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { updateUserSchema, idParamSchema } from '@/schemas'
import { apiLogger } from '@/lib/logger'
import { z } from 'zod'

// Schema for password update
const updateUserWithPasswordSchema = updateUserSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
})

// GET — Get single user
export const GET = withOwner(
  withErrorHandler(async (request: NextRequest, { user }, params) => {
    // Validate params
    const paramValidation = validateParams(params, idParamSchema)
    if (!paramValidation.success) return paramValidation.error

    const { id } = paramValidation.data

    // Fetch user
    const targetUser = await prisma.user.findUnique({ where: { id } })

    if (!targetUser) {
      return ApiResponse.notFound('User')
    }

    apiLogger.info({
      msg: 'User fetched',
      userId: user.id,
      targetUserId: id,
    })

    return ApiResponse.success(targetUser)
  })
)

// PATCH — Update user
export const PATCH = withOwner(
  withErrorHandler(async (request: NextRequest, { user }, params) => {
    // Validate params
    const paramValidation = validateParams(params, idParamSchema)
    if (!paramValidation.success) return paramValidation.error

    const { id } = paramValidation.data

    // Validate request body
    const validation = await validateRequest(request, updateUserWithPasswordSchema, 'body')
    if (!validation.success) return validation.error

    const { password, ...updateData } = validation.data

    // Update password in Supabase Auth if provided
    if (password) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password })
      if (error) {
        apiLogger.error({
          msg: 'Failed to update password in Supabase Auth',
          error: error.message,
        })
        return ApiResponse.error(error.message, 400)
      }
    }

    // Update in database
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    apiLogger.info({
      msg: 'User updated',
      targetUserId: id,
      updatedBy: user.id,
    })

    return ApiResponse.success(updatedUser)
  })
)

// DELETE — Delete user
export const DELETE = withOwner(
  withErrorHandler(async (request: NextRequest, { user }, params) => {
    // Validate params
    const paramValidation = validateParams(params, idParamSchema)
    if (!paramValidation.success) return paramValidation.error

    const { id } = paramValidation.data

    // Prevent self-deletion
    if (id === user.id) {
      return ApiResponse.error('Cannot delete your own account', 400)
    }

    // Delete from Supabase Auth
    await supabaseAdmin.auth.admin.deleteUser(id)

    // Delete from database
    await prisma.user.delete({ where: { id } })

    apiLogger.info({
      msg: 'User deleted',
      deletedUserId: id,
      deletedBy: user.id,
    })

    return ApiResponse.success({ success: true })
  })
)
