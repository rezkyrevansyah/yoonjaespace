import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import {
  parseReminderTemplate,
  DEFAULT_REMINDER_TEMPLATE,
  DEFAULT_THANK_YOU_PAYMENT_TEMPLATE,
  DEFAULT_THANK_YOU_SESSION_TEMPLATE
} from '@/lib/utils/reminder-template'

// GET — Get bookings that need reminder (today & tomorrow)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser || !['OWNER', 'ADMIN'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'today' // today, tomorrow, week, all

  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  const endOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2)
  const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)

  let dateFilter: any
  let statusFilter: any

  if (type === 'today') {
    // Today tab: show all bookings today (including past sessions on same day)
    dateFilter = { gte: startOfToday, lt: startOfTomorrow }
    // Only show active bookings (not cancelled or closed)
    statusFilter = { notIn: ['CANCELLED', 'CLOSED'] }
  } else if (type === 'tomorrow') {
    dateFilter = { gte: startOfTomorrow, lt: endOfTomorrow }
    statusFilter = { notIn: ['CANCELLED', 'CLOSED'] }
  } else if (type === 'week') {
    // This Week tab: show all bookings this week (including past sessions)
    dateFilter = { gte: startOfToday, lt: endOfWeek }
    statusFilter = { notIn: ['CANCELLED', 'CLOSED'] }
  } else {
    // All tab: show ALL history without date filter
    dateFilter = undefined
    statusFilter = { notIn: ['CANCELLED'] } // Show everything except cancelled
  }

  // OPTIMIZED: Batch fetch all settings in one query instead of 4 sequential queries
  const settings = await prisma.studioSetting.findMany({
    where: {
      key: {
        in: ['reminder_message_template', 'thank_you_payment_template', 'thank_you_session_template', 'studio_name']
      }
    }
  })

  // Convert to map for easy access
  const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]))

  const template = settingsMap.reminder_message_template || DEFAULT_REMINDER_TEMPLATE
  const thankYouPaymentTemplate = settingsMap.thank_you_payment_template || DEFAULT_THANK_YOU_PAYMENT_TEMPLATE
  const thankYouSessionTemplate = settingsMap.thank_you_session_template || DEFAULT_THANK_YOU_SESSION_TEMPLATE
  const studioName = settingsMap.studio_name || 'Yoonjaespace'

  // Get base URL for client page links
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin

  const bookings = await prisma.booking.findMany({
    where: {
      ...(dateFilter && { date: dateFilter }),
      status: statusFilter,
    },
    include: {
      client: true,
      package: true,
    },
    orderBy: { startTime: 'desc' }, // Latest bookings first for 'all' tab
  })

  // Generate WA reminder links using custom template
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

    // Generate client page link
    const clientPageLink = `${baseUrl}/status/${b.publicSlug}`

    // Template data for all message types
    const templateData = {
      clientName: b.client.name,
      date: dateStr,
      time: timeStr,
      packageName: b.package.name,
      studioName: studioName,
      numberOfPeople: b.numberOfPeople,
      clientPageLink: clientPageLink,
    }

    // Parse reminder message
    const message = parseReminderTemplate(template, templateData)

    // Parse thank you messages
    const thankYouPaymentMessage = parseReminderTemplate(thankYouPaymentTemplate, templateData)
    const thankYouSessionMessage = parseReminderTemplate(thankYouSessionTemplate, templateData)

    const phone = b.client.phone.replace(/^0/, '62').replace(/[^0-9]/g, '')
    const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    const waThankYouPaymentLink = `https://wa.me/${phone}?text=${encodeURIComponent(thankYouPaymentMessage)}`
    const waThankYouSessionLink = `https://wa.me/${phone}?text=${encodeURIComponent(thankYouSessionMessage)}`

    // Hitung jam dari sekarang
    const diffMs = b.startTime.getTime() - Date.now()
    const diffHours = Math.round(diffMs / (1000 * 60 * 60))

    return {
      booking: b,
      hoursUntilSession: diffHours,
      waLink,
      reminderMessage: message,
      waThankYouPaymentLink,
      waThankYouSessionLink,
      thankYouPaymentMessage,
      thankYouSessionMessage,
    }
  })

  return NextResponse.json(reminders, {
    headers: { 'Cache-Control': 'private, max-age=0, stale-while-revalidate=30' },
  })
}
