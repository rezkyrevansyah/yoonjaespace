import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { logActivity } from '@/lib/activities'

// PATCH — Update expense
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser || !['OWNER', 'ADMIN'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { description, amount, category, date, relatedBookingId, notes } = body

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      ...(description && { description }),
      ...(amount !== undefined && { amount }),
      ...(category && { category }),
      ...(date && { date: new Date(date) }),
      ...(relatedBookingId !== undefined && { relatedBookingId: relatedBookingId || null }),
      ...(notes !== undefined && { notes: notes || null }),
    },
  })

  await logActivity({
    userId: user.id,
    action: `Mengupdate pengeluaran`,
    details: `${updated.description} - Rp ${updated.amount.toLocaleString('id-ID')}`,
    type: 'UPDATE',
  })

  return NextResponse.json(updated)
}

// DELETE — Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser || !['OWNER', 'ADMIN'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const expenseToDelete = await prisma.expense.findUnique({ where: { id } })

  await prisma.expense.delete({ where: { id } })

  if (expenseToDelete) {
    await logActivity({
      userId: user.id,
      action: `Menghapus pengeluaran`,
      details: `${expenseToDelete.description} - Rp ${expenseToDelete.amount.toLocaleString('id-ID')}`,
      type: 'DELETE',
    })
  }

  return NextResponse.json({ success: true })
}
