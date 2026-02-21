import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — List all roles with their permissions
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  // Only OWNER can view roles
  if (!dbUser || dbUser.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const roles = await prisma.customRole.findMany({
      include: {
        permissions: {
          include: {
            menu: true
          }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ roles })
  } catch (error: any) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}

// POST — Create new custom role
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  // Only OWNER can create roles
  if (!dbUser || dbUser.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, description, menuPermissions } = body

    if (!name || !menuPermissions || !Array.isArray(menuPermissions)) {
      return NextResponse.json(
        { error: 'Name and menuPermissions are required' },
        { status: 400 }
      )
    }

    // Check if role name already exists
    const existing = await prisma.customRole.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json(
        { error: 'Role dengan nama ini sudah ada' },
        { status: 400 }
      )
    }

    // Create role with permissions in a transaction
    const role = await prisma.customRole.create({
      data: {
        name,
        description,
        isSystem: false,
        permissions: {
          create: menuPermissions.map((mp: any) => ({
            menuId: mp.menuId,
            canView: mp.canView ?? true,
            canEdit: mp.canEdit ?? false,
            canDelete: mp.canDelete ?? false,
          }))
        }
      },
      include: {
        permissions: {
          include: {
            menu: true
          }
        }
      }
    })

    return NextResponse.json({ role }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create role' },
      { status: 500 }
    )
  }
}
