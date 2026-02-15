/**
 * Error Handling Middleware
 *
 * This module provides centralized error handling for API routes.
 * It defines custom error classes and handles Prisma, Zod, and application errors consistently.
 */

import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { logger } from '@/lib/logger'

// ============================================
// CUSTOM ERROR CLASSES
// ============================================

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, `${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, message, details)
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message)
    this.name = 'ConflictError'
  }
}

// ============================================
// ERROR HANDLER
// ============================================

/**
 * Global error handler for API routes
 * Converts various error types into consistent NextResponse objects
 */
export function handleApiError(error: unknown): NextResponse {
  // Log the error with appropriate level
  if (error instanceof ApiError) {
    logger.warn({ error: error.message, statusCode: error.statusCode, details: error.details })
  } else {
    logger.error({ error, message: 'Unhandled error in API route' })
  }

  // ApiError - intentional application errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error.details && { details: error.details }),
      },
      { status: error.statusCode }
    )
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: error.issues.map((e: any) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
      { status: 400 }
    )
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        return NextResponse.json(
          {
            error: 'Unique constraint violation',
            details: { field: error.meta?.target },
          },
          { status: 409 }
        )
      case 'P2025':
        // Record not found
        return NextResponse.json(
          { error: 'Record not found' },
          { status: 404 }
        )
      case 'P2003':
        // Foreign key constraint violation
        return NextResponse.json(
          { error: 'Foreign key constraint violation' },
          { status: 400 }
        )
      case 'P2014':
        // Invalid relation
        return NextResponse.json(
          { error: 'Invalid relation' },
          { status: 400 }
        )
      default:
        logger.error({ prismaError: error, code: error.code })
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        )
    }
  }

  // Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      { error: 'Invalid data provided' },
      { status: 400 }
    )
  }

  // Unknown errors
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}

// ============================================
// ERROR HANDLER WRAPPER
// ============================================

/**
 * Wrapper to add error handling to route handlers
 * Usage: export const GET = withErrorHandler(async (request) => { ... })
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }) as T
}
