import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — Get current user's menu permissions
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // OPTIMIZED: Use select to minimize data transfer, avoid deep nesting
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        customRoleId: true,
        customRole: {
          select: {
            name: true
          }
        }
      }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // If user doesn't have customRole, fall back to enum role
    // Owner and Admin get all menus by default
    let permissions: any[] = []

    if (dbUser.customRoleId) {
      // OPTIMIZED: Separate query with select to avoid deep nesting
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId: dbUser.customRoleId },
        select: {
          canView: true,
          canEdit: true,
          canDelete: true,
          menu: {
            select: {
              name: true,
              label: true,
              sortOrder: true
            }
          }
        }
      })

      permissions = rolePermissions.map((p) => ({
        menuName: p.menu.name,
        menuLabel: p.menu.label,
        sortOrder: p.menu.sortOrder,
        canView: p.canView,
        canEdit: p.canEdit,
        canDelete: p.canDelete,
      }))
    } else {
      // Fallback for users without customRole (backward compatibility)
      const allMenus = await prisma.menu.findMany({
        select: { name: true, label: true, sortOrder: true },
        orderBy: { sortOrder: 'asc' }
      })

      if (dbUser.role === 'OWNER') {
        // Owner gets full access
        permissions = allMenus.map((m) => ({
          menuName: m.name,
          menuLabel: m.label,
          sortOrder: m.sortOrder,
          canView: true,
          canEdit: true,
          canDelete: true,
        }))
      } else if (dbUser.role === 'ADMIN') {
        // Admin gets most menus
        permissions = allMenus
          .filter((m) => m.name !== 'commissions')
          .map((m) => ({
            menuName: m.name,
            menuLabel: m.label,
            sortOrder: m.sortOrder,
            canView: true,
            canEdit: !['users', 'settings'].includes(m.name),
            canDelete: !['users', 'settings', 'finance'].includes(m.name),
          }))
      } else if (dbUser.role === 'PHOTOGRAPHER') {
        // Photographer gets limited access
        permissions = allMenus
          .filter((m) => ['dashboard', 'bookings', 'clients', 'calendar', 'reminders'].includes(m.name))
          .map((m) => ({
            menuName: m.name,
            menuLabel: m.label,
            sortOrder: m.sortOrder,
            canView: true,
            canEdit: ['bookings', 'calendar'].includes(m.name),
            canDelete: false,
          }))
      } else if (dbUser.role === 'PACKAGING_STAFF') {
        // Packaging staff gets minimal access
        permissions = allMenus
          .filter((m) => ['dashboard', 'bookings', 'clients'].includes(m.name))
          .map((m) => ({
            menuName: m.name,
            menuLabel: m.label,
            sortOrder: m.sortOrder,
            canView: true,
            canEdit: m.name === 'bookings',
            canDelete: false,
          }))
      }
    }

    // Sort by sortOrder
    permissions.sort((a, b) => a.sortOrder - b.sortOrder)

    return NextResponse.json({
      permissions,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        customRoleName: dbUser.customRole?.name,
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=300',
      },
    })
  } catch (error: any) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}
