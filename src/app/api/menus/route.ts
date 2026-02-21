import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — List all available menus
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const menus = await prisma.menu.findMany({
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ menus })
  } catch (error: any) {
    console.error('Error fetching menus:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch menus' },
      { status: 500 }
    )
  }
}
