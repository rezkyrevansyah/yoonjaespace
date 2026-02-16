"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Plus,
  Edit2,
  Trash2,
  X,
  Calendar as CalendarIcon
} from "lucide-react"
import { mockBookings } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useMobile } from "@/lib/hooks/use-mobile"
import { useToast } from "@/lib/hooks/use-toast"
import { Modal } from "@/components/shared/modal"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

// Finance-specific expense categories
type FinanceExpenseCategory = "PRINT_VENDOR" | "PACKAGING" | "SHIPPING" | "OPERATIONAL" | "SALARIES" | "OTHER"

interface FinanceExpense {
  id: string
  date: string
  description: string
  category: FinanceExpenseCategory
  amount: number
  relatedBookingId: string | null
  relatedBookingCode?: string
  notes: string | null
}

// Mock expenses data for February 2026
const mockFinanceExpenses: FinanceExpense[] = [
  { id: "fexp-001", date: "2026-02-03", description: "Cetak foto 4R untuk YS-250201-001", category: "PRINT_VENDOR", amount: 125000, relatedBookingId: "bk-001", relatedBookingCode: "YS-250201-001", notes: null },
  { id: "fexp-002", date: "2026-02-05", description: "Box packaging premium set 10pcs", category: "PACKAGING", amount: 85000, relatedBookingId: null, notes: null },
  { id: "fexp-003", date: "2026-02-07", description: "Shipping JNE untuk 3 paket client", category: "SHIPPING", amount: 45000, relatedBookingId: null, notes: "YS-001, YS-002, YS-003" },
  { id: "fexp-004", date: "2026-02-08", description: "Listrik studio bulan Februari", category: "OPERATIONAL", amount: 350000, relatedBookingId: null, notes: null },
  { id: "fexp-005", date: "2026-02-10", description: "Gaji part-time Feb (Siti)", category: "SALARIES", amount: 800000, relatedBookingId: null, notes: null },
  { id: "fexp-006", date: "2026-02-11", description: "Cetak foto premium 8R", category: "PRINT_VENDOR", amount: 180000, relatedBookingId: "bk-002", relatedBookingCode: "YS-250203-002", notes: null },
  { id: "fexp-007", date: "2026-02-12", description: "Bubble wrap dan kardus", category: "PACKAGING", amount: 55000, relatedBookingId: null, notes: null },
  { id: "fexp-008", date: "2026-02-13", description: "Internet studio bulan Feb", category: "OPERATIONAL", amount: 400000, relatedBookingId: null, notes: "First Media 100Mbps" },
  { id: "fexp-009", date: "2026-02-14", description: "Shipping SiCepat reguler", category: "SHIPPING", amount: 28000, relatedBookingId: "bk-007", relatedBookingCode: "YS-250214-007", notes: null },
  { id: "fexp-010", date: "2026-02-15", description: "Gaji fotografer Feb (Andi)", category: "SALARIES", amount: 500000, relatedBookingId: null, notes: null },
  { id: "fexp-011", date: "2026-02-15", description: "Kertas foto glossy 100 lembar", category: "PRINT_VENDOR", amount: 95000, relatedBookingId: null, notes: null },
  { id: "fexp-012", date: "2026-02-16", description: "Beli stiker logo Yoonjaespace", category: "OTHER", amount: 37000, relatedBookingId: null, notes: "500pcs stiker" },
]

// Category styling
const CATEGORY_STYLES: Record<FinanceExpenseCategory, { label: string; bg: string; text: string; border: string }> = {
  PRINT_VENDOR: { label: "Print Vendor", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  PACKAGING: { label: "Packaging", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  SHIPPING: { label: "Shipping", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  OPERATIONAL: { label: "Operational", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  SALARIES: { label: "Salaries", bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  OTHER: { label: "Other", bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" }
}

// Pie chart colors
const CHART_COLORS: Record<FinanceExpenseCategory, string> = {
  PRINT_VENDOR: "#3B82F6", // blue
  PACKAGING: "#A855F7", // purple
  SHIPPING: "#10B981", // green
  OPERATIONAL: "#F59E0B", // amber
  SALARIES: "#EC4899", // pink
  OTHER: "#6B7280" // gray
}

export default function FinancePage() {
  const isMobile = useMobile()
  const { showToast } = useToast()

  // Current month (for filtering)
  const [selectedMonth, setSelectedMonth] = useState("2026-02")

  // Expenses state (for CRUD)
  const [expenses, setExpenses] = useState<FinanceExpense[]>(mockFinanceExpenses)

  // Expense filters
  const [categoryFilter, setCategoryFilter] = useState<FinanceExpenseCategory | "ALL">("ALL")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")

  // Modals
  const [addExpenseModal, setAddExpenseModal] = useState(false)
  const [editExpenseModal, setEditExpenseModal] = useState(false)
  const [deleteExpenseModal, setDeleteExpenseModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<FinanceExpense | null>(null)

  // Expense form
  const [expenseForm, setExpenseForm] = useState<Partial<FinanceExpense>>({
    date: new Date().toISOString().split("T")[0],
    description: "",
    category: "OTHER",
    amount: 0,
    relatedBookingId: null,
    notes: null
  })

  // Get month name
  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-")
    const date = new Date(parseInt(year), parseInt(month) - 1)
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    return `${months[date.getMonth()]} ${year}`
  }

  // Filter bookings by selected month (paid only)
  const paidBookingsThisMonth = useMemo(() => {
    const [year, month] = selectedMonth.split("-")
    return mockBookings.filter(b => {
      if (b.status === "CANCELLED" || b.paymentStatus !== "PAID") return false
      const sessionDate = new Date(b.sessionDate)
      return sessionDate.getFullYear() === parseInt(year) && sessionDate.getMonth() + 1 === parseInt(month)
    }).sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
  }, [selectedMonth])

  // Filter expenses by selected month
  const expensesThisMonth = useMemo(() => {
    const [year, month] = selectedMonth.split("-")
    let filtered = expenses.filter(e => {
      const expenseDate = new Date(e.date)
      return expenseDate.getFullYear() === parseInt(year) && expenseDate.getMonth() + 1 === parseInt(month)
    })

    // Apply category filter
    if (categoryFilter !== "ALL") {
      filtered = filtered.filter(e => e.category === categoryFilter)
    }

    // Apply date range filter
    if (dateFromFilter) {
      filtered = filtered.filter(e => e.date >= dateFromFilter)
    }
    if (dateToFilter) {
      filtered = filtered.filter(e => e.date <= dateToFilter)
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [selectedMonth, expenses, categoryFilter, dateFromFilter, dateToFilter])

  // Calculate summary
  const totalIncome = paidBookingsThisMonth.reduce((sum, b) => sum + b.paidAmount, 0)
  const totalExpenses = expensesThisMonth.reduce((sum, e) => sum + e.amount, 0)
  const grossProfit = totalIncome - totalExpenses

  // Expense breakdown by category
  const expenseByCategory = useMemo(() => {
    const breakdown: Record<FinanceExpenseCategory, number> = {
      PRINT_VENDOR: 0,
      PACKAGING: 0,
      SHIPPING: 0,
      OPERATIONAL: 0,
      SALARIES: 0,
      OTHER: 0
    }

    expensesThisMonth.forEach(e => {
      breakdown[e.category] += e.amount
    })

    return Object.entries(breakdown)
      .filter(([_, value]) => value > 0)
      .map(([category, value]) => ({
        name: CATEGORY_STYLES[category as FinanceExpenseCategory].label,
        value,
        category: category as FinanceExpenseCategory
      }))
  }, [expensesThisMonth])

  // Month options (last 12 months)
  const monthOptions = useMemo(() => {
    const options = []
    for (let i = 0; i < 12; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      options.push(`${year}-${month}`)
    }
    return options
  }, [])

  // Handle add expense
  const handleAddExpense = () => {
    if (!expenseForm.description || !expenseForm.amount || expenseForm.amount <= 0) {
      showToast("Mohon lengkapi data expense", "warning")
      return
    }

    const newExpense: FinanceExpense = {
      id: `fexp-${Date.now()}`,
      date: expenseForm.date || new Date().toISOString().split("T")[0],
      description: expenseForm.description,
      category: expenseForm.category as FinanceExpenseCategory,
      amount: expenseForm.amount,
      relatedBookingId: expenseForm.relatedBookingId || null,
      notes: expenseForm.notes || null
    }

    setExpenses([newExpense, ...expenses])
    setAddExpenseModal(false)
    setExpenseForm({
      date: new Date().toISOString().split("T")[0],
      description: "",
      category: "OTHER",
      amount: 0,
      relatedBookingId: null,
      notes: null
    })
    showToast(`Expense "${newExpense.description}" berhasil ditambahkan`, "success")
  }

  // Handle edit expense
  const handleEditExpense = () => {
    if (!selectedExpense || !expenseForm.description || !expenseForm.amount || expenseForm.amount <= 0) {
      showToast("Mohon lengkapi data expense", "warning")
      return
    }

    const updatedExpense: FinanceExpense = {
      ...selectedExpense,
      date: expenseForm.date || selectedExpense.date,
      description: expenseForm.description,
      category: expenseForm.category as FinanceExpenseCategory,
      amount: expenseForm.amount,
      relatedBookingId: expenseForm.relatedBookingId || null,
      notes: expenseForm.notes || null
    }

    setExpenses(expenses.map(e => e.id === selectedExpense.id ? updatedExpense : e))
    setEditExpenseModal(false)
    setSelectedExpense(null)
    setExpenseForm({
      date: new Date().toISOString().split("T")[0],
      description: "",
      category: "OTHER",
      amount: 0,
      relatedBookingId: null,
      notes: null
    })
    showToast("Expense berhasil diupdate", "success")
  }

  // Handle delete expense
  const handleDeleteExpense = () => {
    if (!selectedExpense) return
    setExpenses(expenses.filter(e => e.id !== selectedExpense.id))
    setDeleteExpenseModal(false)
    setSelectedExpense(null)
    showToast("Expense berhasil dihapus", "success")
  }

  // Open edit modal
  const openEditModal = (expense: FinanceExpense) => {
    setSelectedExpense(expense)
    setExpenseForm({
      date: expense.date,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      relatedBookingId: expense.relatedBookingId,
      notes: expense.notes
    })
    setEditExpenseModal(true)
  }

  // Open delete modal
  const openDeleteModal = (expense: FinanceExpense) => {
    setSelectedExpense(expense)
    setDeleteExpenseModal(true)
  }

  // Clear filters
  const clearFilters = () => {
    setCategoryFilter("ALL")
    setDateFromFilter("")
    setDateToFilter("")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F5ECEC] flex items-center justify-center">
            <Wallet className="h-5 w-5 text-[#7A1F1F]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#111827]">Finance</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Summary keuangan {getMonthName(selectedMonth)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Picker */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
          >
            {monthOptions.map(month => (
              <option key={month} value={month}>{getMonthName(month)}</option>
            ))}
          </select>

          {/* Export Button */}
          <button
            onClick={() => showToast("Export feature coming soon", "info")}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            {!isMobile && "Export Excel"}
          </button>
        </div>
      </div>

      {/* Section A: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Income Card */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#6B7280]">Income</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(totalIncome)}</p>
              <p className="text-xs text-green-600 mt-2">+8% dari bulan lalu</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#6B7280]">Expenses</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-[#6B7280] mt-2">{expensesThisMonth.length} transaksi</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Gross Profit Card */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#6B7280]">Gross Profit</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{formatCurrency(grossProfit)}</p>
              <p className="text-xs text-blue-600 mt-2">+12% dari bulan lalu</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Section B: Income from Bookings */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[#111827]">Income from Bookings</h2>
            <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
              {paidBookingsThisMonth.length} bookings
            </span>
          </div>
        </div>

        {/* Desktop Table */}
        {!isMobile ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Booking ID</th>
                  <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Client</th>
                  <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Package</th>
                  <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Add-ons</th>
                  <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Discount</th>
                  <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Payment</th>
                </tr>
              </thead>
              <tbody>
                {paidBookingsThisMonth.map((booking) => {
                  const addOnsTotal = booking.addOns.reduce((sum, a) => sum + a.price, 0)
                  return (
                    <tr key={booking.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3 px-4">
                        <Link href={`/dashboard/bookings/${booking.id}`} className="font-mono text-xs text-[#7A1F1F] hover:underline">
                          {booking.bookingCode}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-[#111827]">{booking.client.name}</td>
                      <td className="py-3 px-4 text-[#6B7280]">{formatDate(booking.sessionDate)}</td>
                      <td className="py-3 px-4 text-[#6B7280]">{booking.package.name}</td>
                      <td className="py-3 px-4 text-[#6B7280]">
                        {addOnsTotal > 0 ? formatCurrency(addOnsTotal) : "-"}
                      </td>
                      <td className="py-3 px-4">
                        {booking.discount > 0 ? (
                          <span className="text-red-600">{formatCurrency(booking.discount)}</span>
                        ) : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-green-600">{formatCurrency(booking.paidAmount)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          PAID
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Mobile Cards */
          <div className="p-4 space-y-3">
            {paidBookingsThisMonth.map((booking) => (
              <div key={booking.id} className="p-4 rounded-lg border border-[#E5E7EB] bg-white">
                <div className="flex items-start justify-between mb-3">
                  <Link href={`/dashboard/bookings/${booking.id}`} className="font-mono text-xs text-[#7A1F1F] hover:underline">
                    {booking.bookingCode}
                  </Link>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    PAID
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#111827] mb-1">{booking.client.name}</p>
                <p className="text-xs text-[#6B7280] mb-2">{formatDate(booking.sessionDate)} • {booking.package.name}</p>
                <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">Total</span>
                  <span className="font-bold text-green-600">{formatCurrency(booking.paidAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {paidBookingsThisMonth.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#6B7280]">Tidak ada income di bulan ini</p>
          </div>
        )}
      </div>

      {/* Section C: Expenses */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#111827]">Expenses</h2>
            <button
              onClick={() => {
                setExpenseForm({
                  date: new Date().toISOString().split("T")[0],
                  description: "",
                  category: "OTHER",
                  amount: 0,
                  relatedBookingId: null,
                  notes: null
                })
                setAddExpenseModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 border border-[#7A1F1F] text-[#7A1F1F] rounded-lg text-sm font-medium hover:bg-[#F5ECEC] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as FinanceExpenseCategory | "ALL")}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
            >
              <option value="ALL">All Categories</option>
              {Object.entries(CATEGORY_STYLES).map(([key, style]) => (
                <option key={key} value={key}>{style.label}</option>
              ))}
            </select>

            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              placeholder="From"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
            />

            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              placeholder="To"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
            />

            {(categoryFilter !== "ALL" || dateFromFilter || dateToFilter) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-[#6B7280] hover:text-[#111827] underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Desktop Table */}
        {!isMobile ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Related Booking</th>
                  <th className="text-center py-3 px-4 font-medium text-[#6B7280]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expensesThisMonth.map((expense) => {
                  const categoryStyle = CATEGORY_STYLES[expense.category]
                  return (
                    <tr key={expense.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3 px-4 text-[#6B7280]">{formatDate(expense.date)}</td>
                      <td className="py-3 px-4 text-[#111827]">{expense.description}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
                          {categoryStyle.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-red-600">{formatCurrency(expense.amount)}</span>
                      </td>
                      <td className="py-3 px-4">
                        {expense.relatedBookingCode ? (
                          <Link href={`/dashboard/bookings/${expense.relatedBookingId}`} className="font-mono text-xs text-[#7A1F1F] hover:underline">
                            {expense.relatedBookingCode}
                          </Link>
                        ) : (
                          <span className="text-[#6B7280]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(expense)}
                            className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(expense)}
                            className="p-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Total Row */}
            {expensesThisMonth.length > 0 && (
              <div className="p-4 bg-[#F9FAFB] border-t border-[#E5E7EB]">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-[#111827]">Total Expenses:</span>
                  <span className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Mobile Cards */
          <div className="p-4 space-y-3">
            {expensesThisMonth.map((expense) => {
              const categoryStyle = CATEGORY_STYLES[expense.category]
              return (
                <div key={expense.id} className="p-4 rounded-lg border border-[#E5E7EB] bg-white">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#111827] mb-1">{expense.description}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
                        {categoryStyle.label}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">Date</span>
                      <span className="text-[#111827]">{formatDate(expense.date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">Amount</span>
                      <span className="font-bold text-red-600">{formatCurrency(expense.amount)}</span>
                    </div>
                    {expense.relatedBookingCode && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Related</span>
                        <Link href={`/dashboard/bookings/${expense.relatedBookingId}`} className="font-mono text-xs text-[#7A1F1F] hover:underline">
                          {expense.relatedBookingCode}
                        </Link>
                      </div>
                    )}
                  </div>
                  <div className="pt-3 border-t border-[#E5E7EB] mt-3 flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(expense)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors text-xs font-medium"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(expense)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors text-xs font-medium"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Total Row Mobile */}
            {expensesThisMonth.length > 0 && (
              <div className="p-4 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-[#111827]">Total Expenses:</span>
                  <span className="text-base font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {expensesThisMonth.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#6B7280]">Tidak ada expense di bulan ini</p>
          </div>
        )}
      </div>

      {/* Section D: Expense Breakdown Chart */}
      {expenseByCategory.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#111827] mb-6">Expense Breakdown by Category</h2>

          {!isMobile ? (
            /* Desktop Pie Chart */
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[entry.category]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry: any) => `${value} (${formatCurrency(entry.payload.value)})`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            /* Mobile: Category Cards with Bars */
            <div className="space-y-3">
              {expenseByCategory.map((item) => {
                const percentage = (item.value / totalExpenses) * 100
                const categoryStyle = CATEGORY_STYLES[item.category]
                return (
                  <div key={item.category} className="p-4 rounded-lg border border-[#E5E7EB]">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
                        {item.name}
                      </span>
                      <span className="text-sm font-bold text-[#111827]">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: CHART_COLORS[item.category]
                        }}
                      />
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1">{percentage.toFixed(1)}% of total</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Expense Modal */}
      {addExpenseModal && (
        <Modal
          isOpen={addExpenseModal}
          onClose={() => setAddExpenseModal(false)}
          title="Add New Expense"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Date *</label>
              <input
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Description *</label>
              <input
                type="text"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="Contoh: Cetak foto client YJS-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Amount (Rp) *</label>
              <input
                type="number"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Category *</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as FinanceExpenseCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              >
                {Object.entries(CATEGORY_STYLES).map(([key, style]) => (
                  <option key={key} value={key}>{style.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Notes (Optional)</label>
              <textarea
                value={expenseForm.notes || ""}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handleAddExpense}
                className="flex-1 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setAddExpenseModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Expense Modal */}
      {editExpenseModal && (
        <Modal
          isOpen={editExpenseModal}
          onClose={() => {
            setEditExpenseModal(false)
            setSelectedExpense(null)
          }}
          title="Edit Expense"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Date *</label>
              <input
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Description *</label>
              <input
                type="text"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="Contoh: Cetak foto client YJS-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Amount (Rp) *</label>
              <input
                type="number"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Category *</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as FinanceExpenseCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              >
                {Object.entries(CATEGORY_STYLES).map(([key, style]) => (
                  <option key={key} value={key}>{style.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Notes (Optional)</label>
              <textarea
                value={expenseForm.notes || ""}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handleEditExpense}
                className="flex-1 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditExpenseModal(false)
                  setSelectedExpense(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Expense Modal */}
      {deleteExpenseModal && selectedExpense && (
        <Modal
          isOpen={deleteExpenseModal}
          onClose={() => {
            setDeleteExpenseModal(false)
            setSelectedExpense(null)
          }}
          title="Hapus Expense"
          description={`Apakah Anda yakin ingin menghapus expense "${selectedExpense.description}"?`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDeleteExpense}
        />
      )}
    </div>
  )
}
