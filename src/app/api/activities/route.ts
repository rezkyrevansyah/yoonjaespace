import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — List activity logs
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const type = searchParams.get('type') // optional filter

  try {
    const activities = (await prisma.activityLog.findMany({
      where: type ? { type } : {},
      include: {
        user: {
          select: {
            name: true,
            role: true,
          }
        }
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    })).map((a: any) => ({
      id: a.id,
      userId: a.userId,
      userName: a.user.name,
      userRole: a.user.role,
      action: a.action,
      details: a.details,
      type: a.type as any,
      timestamp: a.timestamp,
    }))

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}

// POST — Create an activity log
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action, details, type } = body

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    const a = await prisma.activityLog.create({
      data: {
        userId: user.id,
        action,
        details,
        type: type || 'SYSTEM',
      },
      include: {
        user: {
          select: {
            name: true,
            role: true,
          }
        }
      }
    })

    return NextResponse.json({
      id: a.id,
      userId: a.userId,
      userName: a.user.name,
      userRole: a.user.role,
      action: a.action,
      details: a.details,
      type: a.type as any,
      timestamp: a.timestamp,
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create activity log:', error)
    return NextResponse.json({ error: 'Failed to create activity log' }, { status: 500 })
  }
}
