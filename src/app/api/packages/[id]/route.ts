import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// PATCH — Update package
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

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser || !['OWNER', 'ADMIN'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, description, price, duration, maxPeople, isActive, allPhotos, editedPhotos, extraTimeBefore } = body

  try {
    const updated = await prisma.package.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(price !== undefined && { price: Number(price) }),
        ...(duration !== undefined && { duration: Number(duration) }),
        ...(maxPeople !== undefined && { maxPeople: Number(maxPeople) }),
        ...(isActive !== undefined && { isActive }),
        ...(allPhotos !== undefined && { allPhotos }),
        ...(editedPhotos !== undefined && { editedPhotos: Number(editedPhotos) }),
        ...(extraTimeBefore !== undefined && { extraTimeBefore: Number(extraTimeBefore) }),
      },
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Package PATCH error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE — Delete package (soft delete via isActive)
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

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser || !['OWNER', 'ADMIN'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Soft delete — set isActive false (karena booking lama masih reference ke package ini)
  const updated = await prisma.package.update({
    where: { id },
    data: { isActive: false },
  })

  return NextResponse.json(updated)
}
