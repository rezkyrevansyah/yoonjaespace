import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { parseReminderTemplate, DEFAULT_REMINDER_TEMPLATE } from '@/lib/utils/reminder-template'

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
  const type = searchParams.get('type') || 'today' // today, tomorrow, all

  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  const endOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2)
  const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)

  let dateFilter: any

  if (type === 'today') {
    dateFilter = { gte: startOfToday, lt: startOfTomorrow }
  } else if (type === 'tomorrow') {
    dateFilter = { gte: startOfTomorrow, lt: endOfTomorrow }
  } else if (type === 'week') {
    dateFilter = { gte: startOfToday, lt: endOfWeek }
  } else {
    // All upcoming (next 30 days)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30)
    dateFilter = { gte: startOfToday, lt: endOfMonth }
  }

  // Get custom reminder template from settings
  const templateSetting = await prisma.studioSetting.findUnique({
    where: { key: 'reminder_message_template' }
  })
  const template = templateSetting?.value || DEFAULT_REMINDER_TEMPLATE

  // Get studio name from settings
  const studioNameSetting = await prisma.studioSetting.findUnique({
    where: { key: 'studio_name' }
  })
  const studioName = studioNameSetting?.value || 'Yoonjaespace'

  // Get base URL for client page links
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin

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

    // Parse template with booking data
    const message = parseReminderTemplate(template, {
      clientName: b.client.name,
      date: dateStr,
      time: timeStr,
      packageName: b.package.name,
      studioName: studioName,
      numberOfPeople: b.numberOfPeople,
      clientPageLink: clientPageLink,
    })

    const phone = b.client.phone.replace(/^0/, '62').replace(/[^0-9]/g, '')
    const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

    // Hitung jam dari sekarang
    const diffMs = b.startTime.getTime() - Date.now()
    const diffHours = Math.round(diffMs / (1000 * 60 * 60))

    return {
      booking: b,
      hoursUntilSession: diffHours,
      waLink,
      reminderMessage: message,
    }
  })

  return NextResponse.json(reminders)
}
