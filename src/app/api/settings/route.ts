import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { withAuth, withAdmin, withErrorHandler } from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'

// GET — Get all settings
export const GET = withAuth(
  withErrorHandler(async () => {
    const settings = await prisma.studioSetting.findMany()

    // Convert to key-value object
    const result: Record<string, any> = {}
    settings.forEach((s) => {
      try {
        result[s.key] = JSON.parse(s.value)
      } catch {
        result[s.key] = s.value
      }
    })

    return ApiResponse.success(result)
  })
)

// PATCH — Update settings (bulk)
export const PATCH = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }) => {
    const body = await request.json()

    // body = { key1: value1, key2: value2, ... }
    const updates = Object.entries(body).map(([key, value]) => {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      return prisma.studioSetting.upsert({
        where: { key },
        update: { value: stringValue },
        create: { key, value: stringValue },
      })
    })

    await Promise.all(updates)

    apiLogger.info({
      msg: 'Settings updated',
      updatedBy: user.id,
      keys: Object.keys(body),
    })

    return ApiResponse.success({ success: true })
  })
)
