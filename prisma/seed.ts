import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

async function main() {
  // 1. Cek atau buat user
  let userId: string
  const existingUser = await prisma.user.findFirst({ where: { email: 'owner@yoonjaespace.com' } })

  if (existingUser) {
    console.log('Owner user already exists:', existingUser.id)
    userId = existingUser.id
  } else {
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'owner@yoonjaespace.com',
      password: 'owner123456',
      email_confirm: true,
    })

    if (authError) {
      console.error('Error creating auth user:', authError.message)
      return
    }

    const user = await prisma.user.create({
      data: {
        id: authUser.user.id,
        name: 'Owner Yoonjaespace',
        email: 'owner@yoonjaespace.com',
        role: 'OWNER',
      },
    })

    userId = user.id
    console.log('Owner user created:', userId)
  }

  // 3. Seed packages
  const packagesData = [
    { name: 'Birthday Smash Cake Session', description: 'Sesi foto birthday smash cake untuk anak', price: 500000, duration: 60, maxPeople: 5 },
    { name: 'Graduation Session', description: 'Sesi foto wisuda', price: 350000, duration: 45, maxPeople: 3 },
    { name: 'Family Session', description: 'Sesi foto keluarga', price: 600000, duration: 90, maxPeople: 8 },
    { name: 'Group Session', description: 'Sesi foto group/teman', price: 400000, duration: 60, maxPeople: 10 },
    { name: 'LinkedIn Profile Session', description: 'Sesi foto profil profesional', price: 250000, duration: 30, maxPeople: 1 },
    { name: 'Pas Photo Session', description: 'Sesi foto pas/formal', price: 150000, duration: 15, maxPeople: 1 },
    { name: 'Studio Only', description: 'Sewa studio tanpa photographer', price: 200000, duration: 60, maxPeople: 10 },
  ]

  const existingPackages = await prisma.package.count()
  if (existingPackages === 0) {
    await prisma.package.createMany({ data: packagesData })
    console.log('Packages created:', packagesData.length)
  } else {
    console.log('Packages already exist, skipped')
  }

  // 4. Seed backgrounds
  const backgroundsData = [
    { name: 'Limbo' },
    { name: 'Spotlight' },
    { name: 'Mid-Century' },
    { name: 'Chrome' },
  ]

  const existingBackgrounds = await prisma.background.count()
  if (existingBackgrounds === 0) {
    await prisma.background.createMany({ data: backgroundsData })
    console.log('Backgrounds created:', backgroundsData.length)
  } else {
    console.log('Backgrounds already exist, skipped')
  }

  // 5. Seed add-on templates
  const addOnsData = [
    { name: 'MUA', defaultPrice: 200000 },
    { name: 'Extra Person', defaultPrice: 50000 },
    { name: 'Extra Duration (30 min)', defaultPrice: 100000 },
    { name: 'Print Canvas', defaultPrice: 150000 },
    { name: 'Print Photo', defaultPrice: 75000 },
  ]

  const existingAddOns = await prisma.addOnTemplate.count()
  if (existingAddOns === 0) {
    await prisma.addOnTemplate.createMany({ data: addOnsData })
    console.log('Add-on templates created:', addOnsData.length)
  } else {
    console.log('Add-on templates already exist, skipped')
  }

  // 6. Seed studio settings
  const settings = [
    { key: 'studio_name', value: 'Yoonjaespace' },
    { key: 'studio_address', value: 'Jakarta, Indonesia' },
    { key: 'studio_phone', value: '+6281234567890' },
    { key: 'operating_hours', value: JSON.stringify({ open: '08:00', close: '20:00' }) },
    { key: 'day_off', value: JSON.stringify(['tuesday']) },
    { key: 'default_payment_status', value: 'unpaid' },
    { key: 'studio_instagram', value: 'https://www.instagram.com/yoonjaespace' },
  ]

  for (const setting of settings) {
    await prisma.studioSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting
    })
  }

  console.log('Studio settings created/updated')

  // 7. Seed custom fields
  const customFieldsData = [
    { fieldName: 'Background Preference', fieldType: 'dropdown', options: JSON.stringify(['Limbo', 'Spotlight', 'Mid-Century', 'Chrome']), isRequired: false },
    { fieldName: 'BTS Video', fieldType: 'checkbox', isRequired: false },
    { fieldName: 'Special Request', fieldType: 'text', isRequired: false },
  ]

  const existingFields = await prisma.customFieldDefinition.count()
  if (existingFields === 0) {
    await prisma.customFieldDefinition.createMany({ data: customFieldsData })
    console.log('Custom fields created:', customFieldsData.length)
  } else {
    console.log('Custom fields already exist, skipped')
  }

  // 8. Seed vouchers
  const vouchersData = [
    {
      code: 'WELCOME10',
      description: 'Diskon 10% untuk customer baru',
      discountType: 'percentage',
      discountValue: 10,
      minPurchase: 300000,
      maxUsage: 100,
      validUntil: new Date('2026-12-31'),
      isActive: true
    },
    {
      code: 'GRAD2026',
      description: 'Diskon Rp50.000 untuk graduation session',
      discountType: 'fixed',
      discountValue: 50000,
      minPurchase: 0,
      maxUsage: 50,
      validUntil: new Date('2026-06-30'),
      isActive: true
    },
  ]

  const existingVouchers = await prisma.voucher.count()
  if (existingVouchers === 0) {
    await prisma.voucher.createMany({ data: vouchersData })
    console.log('Vouchers created:', vouchersData.length)
  } else {
    console.log('Vouchers already exist, skipped')
  }

  console.log('\n✅ Seed completed!')
  console.log('Login with: owner@yoonjaespace.com / owner123456')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
