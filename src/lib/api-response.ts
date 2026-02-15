/**
 * API Response Utilities
 *
 * This module provides consistent response formatting across all API routes.
 * It ensures uniform response structures for success, error, and paginated responses.
 */

import { NextResponse } from 'next/server'
import type { PaginationMeta } from '@/types/api.types'

export class ApiResponse {
  /**
   * Standard success response
   */
  static success<T>(data: T, status = 200): NextResponse {
    return NextResponse.json(data, { status })
  }

  /**
   * Created response (201)
   */
  static created<T>(data: T): NextResponse {
    return NextResponse.json(data, { status: 201 })
  }

  /**
   * No content response (204)
   */
  static noContent(): NextResponse {
    return new NextResponse(null, { status: 204 })
  }

  /**
   * Paginated response with consistent structure
   */
  static paginated<T>(
    items: T[],
    page: number,
    limit: number,
    total: number
  ): NextResponse {
    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }

    return NextResponse.json({
      [this.getItemsKey(items)]: items,
      pagination,
    })
  }

  /**
   * Error response
   */
  static error(
    message: string,
    status = 400,
    details?: Record<string, unknown>
  ): NextResponse {
    return NextResponse.json(
      {
        error: message,
        ...(details && { details }),
      },
      { status }
    )
  }

  /**
   * Unauthorized response (401)
   */
  static unauthorized(message = 'Unauthorized'): NextResponse {
    return this.error(message, 401)
  }

  /**
   * Forbidden response (403)
   */
  static forbidden(message = 'Forbidden'): NextResponse {
    return this.error(message, 403)
  }

  /**
   * Not found response (404)
   */
  static notFound(resource = 'Resource'): NextResponse {
    return this.error(`${resource} not found`, 404)
  }

  /**
   * Validation error response (400)
   */
  static validationError(
    message = 'Validation failed',
    details?: Record<string, unknown>
  ): NextResponse {
    return this.error(message, 400, details)
  }

  /**
   * Conflict response (409)
   */
  static conflict(message: string): NextResponse {
    return this.error(message, 409)
  }

  /**
   * Internal server error (500)
   */
  static serverError(message = 'Internal server error'): NextResponse {
    return this.error(message, 500)
  }

  /**
   * Helper to get the appropriate key name for items based on the first item
   * Falls back to 'items' if cannot determine
   */
  private static getItemsKey<T>(items: T[]): string {
    if (items.length === 0) return 'items'

    // Try to infer from the first item's properties
    const firstItem = items[0]
    if (typeof firstItem === 'object' && firstItem !== null) {
      // Check for common model indicators
      if ('bookingCode' in firstItem) return 'bookings'
      if ('clientId' in firstItem || ('phone' in firstItem && 'name' in firstItem)) return 'clients'
      if ('packageId' in firstItem || ('duration' in firstItem && 'price' in firstItem)) return 'packages'
      if ('userId' in firstItem || ('role' in firstItem && 'email' in firstItem)) return 'users'
      if ('category' in firstItem && 'amount' in firstItem) return 'expenses'
      if ('code' in firstItem && 'discountValue' in firstItem) return 'vouchers'
      if ('fieldName' in firstItem && 'fieldType' in firstItem) return 'customFields'
      if ('vendorName' in firstItem) return 'printOrders'
    }

    return 'items'
  }
}
