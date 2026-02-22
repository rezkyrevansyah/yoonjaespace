import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// POST — Upload studio photo (logo or front photo)
// Both types are stored in 'studio-assets' bucket with different prefixes
export async function POST(request: NextRequest) {
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
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'logo' or 'studio_photo'

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (!['logo', 'studio_photo'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "logo" or "studio_photo"' }, { status: 400 })
    }

    // Use studio-assets bucket for both logo and studio photo
    const bucket = 'studio-assets'
    const settingKey = type === 'logo' ? 'logo_url' : 'studio_photo_url'
    const filePrefix = type === 'logo' ? 'logo' : 'studio_photo'

    // Get existing file URL to delete old file
    const existingSetting = await prisma.studioSetting.findUnique({
      where: { key: settingKey }
    })

    // Delete old file if exists
    if (existingSetting?.value) {
      try {
        const oldFileName = existingSetting.value.split('/').pop()
        if (oldFileName) {
          await supabase.storage.from(bucket).remove([oldFileName])
        }
      } catch (error) {
        console.error('Failed to delete old file:', error)
        // Continue even if delete fails
      }
    }

    // Upload new file
    const fileExt = file.name.split('.').pop()
    const fileName = `${filePrefix}_${Date.now()}.${fileExt}`
    const fileBuffer = await file.arrayBuffer()

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({
        error: 'Failed to upload file',
        details: uploadError.message,
        bucket: bucket
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    // Save to database
    await prisma.studioSetting.upsert({
      where: { key: settingKey },
      update: { value: publicUrl },
      create: { key: settingKey, value: publicUrl }
    })

    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    console.error('Failed to upload file:', error)
    return NextResponse.json({
      error: 'Failed to upload file',
      details: error.message || String(error)
    }, { status: 500 })
  }
}
