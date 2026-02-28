import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // OPTIMIZED: Select only needed fields
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    }
  })

  if (!dbUser) {
    return NextResponse.json({ error: 'User tidak terdaftar' }, { status: 403 })
  }

  if (!dbUser.isActive) {
    return NextResponse.json({ error: 'User tidak aktif' }, { status: 403 })
  }

  return NextResponse.json({
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
  }, {
    headers: {
      'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
    },
  })
}
