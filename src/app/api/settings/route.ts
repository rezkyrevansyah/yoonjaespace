import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — Get all settings
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await prisma.studioSetting.findMany()

  // Convert to key-value object
  const result: Record<string, any> = {}
  settings.forEach((s) => {
    try {
      result[s.key] = JSON.parse(s.value)
    } catch {
      result[s.key] = s.value
    }
  })

  return NextResponse.json(result)
}

// PATCH — Update settings (bulk)
export async function PATCH(request: NextRequest) {
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

  // body = { key1: value1, key2: value2, ... }
  const updates = Object.entries(body).map(([key, value]) => {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
    return prisma.studioSetting.upsert({
      where: { key },
      update: { value: stringValue },
      create: { key, value: stringValue },
    })
  })

  await Promise.all(updates)

  return NextResponse.json({ success: true })
}
