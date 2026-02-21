import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { formatCommissionPeriod } from '@/lib/utils/commission-period'

// GET — Get commission history for a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  // Only OWNER can view commission history
  if (!dbUser || dbUser.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await params
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '12')

  // Verify the target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true }
  })

  if (!targetUser) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
  }

  // Get commission records, sorted by most recent first
  const commissions = await prisma.commission.findMany({
    where: { userId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    take: limit,
  })

  // Enrich with period string and payment status
  const history = commissions.map(c => ({
    id: c.id,
    month: c.month,
    year: c.year,
    period: formatCommissionPeriod(c.month, c.year),
    amount: c.amount,
    totalBookings: c.totalBookings,
    notes: c.notes,
    isPaid: !!c.paidAt,
    paidAt: c.paidAt,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }))

  return NextResponse.json({
    userId,
    userName: targetUser.name,
    userRole: targetUser.role,
    history,
  })
}
