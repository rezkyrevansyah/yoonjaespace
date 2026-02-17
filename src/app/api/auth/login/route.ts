import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email dan password harus diisi' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.json(
      { error: 'Email atau password salah' },
      { status: 401 }
    )
  }

  // Check if user exists in database
  const userId = data.user.id
  const dbUser = await prisma.user.findUnique({ where: { id: userId } })

  if (!dbUser) {
    return NextResponse.json(
      { error: 'User tidak terdaftar. Hubungi admin untuk mendaftarkan akun Anda.' },
      { status: 403 }
    )
  }

  if (!dbUser.isActive) {
    return NextResponse.json(
      { error: 'Akun Anda tidak aktif. Hubungi admin.' },
      { status: 403 }
    )
  }

  return NextResponse.json({ user: data.user })
}
