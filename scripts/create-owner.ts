/**
 * Script to create initial OWNER user
 * Run with: npx tsx scripts/create-owner.ts
 */

import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createOwner() {
  console.log('🚀 Creating initial OWNER user...\n')

  // Step 1: Get user details
  const email = process.env.OWNER_EMAIL || 'owner@yoonjaespace.com'
  const password = process.env.OWNER_PASSWORD || 'ChangeMe123!'
  const name = process.env.OWNER_NAME || 'Studio Owner'

  console.log(`📧 Email: ${email}`)
  console.log(`👤 Name: ${name}`)
  console.log(`🔑 Password: ${password}\n`)

  // Step 2: Create user in Supabase Auth
  console.log('Creating user in Supabase Auth...')
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
  })

  if (authError) {
    console.error('❌ Error creating auth user:', authError.message)
    process.exit(1)
  }

  if (!authData.user) {
    console.error('❌ No user data returned')
    process.exit(1)
  }

  console.log(`✅ Auth user created with ID: ${authData.user.id}\n`)

  // Step 3: Create user in database
  console.log('Creating user in database...')
  try {
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        name,
        email,
        role: 'OWNER',
        customRoleId: 'role-owner',
        isActive: true,
      }
    })

    console.log('✅ Database user created successfully!\n')
    console.log('🎉 OWNER user created successfully!')
    console.log('\n📋 Login credentials:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log('\n🌐 You can now login at: http://localhost:3000/login')
  } catch (dbError: any) {
    console.error('❌ Error creating database user:', dbError.message)

    // Cleanup: Delete auth user if database insert fails
    console.log('🧹 Cleaning up auth user...')
    await supabase.auth.admin.deleteUser(authData.user.id)
    console.log('✅ Cleanup complete')

    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createOwner()
