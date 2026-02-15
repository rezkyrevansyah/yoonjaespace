import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import {
  withErrorHandler,
  validateParams,
} from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { slugParamSchema } from '@/schemas'
import { apiLogger } from '@/lib/logger'

// GET — Public status page (NO AUTH REQUIRED)
export const GET = withErrorHandler(async (request: NextRequest, routeContext?: { params: Promise<{ slug: string }> }) => {
  // Resolve params
  const params = routeContext?.params ? await routeContext.params : undefined

  // Validate params
  const paramValidation = validateParams(params, slugParamSchema)
  if (!paramValidation.success) return paramValidation.error

  const { slug } = paramValidation.data

  // Fetch booking by public slug
  const booking = await prisma.booking.findUnique({
    where: { publicSlug: slug },
    include: {
      client: { select: { name: true } },
      package: { select: { name: true, duration: true } },
      printOrder: {
        select: {
          status: true,
          courier: true,
          trackingNumber: true,
          shippedAt: true,
        },
      },
    },
  })

  if (!booking) {
    return ApiResponse.notFound('Order')
  }

  // Get studio settings
  const settings = await prisma.studioSetting.findMany()
  const settingsMap: Record<string, string | number | boolean | object> = {}
  settings.forEach((s) => {
    try {
      settingsMap[s.key] = JSON.parse(s.value)
    } catch {
      settingsMap[s.key] = s.value
    }
  })

  apiLogger.info({
    msg: 'Public status page accessed',
    slug,
    bookingId: booking.id,
  })

  // Return only public-safe data
  return ApiResponse.success({
    bookingCode: booking.bookingCode,
    clientName: booking.client.name,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    packageName: booking.package.name,
    packageDuration: booking.package.duration,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    deliveredAt: booking.deliveredAt,
    printOrder: booking.printOrder
      ? {
          status: booking.printOrder.status,
          courier: booking.printOrder.courier,
          trackingNumber: booking.printOrder.trackingNumber,
          shippedAt: booking.printOrder.shippedAt,
        }
      : null,
    studio: {
      name: (settingsMap['studio_name'] as string) || 'Yoonjaespace',
      instagram: (settingsMap['studio_instagram'] as string) || '',
      operatingHours: settingsMap['operating_hours'] || { open: '08:00', close: '20:00' },
    },
  })
})
