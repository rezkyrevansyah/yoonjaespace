/**
 * Logging Middleware
 *
 * This module provides request/response logging for API routes.
 * It tracks request duration, status codes, and errors.
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiLogger } from '@/lib/logger'

/**
 * Wraps a handler to add request/response logging
 *
 * @example
 * export const GET = logRequest(async (request) => {
 *   // Your handler logic
 *   return NextResponse.json({ data: 'Hello' })
 * })
 */
export async function logRequest(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const start = Date.now()
  const { method, url } = request
  const path = new URL(url).pathname

  apiLogger.info({
    msg: 'Incoming request',
    method,
    path,
    userAgent: request.headers.get('user-agent'),
  })

  try {
    const response = await handler()
    const duration = Date.now() - start

    apiLogger.info({
      msg: 'Request completed',
      method,
      path,
      status: response.status,
      duration,
    })

    return response
  } catch (error) {
    const duration = Date.now() - start

    apiLogger.error({
      msg: 'Request failed',
      method,
      path,
      duration,
      error,
    })

    throw error
  }
}

/**
 * Wrapper version for easier composition
 *
 * @example
 * export const GET = withLogging(async (request) => { ... })
 */
export function withLogging<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const [request] = args
    return await logRequest(request as NextRequest, () => handler(...args))
  }) as T
}
