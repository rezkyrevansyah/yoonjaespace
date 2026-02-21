import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — Get single role details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  // Only OWNER can view role details
  if (!dbUser || dbUser.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    const role = await prisma.customRole.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            menu: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    })

    if (!role) {
      return NextResponse.json({ error: 'Role tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ role })
  } catch (error: any) {
    console.error('Error fetching role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch role' },
      { status: 500 }
    )
  }
}

// PATCH — Update role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  // Only OWNER can update roles
  if (!dbUser || dbUser.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    const role = await prisma.customRole.findUnique({ where: { id } })

    if (!role) {
      return NextResponse.json({ error: 'Role tidak ditemukan' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, menuPermissions } = body

    // System roles: can only edit permissions, not name/description
    // Non-system roles: can edit everything

    // Update role and permissions
    const updatedRole = await prisma.$transaction(async (tx) => {
      // Update basic info (only for non-system roles)
      if (!role.isSystem) {
        await tx.customRole.update({
          where: { id },
          data: {
            ...(name && { name }),
            ...(description !== undefined && { description })
          }
        })
      }

      // Update permissions if provided
      if (menuPermissions && Array.isArray(menuPermissions)) {
        // Delete existing permissions
        await tx.rolePermission.deleteMany({
          where: { roleId: id }
        })

        // Create new permissions
        await tx.rolePermission.createMany({
          data: menuPermissions.map((mp: any) => ({
            roleId: id,
            menuId: mp.menuId,
            canView: mp.canView ?? true,
            canEdit: mp.canEdit ?? false,
            canDelete: mp.canDelete ?? false,
          }))
        })
      }

      // Fetch updated role with permissions
      return await tx.customRole.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              menu: true
            }
          }
        }
      })
    })

    return NextResponse.json({ role: updatedRole })
  } catch (error: any) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update role' },
      { status: 500 }
    )
  }
}

// DELETE — Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  // Only OWNER can delete roles
  if (!dbUser || dbUser.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    const role = await prisma.customRole.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    })

    if (!role) {
      return NextResponse.json({ error: 'Role tidak ditemukan' }, { status: 404 })
    }

    // Can't delete Owner role (protect main admin)
    if (role.name === 'Owner') {
      return NextResponse.json(
        { error: 'Owner role tidak bisa dihapus untuk keamanan sistem' },
        { status: 400 }
      )
    }

    // Can't delete role with active users
    if (role._count.users > 0) {
      return NextResponse.json(
        { error: `Role ini masih digunakan oleh ${role._count.users} user` },
        { status: 400 }
      )
    }

    await prisma.customRole.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete role' },
      { status: 500 }
    )
  }
}
