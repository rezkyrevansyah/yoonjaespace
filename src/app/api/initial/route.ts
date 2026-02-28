import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * GET /api/initial — Batched initial data untuk layout
 *
 * Menggabungkan 4 API call menjadi 1:
 * - /api/auth/me (user data)
 * - /api/settings (studio settings)
 * - /api/permissions (menu permissions)
 * - /api/reminders/count (badge count)
 *
 * Dari 4x auth check ke Supabase → 1x saja
 * Estimasi: 3-4 detik → 0.8-1.2 detik
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1 auth check, 1 user lookup — shared across all data
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      customRoleId: true,
      customRole: { select: { name: true } },
    }
  })

  if (!dbUser || !dbUser.isActive) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parallel queries — semua jalan bersamaan
  const [settingsRaw, permissionsData, reminderCount] = await Promise.all([
    // Settings
    prisma.studioSetting.findMany({
      select: { key: true, value: true }
    }),

    // Permissions
    getPermissions(dbUser),

    // Reminder count (hanya untuk OWNER/ADMIN)
    getReminderCount(dbUser.role),
  ])

  // Transform settings
  const raw: Record<string, any> = {}
  settingsRaw.forEach((s) => {
    try {
      raw[s.key] = JSON.parse(s.value)
    } catch {
      raw[s.key] = s.value
    }
  })

  const operating = raw.operating_hours || { open: '08:00', close: '20:00' }
  const settings = {
    name: raw.studio_name || 'Yoonjaespace',
    address: raw.address || raw.studio_address || '',
    phone: raw.phone_number || raw.studio_phone || '',
    instagram: raw.instagram || raw.studio_instagram || '',
    openTime: operating.open,
    closeTime: operating.close,
    dayOff: typeof raw.day_off === 'string' ? [raw.day_off] : (raw.day_off || []),
    defaultPaymentStatus: raw.default_payment_status?.toUpperCase() || 'UNPAID',
    reminderMessageTemplate: raw.reminder_message_template || 'Halo {{clientName}}, ini reminder untuk sesi foto kamu di {{studioName}} pada {{date}} pukul {{time}}. Paket: {{packageName}}. Ditunggu ya! 😊\n\nCek status booking kamu di: {{clientPageLink}}',
    thankYouPaymentTemplate: raw.thank_you_payment_template || 'Terima kasih {{clientName}} sudah melakukan pembayaran untuk sesi foto di {{studioName}}! 🙏\n\nSesi foto kamu dijadwalkan pada {{date}} pukul {{time}}.\nPaket: {{packageName}}\n\nDitunggu kehadirannya ya! Kalau ada pertanyaan, jangan ragu untuk chat kami.\n\nCek status booking: {{clientPageLink}}',
    thankYouSessionTemplate: raw.thank_you_session_template || 'Halo {{clientName}}, terima kasih sudah memilih {{studioName}} untuk sesi foto kamu! 🙏✨\n\nKami harap kamu puas dengan hasilnya. Jangan lupa cek status booking untuk melihat update foto kamu:\n{{clientPageLink}}\n\nSampai jumpa lagi! 😊',
    logoUrl: raw.logo_url || raw.studio_logo_url || '',
    mapsUrl: raw.studio_maps_url || '',
    studioPhotoUrl: raw.studio_photo_url || '',
    footerText: raw.studio_footer_text || '',
    timeIntervalMinutes: raw.timeIntervalMinutes || '30',
  }

  return NextResponse.json({
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
    },
    settings,
    permissions: {
      permissions: permissionsData,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        customRoleName: dbUser.customRole?.name,
      }
    },
    reminderCount: { count: reminderCount },
  }, {
    headers: {
      'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
    },
  })
}

// --- Helper functions (extracted from individual routes) ---

async function getPermissions(dbUser: {
  role: string
  customRoleId: string | null
  customRole: { name: string } | null
}) {
  let permissions: any[] = []

  if (dbUser.customRoleId) {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: dbUser.customRoleId },
      select: {
        canView: true,
        canEdit: true,
        canDelete: true,
        menu: { select: { name: true, label: true, sortOrder: true } }
      }
    })
    permissions = rolePermissions.map((p) => ({
      menuName: p.menu.name,
      menuLabel: p.menu.label,
      sortOrder: p.menu.sortOrder,
      canView: p.canView,
      canEdit: p.canEdit,
      canDelete: p.canDelete,
    }))
  } else {
    const allMenus = await prisma.menu.findMany({
      select: { name: true, label: true, sortOrder: true },
      orderBy: { sortOrder: 'asc' }
    })

    if (dbUser.role === 'OWNER') {
      permissions = allMenus.map((m) => ({
        menuName: m.name, menuLabel: m.label, sortOrder: m.sortOrder,
        canView: true, canEdit: true, canDelete: true,
      }))
    } else if (dbUser.role === 'ADMIN') {
      permissions = allMenus
        .filter((m) => m.name !== 'commissions')
        .map((m) => ({
          menuName: m.name, menuLabel: m.label, sortOrder: m.sortOrder,
          canView: true,
          canEdit: !['users', 'settings'].includes(m.name),
          canDelete: !['users', 'settings', 'finance'].includes(m.name),
        }))
    } else if (dbUser.role === 'PHOTOGRAPHER') {
      permissions = allMenus
        .filter((m) => ['dashboard', 'bookings', 'clients', 'calendar', 'reminders'].includes(m.name))
        .map((m) => ({
          menuName: m.name, menuLabel: m.label, sortOrder: m.sortOrder,
          canView: true,
          canEdit: ['bookings', 'calendar'].includes(m.name),
          canDelete: false,
        }))
    } else if (dbUser.role === 'PACKAGING_STAFF') {
      permissions = allMenus
        .filter((m) => ['dashboard', 'bookings', 'clients'].includes(m.name))
        .map((m) => ({
          menuName: m.name, menuLabel: m.label, sortOrder: m.sortOrder,
          canView: true,
          canEdit: m.name === 'bookings',
          canDelete: false,
        }))
    }
  }

  permissions.sort((a, b) => a.sortOrder - b.sortOrder)
  return permissions
}

async function getReminderCount(role: string): Promise<number> {
  if (!['OWNER', 'ADMIN'].includes(role)) return 0

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  return prisma.booking.count({
    where: {
      date: { gte: todayStart, lt: todayEnd },
      status: { notIn: ['CANCELLED', 'CLOSED'] },
    }
  })
}
