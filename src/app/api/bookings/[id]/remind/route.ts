import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// PATCH - Mark/unmark booking as reminded
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser || !['OWNER', 'ADMIN'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { reminded } = body // true to mark as reminded, false to unmark

  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        remindedAt: reminded ? new Date() : null
      }
    })

    return NextResponse.json(booking)
  } catch (error: any) {
    console.error('Error updating reminder status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update reminder status' },
      { status: 500 }
    )
  }
}
