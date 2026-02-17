import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — Get all settings
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await prisma.studioSetting.findMany()

  // Convert to key-value object
  const raw: Record<string, any> = {}
  settings.forEach((s) => {
    try {
      raw[s.key] = JSON.parse(s.value)
    } catch {
      raw[s.key] = s.value
    }
  })

  // Transform to frontend format
  const operating = raw.operating_hours || { open: '08:00', close: '20:00' }
  const result = {
    name: raw.studio_name || 'Yoonjaespace',
    address: raw.studio_address || '',
    phone: raw.studio_phone || '',
    instagram: raw.studio_instagram || '',
    openTime: operating.open,
    closeTime: operating.close,
    dayOff: typeof raw.day_off === 'string' ? [raw.day_off] : (raw.day_off || []),
    defaultPaymentStatus: raw.default_payment_status?.toUpperCase() || 'UNPAID',
    reminderMessageTemplate: raw.reminder_message_template || 'Halo {{clientName}}, ini reminder untuk sesi foto kamu di {{studioName}} pada {{date}} pukul {{time}}. Paket: {{packageName}}. Ditunggu ya! 😊\n\nCek status booking kamu di: {{clientPageLink}}',
  }

  return NextResponse.json(result)
}

// PATCH — Update settings (bulk)
export async function PATCH(request: NextRequest) {
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

  // Transform from frontend format to database keys
  const dbUpdates: Record<string, any> = {}

  if (body.name !== undefined) dbUpdates.studio_name = body.name
  if (body.address !== undefined) dbUpdates.studio_address = body.address
  if (body.phone !== undefined) dbUpdates.studio_phone = body.phone
  if (body.instagram !== undefined) dbUpdates.studio_instagram = body.instagram
  if (body.dayOff !== undefined) dbUpdates.day_off = JSON.stringify(body.dayOff)
  if (body.defaultPaymentStatus !== undefined) dbUpdates.default_payment_status = body.defaultPaymentStatus.toLowerCase()
  if (body.reminderMessageTemplate !== undefined) dbUpdates.reminder_message_template = body.reminderMessageTemplate

  if (body.openTime !== undefined || body.closeTime !== undefined) {
    // Get current operating_hours
    const current = await prisma.studioSetting.findUnique({ where: { key: 'operating_hours' } })
    const operating = current ? JSON.parse(current.value) : { open: '08:00', close: '20:00' }

    dbUpdates.operating_hours = {
      open: body.openTime || operating.open,
      close: body.closeTime || operating.close,
    }
  }

  // Save to database
  const updates = Object.entries(dbUpdates).map(([key, value]) => {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
    return prisma.studioSetting.upsert({
      where: { key },
      update: { value: stringValue },
      create: { key, value: stringValue },
    })
  })

  await Promise.all(updates)

  return NextResponse.json({ success: true })
}
