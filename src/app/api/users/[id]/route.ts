import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// GET — Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!currentUser || currentUser.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const targetUser = await prisma.user.findUnique({
    where: { id },
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

  if (!targetUser) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
  }

  return NextResponse.json(targetUser)
}

// PATCH — Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!currentUser || currentUser.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, role, customRoleId, isActive, password } = body

  // Update password di Supabase Auth jika ada
  if (password) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  // Update di database
  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(role && { role }),
      ...(customRoleId !== undefined && { customRoleId: customRoleId || null }),
      ...(isActive !== undefined && { isActive }),
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

  return NextResponse.json(updated)
}

// DELETE — Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!currentUser || currentUser.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Jangan hapus diri sendiri
  if (id === user.id) {
    return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 })
  }

  try {
    // Check if user has related data
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            handledBookings: true,
            commissions: true,
            activities: true,
          }
        }
      }
    })

    if (!userToDelete) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // If user has related data, prevent deletion and suggest alternative
    if (userToDelete._count.handledBookings > 0 || userToDelete._count.commissions > 0 || userToDelete._count.activities > 0) {
      return NextResponse.json({
        error: 'User tidak bisa dihapus karena masih memiliki data terkait (bookings, commissions, atau activities). Silakan nonaktifkan user ini sebagai gantinya.',
        details: {
          handledBookings: userToDelete._count.handledBookings,
          commissions: userToDelete._count.commissions,
          activities: userToDelete._count.activities,
        }
      }, { status: 400 })
    }

    // Hapus dari Supabase Auth
    await supabaseAdmin.auth.admin.deleteUser(id)

    // Hapus dari database
    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/users/[id]] Error:', error)
    return NextResponse.json({
      error: 'Gagal menghapus user. User mungkin masih memiliki data terkait.',
    }, { status: 500 })
  }
}
