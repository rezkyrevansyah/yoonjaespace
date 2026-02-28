import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — List packages
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const activeOnly = searchParams.get('active') === 'true'

  const packages = await prisma.package.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(packages, {
    headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' },
  })
}

// POST — Create package
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, description, price, duration, maxPeople, allPhotos, editedPhotos, extraTimeBefore, isActive } = body

    if (!name || price === undefined || !duration) {
      return NextResponse.json(
        { error: 'Nama, harga, dan durasi harus diisi' },
        { status: 400 }
      )
    }

    const pkg = await prisma.package.create({
      data: {
        name,
        description: description || null,
        price: Number(price),
        duration: Number(duration),
        maxPeople: maxPeople ? Number(maxPeople) : 1,
        allPhotos: allPhotos || false,
        editedPhotos: editedPhotos ? Number(editedPhotos) : 0,
        extraTimeBefore: extraTimeBefore ? Number(extraTimeBefore) : 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(pkg, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Package POST error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
