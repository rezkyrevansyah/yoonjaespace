import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding menus and roles...')

  // Check if menus already exist
  const existingMenus = await prisma.menu.findMany()
  if (existingMenus.length > 0) {
    console.log('✅ Menus already exist:', existingMenus.length)
    return
  }

  // Insert menus
  const menus = [
    { id: 'menu-dashboard', name: 'dashboard', label: 'Dashboard', sortOrder: 0 },
    { id: 'menu-bookings', name: 'bookings', label: 'Bookings', sortOrder: 1 },
    { id: 'menu-clients', name: 'clients', label: 'Clients', sortOrder: 2 },
    { id: 'menu-calendar', name: 'calendar', label: 'Calendar', sortOrder: 3 },
    { id: 'menu-reminders', name: 'reminders', label: 'Reminders', sortOrder: 4 },
    { id: 'menu-finance', name: 'finance', label: 'Finance', sortOrder: 5 },
    { id: 'menu-commissions', name: 'commissions', label: 'Commissions', sortOrder: 6 },
    { id: 'menu-users', name: 'users', label: 'Users', sortOrder: 7 },
    { id: 'menu-roles', name: 'roles', label: 'Roles', sortOrder: 8 },
    { id: 'menu-activities', name: 'activities', label: 'Activities', sortOrder: 9 },
    { id: 'menu-settings', name: 'settings', label: 'Settings', sortOrder: 10 },
  ]

  await prisma.menu.createMany({ data: menus })
  console.log('✅ Created', menus.length, 'menus')

  // Insert system roles
  const roles = [
    { id: 'role-owner', name: 'Owner', description: 'Full system access', isSystem: true },
    { id: 'role-admin', name: 'Admin', description: 'Administrative access', isSystem: true },
    { id: 'role-photographer', name: 'Photographer', description: 'Photographer role', isSystem: true },
    { id: 'role-packaging', name: 'Packaging Staff', description: 'Packaging and shipping', isSystem: true },
  ]

  for (const role of roles) {
    await prisma.customRole.upsert({
      where: { id: role.id },
      update: {},
      create: role,
    })
  }
  console.log('✅ Created/Updated', roles.length, 'system roles')

  // Owner gets all permissions
  const allMenus = await prisma.menu.findMany()
  const ownerPerms = allMenus.map((menu) => ({
    id: `perm-owner-${menu.name}`,
    roleId: 'role-owner',
    menuId: menu.id,
    canView: true,
    canEdit: true,
    canDelete: true,
  }))

  await prisma.rolePermission.createMany({
    data: ownerPerms,
    skipDuplicates: true,
  })
  console.log('✅ Created Owner permissions')

  // Admin permissions (all except commissions)
  const adminMenus = allMenus.filter((m) => m.name !== 'commissions')
  const adminPerms = adminMenus.map((menu) => ({
    id: `perm-admin-${menu.name}`,
    roleId: 'role-admin',
    menuId: menu.id,
    canView: true,
    canEdit: !['users', 'settings'].includes(menu.name),
    canDelete: !['users', 'settings', 'finance'].includes(menu.name),
  }))

  await prisma.rolePermission.createMany({
    data: adminPerms,
    skipDuplicates: true,
  })
  console.log('✅ Created Admin permissions')

  // Photographer permissions
  const photographerMenuNames = ['dashboard', 'bookings', 'clients', 'calendar', 'reminders']
  const photographerMenus = allMenus.filter((m) => photographerMenuNames.includes(m.name))
  const photographerPerms = photographerMenus.map((menu) => ({
    id: `perm-photographer-${menu.name}`,
    roleId: 'role-photographer',
    menuId: menu.id,
    canView: true,
    canEdit: ['bookings', 'calendar'].includes(menu.name),
    canDelete: false,
  }))

  await prisma.rolePermission.createMany({
    data: photographerPerms,
    skipDuplicates: true,
  })
  console.log('✅ Created Photographer permissions')

  // Packaging permissions
  const packagingMenuNames = ['dashboard', 'bookings', 'clients']
  const packagingMenus = allMenus.filter((m) => packagingMenuNames.includes(m.name))
  const packagingPerms = packagingMenus.map((menu) => ({
    id: `perm-packaging-${menu.name}`,
    roleId: 'role-packaging',
    menuId: menu.id,
    canView: true,
    canEdit: menu.name === 'bookings',
    canDelete: false,
  }))

  await prisma.rolePermission.createMany({
    data: packagingPerms,
    skipDuplicates: true,
  })
  console.log('✅ Created Packaging permissions')

  // Migrate existing users
  await prisma.user.updateMany({
    where: { role: 'OWNER', customRoleId: null },
    data: { customRoleId: 'role-owner' },
  })
  await prisma.user.updateMany({
    where: { role: 'ADMIN', customRoleId: null },
    data: { customRoleId: 'role-admin' },
  })
  await prisma.user.updateMany({
    where: { role: 'PHOTOGRAPHER', customRoleId: null },
    data: { customRoleId: 'role-photographer' },
  })
  await prisma.user.updateMany({
    where: { role: 'PACKAGING_STAFF', customRoleId: null },
    data: { customRoleId: 'role-packaging' },
  })
  console.log('✅ Migrated existing users to custom roles')

  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
