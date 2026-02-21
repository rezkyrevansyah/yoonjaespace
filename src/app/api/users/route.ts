import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// GET — List all users
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!currentUser || currentUser.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customRole: {
        select: {
          id: true,
          name: true,
          isSystem: true,
        }
      }
    }
  })

  return NextResponse.json(users)
}

// POST — Create new user
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!currentUser || currentUser.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, email, password, role, customRoleId } = await request.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 })
  }

  if (!customRoleId && !role) {
    return NextResponse.json({ error: 'Role harus dipilih' }, { status: 400 })
  }

  // Create di Supabase Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Create di database
  const newUser = await prisma.user.create({
    data: {
      id: authUser.user.id,
      name,
      email,
      role: role || 'ADMIN', // fallback for backward compatibility
      customRoleId: customRoleId || null,
    },
    include: {
      customRole: {
        select: {
          id: true,
          name: true,
          isSystem: true,
        }
      }
    }
  })

  return NextResponse.json(newUser, { status: 201 })
}
