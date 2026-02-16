import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — List custom field definitions
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fields = await prisma.customFieldDefinition.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json(fields)
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
      fieldType: fieldType || 'text',
      options: options ? JSON.stringify(options) : null,
      isRequired: isRequired || false,
      sortOrder: sortOrder || 0,
    },
  })

  return NextResponse.json(field, { status: 201 })
}
