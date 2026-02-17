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
  defaultPrice: number
  description?: string
  isActive: boolean
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
  backgroundId: string
  background: Background | null
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
  notes: string | null
  internalNotes: string | null
  driveLink: string | null // or photoLink?
  photoLink: string | null
  handledById: string | null
  handledBy: StaffUser | null
  addOns: BookingAddOn[]
  printOrder: PrintOrder | null
  customFields: { id: string, fieldId: string, value: string, field?: CustomField }[]
  remindedAt: string | null
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
  details: string
  timestamp: string // ISO string
  type: "CREATE" | "UPDATE" | "DELETE" | "SYSTEM"
}

export interface CustomField {
  id: string
  fieldName: string
  fieldType: "TEXT" | "SELECT" | "CHECKBOX" | "NUMBER"
  options?: string
  isRequired: boolean
  sortOrder: number
  isActive: boolean
}
