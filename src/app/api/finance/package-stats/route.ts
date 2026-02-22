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

    // CRITICAL FIX: Use $transaction + batch queries to eliminate N+1 pattern
    // First get grouped stats, then batch fetch package details
    const [packageStats, allPackages] = await prisma.$transaction([
      // Query 1: Group bookings by package
      prisma.booking.groupBy({
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
      }),

      // Query 2: Get ALL packages in one query (not N queries)
      prisma.package.findMany({
        select: { id: true, name: true, price: true }
      })
    ])

    // Map package details in memory (fast)
    const packageMap = Object.fromEntries(
      allPackages.map(p => [p.id, p])
    )

    // Enrich stats with package details (no more DB queries)
    const enrichedStats = packageStats.map((stat) => {
      const pkg = packageMap[stat.packageId]
      const count = typeof stat._count === 'object' ? stat._count.id : 0
      const revenue = stat._sum?.totalAmount || 0

      return {
        packageId: stat.packageId,
        packageName: pkg?.name || 'Unknown Package',
        bookingCount: count || 0,
        totalRevenue: revenue
      }
    })

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
