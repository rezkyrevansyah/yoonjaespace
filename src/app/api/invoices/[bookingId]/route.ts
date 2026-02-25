import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { format } from 'date-fns'

// POST — Generate invoice for booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser || !['OWNER', 'ADMIN'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Cek apakah sudah ada invoice
  const existing = await prisma.invoice.findUnique({
    where: { bookingId },
  })

  if (existing) {
    return NextResponse.json({ error: 'Invoice sudah ada untuk booking ini' }, { status: 400 })
  }

  // Generate invoice number: INV-YYYYMMDD-XXX
  const today = format(new Date(), 'yyyyMMdd')
  const countToday = await prisma.invoice.count({
    where: {
      invoiceNumber: { startsWith: `INV-${today}` },
    },
  })
  const invoiceNumber = `INV-${today}-${String(countToday + 1).padStart(3, '0')}`

  const invoice = await prisma.invoice.create({
    data: {
      bookingId,
      invoiceNumber,
    },
    include: {
      booking: {
        include: {
          client: true,
          package: true,
          addOns: true,
        },
      },
    },
  })

  return NextResponse.json(invoice, { status: 201 })
}

// GET — Get invoice data for PDF rendering
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const invoice = await prisma.invoice.findUnique({
    where: { bookingId },
    include: {
      booking: {
        include: {
          client: true,
          package: true,
          addOns: true,
          handledBy: { select: { name: true } },
        },
      },
    },
  })

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })
  }

  // Get studio settings for invoice header
  const settings = await prisma.studioSetting.findMany()
  const settingsMap: Record<string, string> = {}
  settings.forEach((s) => {
    settingsMap[s.key] = s.value
  })

  return NextResponse.json({
    invoice,
    studio: {
      name: settingsMap['studio_name'] || 'Yoonjaespace',
      address: settingsMap['address'] || settingsMap['studio_address'] || '',
      phone: settingsMap['phone_number'] || settingsMap['studio_phone'] || '',
      instagram: settingsMap['instagram'] || settingsMap['studio_instagram'] || '',
    },
  })
}
