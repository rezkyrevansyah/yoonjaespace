import { PrismaClient } from '@prisma/client'
import { dbLogger } from './logger'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  })

// Log queries in development for debugging
if (process.env.NODE_ENV === 'development') {
  (prisma as any).$on('query', (e: any) => {
    dbLogger.debug({
      msg: 'Prisma query',
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    })
  })

  (prisma as any).$on('error', (e: any) => {
    dbLogger.error({
      msg: 'Prisma error',
      target: e.target,
      message: e.message,
    })
  })

  (prisma as any).$on('warn', (e: any) => {
    dbLogger.warn({
      msg: 'Prisma warning',
      target: e.target,
      message: e.message,
    })
  })
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
