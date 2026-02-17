import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET — Public status page (NO AUTH REQUIRED)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const booking = await prisma.booking.findUnique({
    where: { publicSlug: slug },
    include: {
      client: { select: { name: true } },
      package: { select: { name: true, duration: true } },
      printOrder: {
        select: {
          status: true,
          courier: true,
          trackingNumber: true,
          shippedAt: true,
        },
      },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
  }

  // Get studio settings
  const settings = await prisma.studioSetting.findMany()
  const settingsMap: Record<string, any> = {}
  settings.forEach((s) => {
    try {
      settingsMap[s.key] = JSON.parse(s.value)
    } catch {
      settingsMap[s.key] = s.value
    }
  })

  // Hanya return data yang aman untuk publik
  return NextResponse.json({
    id: booking.id, // Needed for Invoice link construction if client side wants it, though we verify it here
    bookingCode: booking.bookingCode,
    clientName: booking.client.name,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    packageName: booking.package.name,
    packageDuration: booking.package.duration,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    deliveredAt: booking.deliveredAt,
    photoLink: booking.photoLink,
    invoiceLink: `/invoice/${booking.id}`, // Public invoice link
    printOrder: booking.printOrder
      ? {
          status: booking.printOrder.status,
          courier: booking.printOrder.courier,
          trackingNumber: booking.printOrder.trackingNumber,
          shippedAt: booking.printOrder.shippedAt,
        }
      : null,
    studio: {
      name: settingsMap['studio_name'] || 'Yoonjaespace',
      address: settingsMap['studio_address'] || '',
      phone: settingsMap['studio_phone'] || '',
      instagram: settingsMap['studio_instagram'] || '',
      operatingHours: settingsMap['operating_hours'] || { open: '08:00', close: '20:00' },
    },
  })
}
