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

export type PaymentStatus = "PAID" | "PARTIALLY_PAID" | "UNPAID"

export type UserRole = "OWNER" | "ADMIN" | "PHOTOGRAPHER" | "PACKAGING_STAFF"

export type ExpenseCategory =
  | "EQUIPMENT"
  | "STUDIO_RENT"
  | "PROPS"
  | "UTILITIES"
  | "MARKETING"
  | "SALARY"
  | "PRINT_VENDOR"
  | "PACKAGING"
  | "SHIPPING"
  | "OPERATIONAL"
  | "OTHER"

// --- Core Models ---

export interface StaffUser {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  customRoleId?: string
  customRole?: {
    id: string
    name: string
    isSystem: boolean
  }
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
  domisili: string | null  // SESI 10
  notes: string | null
  leads: string | null      // SESI 10
  totalBookings: number
  createdAt: string
}

export type PackageCategory = "MAIN" | "BIRTHDAY_SMASH" | "PROFESSIONAL" | "STUDIO_ONLY" | "ADDON" | "OTHER"

export interface Package {
  id: string
  name: string
  description: string
  duration: number // minutes
  price: number
  editedPhotos: number
  allPhotos: boolean
  isActive: boolean
  extraTimeBefore: number // Extra time before session in minutes (for MUA, prep, etc)
  category: PackageCategory // SESI 11
  variants?: PackageVariant[] // SESI 15
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
  defaultPrice: number
  description?: string
  isActive: boolean
  extraTimeBefore: number // Extra time before session in minutes
}

export type AddOnTemplate = AddOn

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
  id: string
  bookingId: string
  itemName: string
  quantity: number
  unitPrice: number
  subtotal: number
  paymentStatus: PaymentStatus
}

export interface Payment {
  id: string
  bookingId: string
  amount: number
  paidAt: string
  description?: string
  paymentType: string
  notes?: string
  createdAt: string
}

export interface Booking {
  id: string
  bookingCode: string
  publicSlug: string
  clientId: string
  client: Client
  date: string
  startTime: string
  endTime: string
  muaStartTime: string | null // MUA start time (1 hour before session if MUA add-on exists)
  backgroundId: string
  background: Background | null
  bookingBackgrounds?: any[]
  packageId: string
  package: Package
  numberOfPeople: number
  photoFor: string
  bts: boolean
  status: BookingStatus
  paymentStatus: PaymentStatus
  packagePrice: number
  discountAmount: number
  discountNote: string | null
  totalAmount: number
  paidAmount: number
  outstandingBalance?: number
  notes: string | null
  internalNotes: string | null
  driveLink: string | null // or photoLink?
  photoLink: string | null
  handledById: string | null
  handledBy: StaffUser | null
  addOns: BookingAddOn[]
  payments?: Payment[]
  printOrder: PrintOrder | null
  customFields: { id: string, fieldId: string, value: string, field?: CustomField }[]
  remindedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Vendor {
  id: string
  name: string
  category: string
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  isActive: boolean
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
  notes?: string | null
  isPaid: boolean
  vendorId?: string | null
  vendor?: Vendor | null
}

export interface PackageVariant {
  id: string
  packageId: string
  name: string
  description?: string | null
  priceAddon: number
  isActive: boolean
  createdAt: string
  updatedAt: string
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
  expenseByCategory: Record<string, number>
}

export type PrintOrderStatus = 
  | "WAITING_CLIENT_SELECTION"
  | "SENT_TO_VENDOR"
  | "PRINTING_IN_PROGRESS"
  | "PRINT_RECEIVED"
  | "PACKAGING"
  | "SHIPPED"
  | "COMPLETED"

export interface PrintOrder {
  id: string
  bookingId: string
  status: PrintOrderStatus
  selectedPhotos?: string
  vendorName?: string
  vendorNotes?: string
  courier?: string
  trackingNumber?: string
  shippingAddress?: string
  createdAt: string
  updatedAt: string
}

export interface ActivityLog {
  id: string
  userId: string
  userName: string
  userRole: UserRole
  action: string
  details: string | null
  timestamp: string // ISO string
  type: "CREATE" | "UPDATE" | "DELETE" | "SYSTEM"
}

export interface CustomField {
  id: string
  fieldName: string
  fieldType: "TEXT" | "SELECT" | "CHECKBOX" | "NUMBER" | "URL"
  options?: string
  isRequired: boolean
  sortOrder: number
  isActive: boolean
}
