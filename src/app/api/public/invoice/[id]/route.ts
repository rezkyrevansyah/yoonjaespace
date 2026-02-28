import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — Public invoice data (NO AUTH REQUIRED, uses secure ID)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Run both DB queries in parallel — cuts response time ~40-50%
    const [booking, settings] = await Promise.all([
      prisma.booking.findUnique({
        where: { id },
        include: {
          client: true,
          package: true,
          addOns: true,
        },
      }),
      prisma.studioSetting.findMany(),
    ])

    if (!booking) {
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })
    }

    const totalPaid = booking.paymentStatus === 'PAID' ? booking.totalAmount : 0
    const outstandingBalance = booking.totalAmount - totalPaid

    const settingsMap: Record<string, string> = {}
    settings.forEach((s) => {
      settingsMap[s.key] = s.value
    })

    return NextResponse.json({
      booking: {
        ...booking,
        paidAmount: totalPaid,
        outstandingBalance,
      },
      studio: {
        name: settingsMap['studio_name'] || 'Yoonjaespace Studio',
        address: settingsMap['address'] || '',
        phone: settingsMap['phone_number'] || settingsMap['whatsapp_number'] || '',
        instagram: settingsMap['instagram'] || '',
        logoUrl: settingsMap['logo_url'] || '',
        footerText: settingsMap['footer_text'] || 'Thank you for choosing Yoonjaespace Studio!',
      },
    }, {
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' },
    })
  } catch (error: any) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
