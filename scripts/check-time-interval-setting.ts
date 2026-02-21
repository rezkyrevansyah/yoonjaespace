import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking timeIntervalMinutes setting...')

  const setting = await prisma.studioSetting.findUnique({
    where: { key: 'timeIntervalMinutes' }
  })

  if (setting) {
    console.log('✅ Setting exists:', setting)
    console.log('   Current value:', setting.value)
  } else {
    console.log('⚠️  Setting not found! Creating default...')

    const newSetting = await prisma.studioSetting.create({
      data: {
        key: 'timeIntervalMinutes',
        value: '30'
      }
    })

    console.log('✅ Created:', newSetting)
  }

  // List all settings
  console.log('\n📋 All settings:')
  const allSettings = await prisma.studioSetting.findMany()
  allSettings.forEach(s => {
    console.log(`   ${s.key}: ${s.value}`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
