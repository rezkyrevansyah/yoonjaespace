import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — Get package popularity statistics
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
  const month = searchParams.get('month') // Format: YYYY-MM

  if (!month) {
    return NextResponse.json({ error: 'Month parameter required (YYYY-MM)' }, { status: 400 })
  }

  try {
    // Parse month to get date range
    const [year, monthNum] = month.split('-').map(Number)
    const startDate = new Date(year, monthNum - 1, 1)
    const endDate = new Date(year, monthNum, 1)

    // Group bookings by package and count (exclude CANCELLED)
    const packageStats = await prisma.booking.groupBy({
      by: ['packageId'],
      where: {
        date: {
          gte: startDate,
          lt: endDate
        },
        status: {
          notIn: ['CANCELLED']
        }
      },
      _count: {
        id: true
      },
      _sum: {
        totalAmount: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5 // Top 5 packages
    })

    // Enrich with package details
    const enrichedStats = await Promise.all(
      packageStats.map(async (stat) => {
        const pkg = await prisma.package.findUnique({
          where: { id: stat.packageId },
          select: { name: true, price: true }
        })

        return {
          packageId: stat.packageId,
          packageName: pkg?.name || 'Unknown Package',
          bookingCount: stat._count.id,
          totalRevenue: stat._sum.totalAmount || 0
        }
      })
    )

    return NextResponse.json({
      month,
      stats: enrichedStats
    })
  } catch (error: any) {
    console.error('Error fetching package stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch package stats' },
      { status: 500 }
    )
  }
}
