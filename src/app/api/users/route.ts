import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { NextRequest } from 'next/server'
import {
  withOwner,
  withErrorHandler,
  validateRequest,
} from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { createUserSchema, userQuerySchema } from '@/schemas'
import { apiLogger } from '@/lib/logger'
import { Prisma } from '@prisma/client'

// GET — List all users
export const GET = withOwner(
  withErrorHandler(async (request: NextRequest, { user }) => {
    // Validate query parameters
    const validation = await validateRequest(request, userQuerySchema, 'query')
    if (!validation.success) return validation.error

    const { search, isActive, role } = validation.data

    // Build where clause
    const where: Prisma.UserWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    if (role) {
      where.role = role
    }

    // Fetch users
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    apiLogger.info({
      msg: 'Users fetched',
      userId: user.id,
      count: users.length,
    })

    return ApiResponse.success(users)
  })
)

// POST — Create new user
export const POST = withOwner(
  withErrorHandler(async (request: NextRequest, { user }) => {
    // Validate request body
    const validation = await validateRequest(request, createUserSchema, 'body')
    if (!validation.success) return validation.error

    const { name, email, password, role, isActive } = validation.data

    // Create in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      apiLogger.error({
        msg: 'Failed to create user in Supabase Auth',
        error: authError.message,
      })
      return ApiResponse.error(authError.message, 400)
    }

    // Create in database
    const newUser = await prisma.user.create({
      data: {
        id: authUser.user.id,
        name,
        email,
        role,
        isActive,
      },
    })

    apiLogger.info({
      msg: 'User created',
      newUserId: newUser.id,
      createdBy: user.id,
    })

    return ApiResponse.created(newUser)
  })
)
