import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Helper to get or create setting
async function getSetting(key: string, defaultValue: string = '') {
  let setting = await prisma.studioSetting.findUnique({ where: { key } })

  if (!setting) {
    setting = await prisma.studioSetting.create({
      data: { key, value: defaultValue }
    })
  }

  return setting.value
}

// Helper to set setting
async function setSetting(key: string, value: string) {
  return await prisma.studioSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  })
}

// GET — Get all studio settings
export async function GET(request: NextRequest) {
  try {
    const settings = {
      studioName: await getSetting('studio_name', 'Yoonjaespace Studio'),
      logoUrl: await getSetting('logo_url'),
      studioPhotoUrl: await getSetting('studio_photo_url'),
      address: await getSetting('address'),
      mapsUrl: await getSetting('maps_url'),
      mapsLatitude: await getSetting('maps_latitude'),
      mapsLongitude: await getSetting('maps_longitude'),
      phoneNumber: await getSetting('phone_number'),
      whatsappNumber: await getSetting('whatsapp_number'),
      email: await getSetting('email'),
      instagram: await getSetting('instagram'),
      footerText: await getSetting('footer_text', 'Thank you for choosing Yoonjaespace Studio!'),
    }

    return NextResponse.json(settings, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' },
    })
  } catch (error) {
    console.error('Failed to fetch studio settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PATCH — Update studio settings (Owner/Admin only)
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

  try {
    const body = await request.json()

    const updates: Promise<any>[] = []

    if (body.studioName !== undefined) updates.push(setSetting('studio_name', body.studioName))
    if (body.logoUrl !== undefined) updates.push(setSetting('logo_url', body.logoUrl))
    if (body.studioPhotoUrl !== undefined) updates.push(setSetting('studio_photo_url', body.studioPhotoUrl))
    if (body.address !== undefined) updates.push(setSetting('address', body.address))
    if (body.mapsUrl !== undefined) updates.push(setSetting('maps_url', body.mapsUrl))
    if (body.mapsLatitude !== undefined) updates.push(setSetting('maps_latitude', body.mapsLatitude.toString()))
    if (body.mapsLongitude !== undefined) updates.push(setSetting('maps_longitude', body.mapsLongitude.toString()))
    if (body.phoneNumber !== undefined) updates.push(setSetting('phone_number', body.phoneNumber))
    if (body.whatsappNumber !== undefined) updates.push(setSetting('whatsapp_number', body.whatsappNumber))
    if (body.email !== undefined) updates.push(setSetting('email', body.email))
    if (body.instagram !== undefined) updates.push(setSetting('instagram', body.instagram))
    if (body.footerText !== undefined) updates.push(setSetting('footer_text', body.footerText))

    await Promise.all(updates)

    // Return updated settings
    const settings = {
      studioName: await getSetting('studio_name', 'Yoonjaespace Studio'),
      logoUrl: await getSetting('logo_url'),
      studioPhotoUrl: await getSetting('studio_photo_url'),
      address: await getSetting('address'),
      mapsUrl: await getSetting('maps_url'),
      mapsLatitude: await getSetting('maps_latitude'),
      mapsLongitude: await getSetting('maps_longitude'),
      phoneNumber: await getSetting('phone_number'),
      whatsappNumber: await getSetting('whatsapp_number'),
      email: await getSetting('email'),
      instagram: await getSetting('instagram'),
      footerText: await getSetting('footer_text', 'Thank you for choosing Yoonjaespace Studio!'),
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to update studio settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
