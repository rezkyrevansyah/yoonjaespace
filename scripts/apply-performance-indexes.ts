import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Applying performance indexes migration...')

  const migrationPath = join(__dirname, '..', 'prisma', 'migrations', '20260222_add_performance_indexes', 'migration.sql')
  const sql = readFileSync(migrationPath, 'utf-8')

  // Split by statement and execute
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`Found ${statements.length} SQL statements to execute`)

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    try {
      console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`)
      await prisma.$executeRawUnsafe(statement)
      console.log(`✅ Success`)
    } catch (error: any) {
      // Ignore "already exists" errors
      if (error.message.includes('already exists')) {
        console.log(`⚠️  Index already exists, skipping...`)
      } else {
        console.error(`❌ Error:`, error.message)
      }
    }
  }

  console.log('🎉 Performance indexes migration completed!')
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
