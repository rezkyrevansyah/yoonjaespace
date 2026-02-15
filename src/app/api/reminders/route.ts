import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import {
  withAdmin,
  withErrorHandler,
} from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

// Query schema for reminders
const reminderQuerySchema = z.object({
  type: z.enum(['today', 'tomorrow', 'all']).optional().default('today'),
})

// GET — Get bookings that need reminder (today & tomorrow)
export const GET = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }) => {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryValidation = reminderQuerySchema.safeParse({
      type: searchParams.get('type') || 'today',
    })

    if (!queryValidation.success) {
      return ApiResponse.validationError('Invalid query parameters')
    }

    const { type } = queryValidation.data

    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    const endOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2)

    let dateFilter: Prisma.DateTimeFilter

    if (type === 'today') {
      dateFilter = { gte: startOfToday, lt: startOfTomorrow }
    } else if (type === 'tomorrow') {
      dateFilter = { gte: startOfTomorrow, lt: endOfTomorrow }
    } else {
      dateFilter = { gte: startOfToday, lt: endOfTomorrow }
    }

    const bookings = await prisma.booking.findMany({
      where: {
        date: dateFilter,
        status: { in: ['BOOKED', 'PAID'] },
      },
      include: {
        client: true,
        package: true,
      },
      orderBy: { startTime: 'asc' },
    })

    // Generate WA reminder links
    const reminders = bookings.map((b) => {
      const dateStr = b.date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      const timeStr = b.startTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })

      const message = `Halo ${b.client.name}, ini reminder untuk sesi foto kamu di Yoonjaespace pada ${dateStr} pukul ${timeStr}. Paket: ${b.package.name}. Ditunggu ya! 😊`
      const phone = b.client.phone.replace(/^0/, '62').replace(/[^0-9]/g, '')
      const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

      // Calculate hours until session
      const diffMs = b.startTime.getTime() - Date.now()
      const diffHours = Math.round(diffMs / (1000 * 60 * 60))

      return {
        booking: b,
        hoursUntilSession: diffHours,
        waLink,
        reminderMessage: message,
      }
    })

    apiLogger.info({
      msg: 'Reminders fetched',
      userId: user.id,
      type,
      count: reminders.length,
    })

    return ApiResponse.success(reminders)
  })
)
