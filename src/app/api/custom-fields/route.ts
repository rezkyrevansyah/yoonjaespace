import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — List custom field definitions
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  // Default to active-only; pass ?active=false to get all (used by settings page)
  const activeOnly = searchParams.get('active') !== 'false'

  const fields = await prisma.customFieldDefinition.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { sortOrder: 'asc' },
  })

  const result = fields.map(f => ({
    ...f,
    fieldType: f.fieldType.toUpperCase()
  }))

  return NextResponse.json(result)
}

// POST — Create custom field
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

  const { fieldName, fieldType, options, isRequired, sortOrder } = await request.json()

  if (!fieldName) {
    return NextResponse.json({ error: 'Nama field harus diisi' }, { status: 400 })
  }

  const field = await prisma.customFieldDefinition.create({
    data: {
      fieldName,
      fieldType: (fieldType || 'TEXT').toUpperCase(),
      options: options || null, // Store as raw string "Red, Blue, Green"
      isRequired: isRequired || false,
      sortOrder: sortOrder || 0,
    },
  })

  return NextResponse.json(field, { status: 201 })
}
