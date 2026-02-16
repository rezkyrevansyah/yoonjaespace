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

  const targetUser = await prisma.user.findUnique({ where: { id } })

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
  const { name, role, isActive, password } = body

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
      ...(isActive !== undefined && { isActive }),
    },
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

  // Hapus dari Supabase Auth
  await supabaseAdmin.auth.admin.deleteUser(id)

  // Hapus dari database
  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
