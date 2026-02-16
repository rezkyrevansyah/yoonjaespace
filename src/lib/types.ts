// ============================================================
// Frontend-specific types for Yoonjaespace Studio Management
// NOTE: These are separate from src/types/ (backend types)
// ============================================================

// --- Enums ---

export type BookingStatus =
  | "BOOKED"
  | "PAID"
  | "SHOOT_DONE"
  | "PHOTOS_DELIVERED"
  | "CLOSED"
  | "CANCELLED"

export type PaymentStatus = "PAID" | "UNPAID"

export type UserRole = "OWNER" | "ADMIN" | "PHOTOGRAPHER" | "PACKAGING_STAFF"

export type ExpenseCategory =
  | "EQUIPMENT"
  | "STUDIO_RENT"
  | "PROPS"
  | "UTILITIES"
  | "MARKETING"
  | "SALARY"
  | "OTHER"

// --- Core Models ---

export interface StaffUser {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  isActive: boolean
  createdAt: string
}

export interface Client {
  id: string
  name: string
  phone: string
  email: string | null
  instagram: string | null
  address: string | null
  notes: string | null
  totalBookings: number
  createdAt: string
}

export interface Package {
  id: string
  name: string
  description: string
  duration: number // minutes
  price: number
  editedPhotos: number
  allPhotos: boolean
  isActive: boolean
}

export interface Background {
  id: string
  name: string
  description: string
  isAvailable: boolean
}

export interface AddOn {
  id: string
  name: string
  price: number
  description: string
  isActive: boolean
}

export interface Voucher {
  id: string
  code: string
  discountType: "PERCENTAGE" | "FIXED"
  discountValue: number
  minPurchase: number
  maxUses: number
  usedCount: number
  validFrom: string
  validUntil: string
  isActive: boolean
}

export interface BookingAddOn {
  addOn: AddOn
  quantity: number
  price: number
}

export interface Booking {
  id: string
  bookingCode: string
  client: Client
  package: Package
  background: Background
  photographer: StaffUser | null
  addOns: BookingAddOn[]
  voucher: Voucher | null
  sessionDate: string
  sessionTime: string
  status: BookingStatus
  paymentStatus: PaymentStatus
  subtotal: number
  discount: number
  totalPrice: number
  paidAmount: number
  notes: string | null
  slug: string
  createdAt: string
  updatedAt: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: ExpenseCategory
  date: string
  createdBy: StaffUser
  receipt: string | null
}

export interface Commission {
  staffId: string
  staffName: string
  role: UserRole
  totalBookings: number
  totalRevenue: number
  commissionRate: number
  commissionAmount: number
  period: string
}

// --- UI Types ---

export interface MenuItem {
  label: string
  href: string
  icon: string
  badge?: number
  children?: MenuItem[]
}

export interface StatCardData {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: string
}

export interface ChartDataPoint {
  name: string
  income: number
  expense: number
}

export interface MonthlyRevenueData {
  month: string
  revenue: number
}

export interface Reminder {
  id: string
  bookingId: string
  bookingCode: string
  clientName: string
  type: "FOLLOW_UP" | "PAYMENT" | "DELIVERY" | "SHOOT"
  message: string
  dueDate: string
  isDone: boolean
}

export interface FinanceSummary {
  totalIncome: number
  totalExpense: number
  netProfit: number
  pendingPayments: number
  incomeByMonth: ChartDataPoint[]
}

export type PrintOrderStatus = 
  | "WAITING_SELECTION"
  | "SENT_TO_VENDOR"
  | "PRINTING"
  | "RECEIVED"
  | "PACKAGING"
  | "SHIPPED"
  | "COMPLETED"

export interface PrintOrder {
  id: string
  bookingId: string
  status: PrintOrderStatus
  selectedPhotosLink?: string
  vendorName?: string
  vendorNotes?: string
  courier?: string
  trackingNumber?: string
  shippingAddress?: string
  createdAt: string
  updatedAt: string
}
