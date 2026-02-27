import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { logActivity } from '@/lib/activities'

// GET — List vendors with aggregated expense stats
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || !dbUser.isActive) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const activeOnly = searchParams.get('active') === 'true'
  const category = searchParams.get('category')

  const where: any = {}
  if (activeOnly) where.isActive = true
  if (category && category !== 'ALL') where.category = category

  const vendors = await prisma.vendor.findMany({
    where,
    include: {
      expenses: {
        select: { amount: true, vendorPaid: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  const result = vendors.map((v) => {
    const { expenses, ...vendor } = v
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const unpaidExpenses = expenses.filter((e) => !e.vendorPaid).reduce((sum, e) => sum + e.amount, 0)
    return {
      ...vendor,
      totalExpenses,
      unpaidExpenses,
      transactionCount: expenses.length,
    }
  })

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'private, max-age=0, stale-while-revalidate=30' },
  })
}

// POST — Create vendor
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || !['OWNER', 'ADMIN'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, category, phone, email, address, notes, isActive } = await request.json()

  if (!name || !category) {
    return NextResponse.json({ error: 'Nama dan kategori wajib diisi' }, { status: 400 })
  }

  const vendor = await prisma.vendor.create({
    data: {
      name,
      category,
      phone: phone || null,
      email: email || null,
      address: address || null,
      notes: notes || null,
      isActive: isActive !== undefined ? isActive : true,
    },
  })

  await logActivity({
    userId: user.id,
    action: 'Menambahkan vendor baru',
    details: `${name} (${category})`,
    type: 'CREATE',
  })

  return NextResponse.json(vendor, { status: 201 })
}
