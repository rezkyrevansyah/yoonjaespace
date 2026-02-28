import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — List add-on templates
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

  const templates = await prisma.addOnTemplate.findMany({
    where,
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(templates, {
    headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' },
  })
}

// POST — Create add-on template
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

  const { name, defaultPrice, isActive } = await request.json()

  if (!name || defaultPrice === undefined) {
    return NextResponse.json(
      { error: 'Nama dan harga default harus diisi' },
      { status: 400 }
    )
  }

  const template = await prisma.addOnTemplate.create({
    data: {
      name,
      defaultPrice,
      isActive: isActive !== undefined ? isActive : true
    },
  })

  return NextResponse.json(template, { status: 201 })
}
