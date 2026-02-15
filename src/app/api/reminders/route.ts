import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

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

  let dateFilter: any

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
