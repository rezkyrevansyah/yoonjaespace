import type { BookingStatus, PaymentStatus, UserRole, ExpenseCategory } from "./types"

// ============================================================
// Status Maps — used by StatusBadge and throughout the app
// ============================================================

export const BOOKING_STATUS_MAP: Record<
  BookingStatus,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  BOOKED: {
    label: "Booked",
    color: "#6B7280",
    bgColor: "#F3F4F6",
    borderColor: "#D1D5DB",
  },
  PAID: {
    label: "Paid",
    color: "#2563EB",
    bgColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  SHOOT_DONE: {
    label: "Shoot Done",
    color: "#D97706",
    bgColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  PHOTOS_DELIVERED: {
    label: "Photos Delivered",
    color: "#059669",
    bgColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  CLOSED: {
    label: "Closed",
    color: "#374151",
    bgColor: "#F3F4F6",
    borderColor: "#D1D5DB",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#DC2626",
    bgColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
}

export const PAYMENT_STATUS_MAP: Record<
  PaymentStatus,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  PAID: {
    label: "Lunas",
    color: "#059669",
    bgColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  PARTIALLY_PAID: {
    label: "Sebagian Lunas",
    color: "#D97706",
    bgColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  UNPAID: {
    label: "Belum Lunas",
    color: "#DC2626",
    bgColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
}

export const USER_ROLE_MAP: Record<UserRole, { label: string; color: string; bgColor: string }> = {
  OWNER: { label: "Owner", color: "#7A1F1F", bgColor: "#F5ECEC" },
  ADMIN: { label: "Admin", color: "#2563EB", bgColor: "#EFF6FF" },
  PHOTOGRAPHER: { label: "Photographer", color: "#D97706", bgColor: "#FFFBEB" },
  PACKAGING_STAFF: { label: "Packaging", color: "#059669", bgColor: "#ECFDF5" },
}

export const EXPENSE_CATEGORY_MAP: Record<ExpenseCategory, { label: string; icon: string }> = {
  EQUIPMENT: { label: "Equipment", icon: "Camera" },
  STUDIO_RENT: { label: "Sewa Studio", icon: "Building" },
  PROPS: { label: "Properti", icon: "Palette" },
  UTILITIES: { label: "Utilitas", icon: "Zap" },
  MARKETING: { label: "Marketing", icon: "Megaphone" },
  SALARY: { label: "Gaji", icon: "Users" },
  PRINT_VENDOR: { label: "Vendor Cetak", icon: "Printer" },
  PACKAGING: { label: "Packaging", icon: "Package" },
  SHIPPING: { label: "Pengiriman", icon: "Truck" },
  OPERATIONAL: { label: "Operasional", icon: "Settings" },
  OTHER: { label: "Lainnya", icon: "MoreHorizontal" },
}

// ============================================================
// Sidebar Navigation
// ============================================================

export const SIDEBAR_MENU = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
    roles: ["OWNER", "ADMIN"] as const,
  },

  {
    label: "Bookings",
    href: "/dashboard/bookings",
    icon: "CalendarCheck",
    roles: ["OWNER", "ADMIN", "PACKAGING_STAFF"] as const,
  },
  {
    label: "Calendar",
    href: "/dashboard/calendar",
    icon: "Calendar",
    roles: ["OWNER", "ADMIN"] as const,
  },
  {
    label: "Clients",
    href: "/dashboard/clients",
    icon: "Users",
    roles: ["OWNER", "ADMIN"] as const,
  },
  {
    label: "Reminders",
    href: "/dashboard/reminders",
    icon: "Bell",
    roles: ["OWNER", "ADMIN"] as const,
  },
  {
    label: "Finance",
    href: "/dashboard/finance",
    icon: "Wallet",
    roles: ["OWNER"] as const,
  },
  {
    label: "Vendors",
    href: "/dashboard/vendors",
    icon: "Briefcase",
    roles: ["OWNER"] as const,
  },
  {
    label: "Commissions",
    href: "/dashboard/commissions",
    icon: "Award",
    roles: ["OWNER"] as const,
  },
  {
    label: "Activities",
    href: "/dashboard/activities",
    icon: "Activity",
    roles: ["OWNER", "ADMIN"] as const,
  },
  {
    label: "User Management",
    href: "/dashboard/users",
    icon: "ShieldCheck",
    roles: ["OWNER"] as const,
  },
  {
    label: "Role Management",
    href: "/dashboard/roles",
    icon: "Shield",
    roles: ["OWNER"] as const,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: "Settings",
    roles: ["OWNER"] as const,
  },
]

export const MOBILE_NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Bookings", href: "/dashboard/bookings", icon: "CalendarCheck" },
  { label: "Calendar", href: "/dashboard/calendar", icon: "Calendar" },
  { label: "Finance", href: "/dashboard/finance", icon: "Wallet" },
  { label: "More", href: "#more", icon: "Menu" },
] as const

export const MOBILE_MORE_ITEMS = [
  { label: "Clients", href: "/dashboard/clients", icon: "Users" },
  { label: "Reminders", href: "/dashboard/reminders", icon: "Bell" },
  { label: "Commissions", href: "/dashboard/commissions", icon: "Award" },
  { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
  { label: "User Management", href: "/dashboard/users", icon: "ShieldCheck" },
  { label: "Logout", href: "#logout", icon: "LogOut" },
] as const

// ============================================================
// Booking Status Flow
// ============================================================

export const BOOKING_STATUS_FLOW: BookingStatus[] = [
  "BOOKED",
  "PAID",
  "SHOOT_DONE",
  "PHOTOS_DELIVERED",
  "CLOSED",
]
