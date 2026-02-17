import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — List backgrounds
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

  const backgrounds = await prisma.background.findMany({
    where,
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(backgrounds)
}

// POST — Create background
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

  const { name, description, isActive } = await request.json()

  if (!name) {
    return NextResponse.json({ error: 'Nama harus diisi' }, { status: 400 })
  }

  const background = await prisma.background.create({
    data: {
      name,
      description: description || null,
      isActive: isActive !== undefined ? isActive : true
    },
  })

  return NextResponse.json(background, { status: 201 })
}
