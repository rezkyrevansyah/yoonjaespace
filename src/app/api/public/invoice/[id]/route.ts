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

    // TODO: Payment tracking feature - requires Payment model
    // For now, use simple paid/unpaid from booking status
    const totalPaid = booking.paymentStatus === 'PAID' ? booking.totalAmount : 0
    const outstandingBalance = booking.totalAmount - totalPaid

    // Get studio settings
    const settings = await prisma.studioSetting.findMany()
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
    })
  } catch (error: any) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
