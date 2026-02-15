/**
 * Authentication Middleware
 *
 * This module provides authentication and authorization wrappers for API routes.
 * It eliminates ~70 code duplications across API routes by centralizing auth logic.
 */

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { Role } from '@prisma/client'
import { authLogger } from '@/lib/logger'
import { ApiResponse } from '@/lib/api-response'

// ============================================
// TYPES
// ============================================

export type AuthenticatedUser = {
  id: string
  name: string
  email: string
  role: Role
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type AuthContext = {
  user: AuthenticatedUser
  supabase: Awaited<ReturnType<typeof createClient>>
}

type AuthHandler<T = unknown> = (
  request: NextRequest,
  context: AuthContext,
  params?: T
) => Promise<NextResponse> | NextResponse

type AuthOptions = {
  allowedRoles?: Role[]
  requireActive?: boolean
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

/**
 * Authentication middleware wrapper
 *
 * This wrapper:
 * 1. Verifies Supabase session
 * 2. Fetches user from database
 * 3. Checks if user is active
 * 4. Validates role permissions
 * 5. Provides typed user context to handler
 *
 * @example
 * export const GET = withAuth(async (request, { user }) => {
 *   // user is fully typed and authenticated
 *   return ApiResponse.success({ data: 'Hello ' + user.name })
 * })
 */
export function withAuth<T = unknown>(
  handler: AuthHandler<T>,
  options: AuthOptions = { requireActive: true }
) {
  return async (
    request: NextRequest,
    routeContext?: { params: Promise<T> }
  ): Promise<NextResponse> => {
    try {
      // 1. Verify Supabase session
      const supabase = await createClient()
      const {
        data: { user: supabaseUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !supabaseUser) {
        authLogger.warn({
          msg: 'Authentication failed',
          error: authError?.message,
          path: request.nextUrl.pathname,
        })
        return ApiResponse.unauthorized()
      }

      // 2. Fetch user from database
      const dbUser = await prisma.user.findUnique({
        where: { id: supabaseUser.id },
      })

      if (!dbUser) {
        authLogger.warn({
          msg: 'User not found in database',
          userId: supabaseUser.id,
          path: request.nextUrl.pathname,
        })
        return ApiResponse.forbidden('User not found in database')
      }

      // 3. Check if user is active
      if (options.requireActive && !dbUser.isActive) {
        authLogger.warn({
          msg: 'Inactive user attempted access',
          userId: dbUser.id,
          path: request.nextUrl.pathname,
        })
        return ApiResponse.forbidden('User account is inactive')
      }

      // 4. Check role permissions
      if (options.allowedRoles && !options.allowedRoles.includes(dbUser.role)) {
        authLogger.warn({
          msg: 'Insufficient permissions',
          userId: dbUser.id,
          role: dbUser.role,
          requiredRoles: options.allowedRoles,
          path: request.nextUrl.pathname,
        })
        return ApiResponse.forbidden('Insufficient permissions')
      }

      // 5. Build auth context
      const authContext: AuthContext = {
        user: dbUser,
        supabase,
      }

      // 6. Resolve params if available
      const params = routeContext?.params ? await routeContext.params : undefined

      // 7. Log successful authentication
      authLogger.info({
        msg: 'Request authenticated',
        userId: dbUser.id,
        role: dbUser.role,
        path: request.nextUrl.pathname,
        method: request.method,
      })

      // 8. Call the actual handler
      return await handler(request, authContext, params)
    } catch (error) {
      authLogger.error({
        msg: 'Auth middleware error',
        error,
        path: request.nextUrl.pathname,
      })
      return ApiResponse.serverError()
    }
  }
}

// ============================================
// CONVENIENCE WRAPPERS
// ============================================

/**
 * Owner-only routes
 * @example
 * export const DELETE = withOwner(async (request, { user }) => { ... })
 */
export const withOwner = <T = unknown>(handler: AuthHandler<T>) =>
  withAuth(handler, { allowedRoles: ['OWNER'] })

/**
 * Owner or Admin routes
 * @example
 * export const POST = withAdmin(async (request, { user }) => { ... })
 */
export const withAdmin = <T = unknown>(handler: AuthHandler<T>) =>
  withAuth(handler, { allowedRoles: ['OWNER', 'ADMIN'] })

/**
 * Owner, Admin, or Photographer routes
 * @example
 * export const GET = withPhotographer(async (request, { user }) => { ... })
 */
export const withPhotographer = <T = unknown>(handler: AuthHandler<T>) =>
  withAuth(handler, { allowedRoles: ['OWNER', 'ADMIN', 'PHOTOGRAPHER'] })

/**
 * Any authenticated user (including packaging staff)
 * @example
 * export const GET = withAnyUser(async (request, { user }) => { ... })
 */
export const withAnyUser = <T = unknown>(handler: AuthHandler<T>) =>
  withAuth(handler, {})
