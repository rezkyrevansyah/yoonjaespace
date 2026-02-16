import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — List packages
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const activeOnly = searchParams.get('active') === 'true'

  const where: any = {}
  if (activeOnly) {
    where.isActive = true
  }

  const packages = await prisma.package.findMany({
    where,
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(packages)
}

// POST — Create package
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser || !['OWNER', 'ADMIN'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, description, price, duration, maxPeople } = await request.json()

  if (!name || price === undefined || !duration) {
    return NextResponse.json(
      { error: 'Nama, harga, dan durasi harus diisi' },
      { status: 400 }
    )
  }

  const pkg = await prisma.package.create({
    data: {
      name,
      description: description || null,
      price,
      duration,
      maxPeople: maxPeople || 1,
    },
  })

  return NextResponse.json(pkg, { status: 201 })
}
