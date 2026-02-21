import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// POST — Upload new logo to Supabase Storage
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  // Only OWNER can upload logo
  if (!dbUser || dbUser.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('logo') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Get old logo URL to delete after successful upload
    const oldLogoSetting = await prisma.studioSetting.findUnique({
      where: { key: 'studio_logo_url' }
    })
    const oldLogoUrl = oldLogoSetting?.value || ''

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate unique filename
    const ext = file.type.split('/')[1]
    const filename = `logo_${Date.now()}.${ext}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('studio-assets')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: `Failed to upload: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('studio-assets')
      .getPublicUrl(filename)

    // Save to settings
    await prisma.studioSetting.upsert({
      where: { key: 'studio_logo_url' },
      update: { value: publicUrl },
      create: { key: 'studio_logo_url', value: publicUrl }
    })

    // Delete old logo from storage (if exists and not default logo)
    if (oldLogoUrl && oldLogoUrl.trim() !== '' && oldLogoUrl.includes('studio-assets')) {
      try {
        // Extract filename from URL
        // URL format: https://.../storage/v1/object/public/studio-assets/logo_123456.png
        const urlParts = oldLogoUrl.split('/studio-assets/')
        if (urlParts.length > 1) {
          const oldFilename = urlParts[1]

          const { error: deleteError } = await supabase.storage
            .from('studio-assets')
            .remove([oldFilename])

          if (deleteError) {
            console.error('Failed to delete old logo:', deleteError)
            // Don't fail the request if delete fails - new logo is already uploaded
          } else {
            console.log('Old logo deleted successfully:', oldFilename)
          }
        }
      } catch (err) {
        console.error('Error deleting old logo:', err)
        // Don't fail the request
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: uploadData.path
    })
  } catch (error: any) {
    console.error('Logo upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload logo' },
      { status: 500 }
    )
  }
}

// DELETE — Remove logo (optional endpoint)
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser || dbUser.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Get current logo URL
    const logoSetting = await prisma.studioSetting.findUnique({
      where: { key: 'studio_logo_url' }
    })
    const logoUrl = logoSetting?.value || ''

    // Delete from storage first
    if (logoUrl && logoUrl.trim() !== '' && logoUrl.includes('studio-assets')) {
      try {
        // Extract filename from URL
        const urlParts = logoUrl.split('/studio-assets/')
        if (urlParts.length > 1) {
          const filename = urlParts[1]

          const { error: deleteError } = await supabase.storage
            .from('studio-assets')
            .remove([filename])

          if (deleteError) {
            console.error('Failed to delete logo from storage:', deleteError)
          } else {
            console.log('Logo deleted from storage:', filename)
          }
        }
      } catch (err) {
        console.error('Error deleting logo from storage:', err)
      }
    }

    // Remove from settings (set to empty/default)
    await prisma.studioSetting.upsert({
      where: { key: 'studio_logo_url' },
      update: { value: '' },
      create: { key: 'studio_logo_url', value: '' }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to remove logo' },
      { status: 500 }
    )
  }
}
