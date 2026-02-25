import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { logActivity } from '@/lib/activities'

// GET — Vendor detail + full expense history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || !dbUser.isActive) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      expenses: {
        include: {
          relatedBooking: {
            select: { bookingCode: true, client: { select: { name: true } } },
          },
        },
        orderBy: { date: 'desc' },
      },
    },
  })

  if (!vendor) return NextResponse.json({ error: 'Vendor tidak ditemukan' }, { status: 404 })

  const totalExpenses = vendor.expenses.reduce((sum, e) => sum + e.amount, 0)
  const unpaidExpenses = vendor.expenses.filter((e) => !e.vendorPaid).reduce((sum, e) => sum + e.amount, 0)

  return NextResponse.json({
    ...vendor,
    totalExpenses,
    unpaidExpenses,
    transactionCount: vendor.expenses.length,
  })
}

// PATCH — Update vendor
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || !['OWNER', 'ADMIN'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, category, phone, email, address, notes, isActive } = body

  const existing = await prisma.vendor.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Vendor tidak ditemukan' }, { status: 404 })

  const updated = await prisma.vendor.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(category && { category }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(email !== undefined && { email: email || null }),
      ...(address !== undefined && { address: address || null }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(isActive !== undefined && { isActive }),
    },
  })

  await logActivity({
    userId: user.id,
    action: 'Mengupdate vendor',
    details: `${updated.name} (${updated.category})`,
    type: 'UPDATE',
  })

  return NextResponse.json(updated)
}

// DELETE — Delete vendor (hanya jika tidak ada expense terkait)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || !['OWNER'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Hanya Owner yang bisa menghapus vendor' }, { status: 403 })
  }

  const expenseCount = await prisma.expense.count({ where: { vendorId: id } })
  if (expenseCount > 0) {
    return NextResponse.json(
      { error: `Vendor tidak bisa dihapus karena memiliki ${expenseCount} transaksi. Hapus atau re-assign transaksi terlebih dahulu.` },
      { status: 400 }
    )
  }

  const vendorToDelete = await prisma.vendor.findUnique({ where: { id } })
  await prisma.vendor.delete({ where: { id } })

  if (vendorToDelete) {
    await logActivity({
      userId: user.id,
      action: 'Menghapus vendor',
      details: `${vendorToDelete.name} (${vendorToDelete.category})`,
      type: 'DELETE',
    })
  }

  return NextResponse.json({ success: true })
}
