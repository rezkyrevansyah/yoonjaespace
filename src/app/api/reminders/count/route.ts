import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET - Count unreminded bookings for today
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

  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    // Count should match the Today tab logic:
    // All bookings today (including past sessions) that are not cancelled or closed
    const count = await prisma.booking.count({
      where: {
        date: {
          gte: todayStart,
          lt: todayEnd
        },
        status: {
          notIn: ['CANCELLED', 'CLOSED']
        },
        // Remove remindedAt filter so badge shows ALL today's bookings
      }
    })

    return NextResponse.json({ count })
  } catch (error: any) {
    console.error('Error fetching reminder count:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reminder count' },
      { status: 500 }
    )
  }
}
