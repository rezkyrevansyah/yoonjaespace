/**
 * Validation Middleware
 *
 * This module provides request validation using Zod schemas.
 * It ensures type-safe request parsing and consistent validation error responses.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'
import { apiLogger } from '@/lib/logger'
import { ApiResponse } from '@/lib/api-response'

export type ValidationSource = 'body' | 'query' | 'params'

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: NextResponse }

// ============================================
// REQUEST VALIDATION
// ============================================

/**
 * Validates request data against a Zod schema
 *
 * @param request - NextRequest object
 * @param schema - Zod schema to validate against
 * @param source - Where to get the data from (body, query, or params)
 * @returns Validation result with either parsed data or error response
 *
 * @example
 * const validation = await validateRequest(request, createBookingSchema, 'body')
 * if (!validation.success) return validation.error
 * const { clientId, packageId } = validation.data // Fully typed!
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
  source: ValidationSource = 'body'
): Promise<ValidationResult<T>> {
  try {
    let rawData: unknown

    switch (source) {
      case 'body':
        try {
          rawData = await request.json()
        } catch (error) {
          apiLogger.warn({ msg: 'Invalid JSON in request body', error })
          return {
            success: false,
            error: ApiResponse.validationError('Invalid JSON in request body'),
          }
        }
        break

      case 'query':
        const { searchParams } = new URL(request.url)
        rawData = Object.fromEntries(searchParams.entries())
        break

      case 'params':
        throw new Error('Params should be validated using validateParams()')
    }

    // Parse and validate with Zod
    const data = schema.parse(rawData)

    apiLogger.debug({
      msg: 'Request validation successful',
      source,
      path: request.nextUrl.pathname,
    })

    return { success: true, data }
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues.map((e: any) => ({
        path: e.path.join('.'),
        message: e.message,
        code: e.code,
      }))

      apiLogger.warn({
        msg: 'Request validation failed',
        source,
        path: request.nextUrl.pathname,
        errors: details,
      })

      return {
        success: false,
        error: ApiResponse.validationError('Validation failed', { errors: details }),
      }
    }

    apiLogger.error({
      msg: 'Unexpected validation error',
      source,
      error,
    })

    return {
      success: false,
      error: ApiResponse.validationError('Invalid request format'),
    }
  }
}

// ============================================
// PARAMS VALIDATION
// ============================================

/**
 * Validates route params against a Zod schema
 *
 * @param params - Route params object
 * @param schema - Zod schema to validate against
 * @returns Validation result with either parsed data or error response
 *
 * @example
 * export const GET = withAuth(async (request, { user }, params) => {
 *   const validation = validateParams(params, z.object({ id: z.string().cuid() }))
 *   if (!validation.success) return validation.error
 *   const { id } = validation.data
 * })
 */
export function validateParams<T>(
  params: unknown,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const data = schema.parse(params)
    return { success: true, data }
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues.map((e: any) => ({
        path: e.path.join('.'),
        message: e.message,
        code: e.code,
      }))

      apiLogger.warn({
        msg: 'Params validation failed',
        errors: details,
      })

      return {
        success: false,
        error: ApiResponse.validationError('Invalid route parameters', {
          errors: details,
        }),
      }
    }

    return {
      success: false,
      error: ApiResponse.validationError('Invalid route parameters'),
    }
  }
}

// ============================================
// QUERY VALIDATION HELPERS
// ============================================

/**
 * Helper to validate pagination query parameters
 */
export function validatePagination(
  searchParams: URLSearchParams
): { page: number; limit: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))

  return { page, limit }
}

/**
 * Helper to calculate skip value for pagination
 */
export function getSkip(page: number, limit: number): number {
  return (page - 1) * limit
}
