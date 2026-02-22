import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/public/mua-schedule - Public endpoint for MUA schedule
// Shows only bookings that have MUA add-on
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // format: 2026-02

    let startDate: Date | undefined
    let endDate: Date | undefined

    if (month) {
      const [year, m] = month.split('-')
      startDate = new Date(parseInt(year), parseInt(m) - 1, 1)
      endDate = new Date(parseInt(year), parseInt(m), 1)
    } else {
      // Default to current month
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    }

    // Find all bookings with MUA add-on
    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
        addOns: {
          some: {
            itemName: {
              contains: 'MUA',
              mode: 'insensitive',
            },
          },
        },
        status: {
          not: 'CANCELLED',
        },
      },
      include: {
        client: {
          select: {
            name: true,
            phone: true,
          },
        },
        package: {
          select: {
            name: true,
          },
        },
        addOns: {
          where: {
            itemName: {
              contains: 'MUA',
              mode: 'insensitive',
            },
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Format the response
    const schedule = bookings.map((booking) => ({
      id: booking.id,
      bookingCode: booking.bookingCode,
      clientName: booking.client.name,
      clientPhone: booking.client.phone,
      sessionDate: booking.date,
      muaStartTime: booking.muaStartTime,
      sessionStartTime: booking.startTime,
      packageName: booking.package.name,
      muaAddOns: booking.addOns.map((addon) => ({
        name: addon.itemName,
        quantity: addon.quantity,
      })),
      status: booking.status,
    }))

    return NextResponse.json({
      month: month || `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
      schedule,
    })
  } catch (error: any) {
    console.error('Error fetching MUA schedule:', error)
    return NextResponse.json({ error: 'Failed to fetch MUA schedule' }, { status: 500 })
  }
}
