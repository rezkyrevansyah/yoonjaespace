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
  // 1. Buat user di Supabase Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: 'owner@yoonjaespace.com',
    password: 'owner123456',
    email_confirm: true,
  })

  if (authError) {
    console.error('Error creating auth user:', authError.message)
    return
  }

  console.log('Auth user created:', authUser.user.id)

  // 2. Buat user di tabel users dengan ID yang sama
  const user = await prisma.user.create({
    data: {
      id: authUser.user.id,
      name: 'Owner Yoonjaespace',
      email: 'owner@yoonjaespace.com',
      role: 'OWNER',
    },
  })

  console.log('Database user created:', user)

  // 3. Seed packages (dummy data)
  const packages = await prisma.package.createMany({
    data: [
      { name: 'Birthday Smash Cake Session', description: 'Sesi foto birthday smash cake untuk anak', price: 500000, duration: 60, maxPeople: 5 },
      { name: 'Graduation Session', description: 'Sesi foto wisuda', price: 350000, duration: 45, maxPeople: 3 },
      { name: 'Family Session', description: 'Sesi foto keluarga', price: 600000, duration: 90, maxPeople: 8 },
      { name: 'Group Session', description: 'Sesi foto group/teman', price: 400000, duration: 60, maxPeople: 10 },
      { name: 'LinkedIn Profile Session', description: 'Sesi foto profil profesional', price: 250000, duration: 30, maxPeople: 1 },
      { name: 'Pas Photo Session', description: 'Sesi foto pas/formal', price: 150000, duration: 15, maxPeople: 1 },
      { name: 'Studio Only', description: 'Sewa studio tanpa photographer', price: 200000, duration: 60, maxPeople: 10 },
    ],
  })

  console.log('Packages created:', packages.count)

  // 4. Seed backgrounds
  const backgrounds = await prisma.background.createMany({
    data: [
      { name: 'Limbo' },
      { name: 'Spotlight' },
      { name: 'Mid-Century' },
      { name: 'Chrome' },
    ],
  })

  console.log('Backgrounds created:', backgrounds.count)

  // 5. Seed add-on templates
  const addOns = await prisma.addOnTemplate.createMany({
    data: [
      { name: 'MUA', defaultPrice: 200000 },
      { name: 'Extra Person', defaultPrice: 50000 },
      { name: 'Extra Duration (30 min)', defaultPrice: 100000 },
      { name: 'Print Canvas', defaultPrice: 150000 },
      { name: 'Print Photo', defaultPrice: 75000 },
    ],
  })

  console.log('Add-on templates created:', addOns.count)

  // 6. Seed studio settings
  const settings = [
    { key: 'studio_name', value: 'Yoonjaespace' },
    { key: 'operating_hours', value: JSON.stringify({ open: '08:00', close: '20:00' }) },
    { key: 'day_off', value: 'tuesday' },
    { key: 'default_payment_status', value: 'unpaid' },
    { key: 'studio_instagram', value: 'https://www.instagram.com/yoonjaespace' },
  ]

  for (const setting of settings) {
    await prisma.studioSetting.create({ data: setting })
  }

  console.log('Studio settings created')

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
