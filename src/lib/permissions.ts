import { UserRole } from './types'

// Permission map per role
export const ROLE_PERMISSIONS = {
  OWNER: ['*'], // All access
  ADMIN: [
    'dashboard.view',
    'bookings.create',
    'bookings.read',
    'bookings.update',
    'bookings.delete',
    'calendar.view',
    'clients.read',
    'clients.create',
    'clients.update',
    'invoices.create',
    'invoices.read',
    'reminders.send',
    'activities.view',
  ],
  PHOTOGRAPHER: [
    'schedule.view',
    'bookings.read', // Read-only
  ],
  PACKAGING_STAFF: [
    'bookings.read',
    'bookings.update', // Only shipping status
  ],
} as const

// Menu visibility per role
export const MENU_ACCESS = {
  OWNER: [
    'dashboard',
    'bookings',
    'calendar',
    'clients',
    'finance',
    'commissions',
    'reminders',
    'activities',
    'settings',
    'users',
  ],
  ADMIN: [
    'dashboard',
    'bookings',
    'calendar',
    'clients',
    'reminders',
    'activities',
  ],
  PHOTOGRAPHER: [
    'schedule', // Today's schedule only
  ],
  PACKAGING_STAFF: [
    'bookings', // Filtered to shipping tasks only
  ],
} as const

// Check if user has permission
export function hasPermission(
  userRole: UserRole,
  permission: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole]
  return permissions.includes('*') || permissions.includes(permission)
}

// Check if user can access menu
export function canAccessMenu(userRole: UserRole, menu: string): boolean {
  const menus = MENU_ACCESS[userRole]
  return menus.includes(menu)
}
