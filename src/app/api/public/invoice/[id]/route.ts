import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — Public invoice data (NO AUTH REQUIRED, uses secure ID)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        client: true,
        package: true,
        addOns: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })
    }

    // Get studio settings
    const settings = await prisma.studioSetting.findMany()
    const settingsMap: Record<string, string> = {}
    settings.forEach((s) => {
      settingsMap[s.key] = s.value
    })

    return NextResponse.json({
      booking: {
        ...booking,
        paidAmount: booking.paymentStatus === 'PAID' ? booking.totalAmount : 0,
      },
      studio: {
        name: settingsMap['studio_name'] || 'Yoonjaespace',
        address: settingsMap['studio_address'] || '',
        phone: settingsMap['studio_phone'] || '',
        instagram: settingsMap['studio_instagram'] || '',
      },
    })
  } catch (error: any) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
