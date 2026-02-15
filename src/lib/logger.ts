/**
 * Structured Logging with Pino
 *
 * This module provides structured JSON logging throughout the application.
 * In development, logs are pretty-printed for readability.
 * In production, logs are output as JSON for log aggregation services.
 */

import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
  base: {
    env: process.env.NODE_ENV,
  },
})

// Specialized loggers for different contexts
export const apiLogger = logger.child({ context: 'api' })
export const dbLogger = logger.child({ context: 'database' })
export const authLogger = logger.child({ context: 'auth' })
export const financeLogger = logger.child({ context: 'finance' })
