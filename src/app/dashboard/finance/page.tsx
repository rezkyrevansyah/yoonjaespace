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
  Loader2
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
// import { useMobile } from "@/lib/hooks/use-mobile"
import { useToast } from "@/lib/hooks/use-toast"
import { Modal } from "@/components/shared/modal"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { useExpenses, useFinanceSummary } from "@/lib/hooks/use-finance"
import { usePackageStats } from "@/lib/hooks/use-package-stats"
import { useBookings } from "@/lib/hooks/use-bookings"
import { apiPost, apiPatch, apiDelete } from "@/lib/api-client"
import { FinanceSummary, Expense, ExpenseCategory } from "@/lib/types"

// Category styling
const CATEGORY_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  EQUIPMENT: { label: "Equipment", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  STUDIO_RENT: { label: "Sewa Studio", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  PROPS: { label: "Properti", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  UTILITIES: { label: "Utilitas", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  MARKETING: { label: "Marketing", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  SALARY: { label: "Gaji", bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  PRINT_VENDOR: { label: "Vendor Cetak", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  PACKAGING: { label: "Packaging", bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  SHIPPING: { label: "Pengiriman", bg: "bg-lime-50", text: "text-lime-700", border: "border-lime-200" },
  OPERATIONAL: { label: "Operasional", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  OTHER: { label: "Lainnya", bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" }
}

// Pie chart colors
const CHART_COLORS: Record<string, string> = {
  EQUIPMENT: "#3B82F6", // blue
  STUDIO_RENT: "#A855F7", // purple
  PROPS: "#10B981", // green
  UTILITIES: "#F59E0B", // amber
  MARKETING: "#6366F1", // indigo
  SALARY: "#EC4899", // pink
  PRINT_VENDOR: "#F97316", // orange
  PACKAGING: "#06B6D4", // cyan
  SHIPPING: "#84CC16", // lime
  OPERATIONAL: "#F43F5E", // rose
  OTHER: "#6B7280" // gray
}

export default function FinancePage() {
  const { showToast } = useToast()
  
  // Mobile check
  const [isMobile, setIsMobile] = useState(false)
  useMemo(() => {
    if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', () => setIsMobile(window.innerWidth < 768))
    }
  }, [])


  // Current month (for filtering)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM

  // Hooks
  const { expenses, isLoading: expensesLoading, mutate: mutateExpenses } = useExpenses({ month: selectedMonth })
  const { summary, isLoading: summaryLoading, mutate: mutateSummary } = useFinanceSummary(selectedMonth)
  const { bookings: paidBookings, isLoading: bookingsLoading } = useBookings({ month: selectedMonth, paymentStatus: 'PAID', status: 'SHOOT_DONE' })
  // Should technically include completed statuses too, but let's stick to PAID payment status primarily
  // Re-checking useBookings logic: status filter is AND. So if I want ALL paid, I should probably just filter by paymentStatus='PAID' and maybe ignore CANCELLED (which useBookings API usually handles or I check params)
  // Let's use paymentStatus='PAID'. API implementation should handle excluding cancelled if paymentStatus is paid (usually paid implies not cancelled, or we need to filter)
  // Actually, useBookings params are flexible. Let's just use paymentStatus='PAID'.
  const { stats: packageStatsData, isLoading: isLoadingStats } = usePackageStats(selectedMonth)

  // Expense filters (client-side filtering for category/search if needed, but API supports it too. Here we fetched by month, so we can filter local or refetch)
  const [categoryFilter, setCategoryFilter] = useState<string | "ALL">("ALL")
  
  // Expenses Filtered locally for the view if needed, but easier to just show all for the month
  const filteredExpenses = useMemo(() => {
    if (categoryFilter === "ALL") return expenses
    return expenses.filter(e => e.category === categoryFilter)
  }, [expenses, categoryFilter])
  
  // Modals
  const [addExpenseModal, setAddExpenseModal] = useState(false)
  const [editExpenseModal, setEditExpenseModal] = useState(false)
  const [deleteExpenseModal, setDeleteExpenseModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Expense form
  const [expenseForm, setExpenseForm] = useState<Partial<Expense>>({
    date: new Date().toISOString().split("T")[0],
    description: "",
    category: "OTHER",
    amount: 0,
    notes: ""
    // relatedBookingId: null, // Not mapped in UI yet, but API supports it
  })

  // Get month name
  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-")
    const date = new Date(parseInt(year), parseInt(month) - 1)
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    return `${months[date.getMonth()]} ${year}`
  }

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
  const handleAddExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount || expenseForm.amount <= 0) {
      showToast("Mohon lengkapi data expense", "warning")
      return
    }

    setIsSubmitting(true)
    try {
        const res = await apiPost("/api/finance/expenses", expenseForm)
        if (res.error) throw new Error(res.error)
        
        showToast(`Expense berhasil ditambahkan`, "success")
        setAddExpenseModal(false)
        mutateExpenses()
        mutateSummary()
        setExpenseForm({
            date: new Date().toISOString().split("T")[0],
            description: "",
            category: "OTHER",
            amount: 0
        })
    } catch (error: any) {
        showToast(error.message || "Gagal menambah expense", "error")
    } finally {
        setIsSubmitting(false)
    }
  }

  // Handle edit expense
  const handleEditExpense = async () => {
    if (!selectedExpense || !expenseForm.description || !expenseForm.amount || expenseForm.amount <= 0) {
      showToast("Mohon lengkapi data expense", "warning")
      return
    }
    
    setIsSubmitting(true)
    try {
        const res = await apiPatch(`/api/finance/expenses/${selectedExpense.id}`, expenseForm)
        if (res.error) throw new Error(res.error)
        
        showToast("Expense berhasil diupdate", "success")
        setEditExpenseModal(false)
        setSelectedExpense(null)
        mutateExpenses()
        mutateSummary()
    } catch (error: any) {
         showToast(error.message || "Gagal update expense", "error")
    } finally {
        setIsSubmitting(false)
    }
  }

  // Handle delete expense
  const handleDeleteExpense = async () => {
    if (!selectedExpense) return
    
    setIsSubmitting(true)
    try {
        const res = await apiDelete(`/api/finance/expenses/${selectedExpense.id}`)
        if (res.error) throw new Error(res.error)

        showToast("Expense berhasil dihapus", "success")
        setDeleteExpenseModal(false)
        setSelectedExpense(null)
        mutateExpenses()
        mutateSummary()
    } catch (error: any) {
        showToast(error.message || "Gagal hapus expense", "error")
    } finally {
        setIsSubmitting(false)
    }
  }

  // Open edit modal
  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense)
    setExpenseForm({
      date: expense.date.split('T')[0],
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      notes: expense.notes || ""
      // relatedBookingId: expense.relatedBookingId,
    })
    setEditExpenseModal(true)
  }

  // Open delete modal
  const openDeleteModal = (expense: Expense) => {
    setSelectedExpense(expense)
    setDeleteExpenseModal(true)
  }

  // Chart Data Preparation
  const expenseByCategory = useMemo(() => {
    if (!summary?.expenseByCategory) return []
    return Object.entries(summary.expenseByCategory)
        .map(([key, value]) => ({
            name: CATEGORY_STYLES[key]?.label || key,
            category: key,
            value: Number(value)
        }))
        .filter(item => item.value > 0)
  }, [summary])

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
              {summaryLoading ? (
                  <div className="h-9 w-24 bg-gray-100 animate-pulse rounded mt-2" />
              ) : (
                  <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(summary?.totalIncome || 0)}</p>
              )}
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
                 {summaryLoading ? (
                  <div className="h-9 w-24 bg-gray-100 animate-pulse rounded mt-2" />
              ) : (
                 <p className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(summary?.totalExpense || 0)}</p>
              )}
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
                 {summaryLoading ? (
                  <div className="h-9 w-24 bg-gray-100 animate-pulse rounded mt-2" />
              ) : (
                 <p className="text-3xl font-bold text-blue-600 mt-2">{formatCurrency(summary?.netProfit || 0)}</p>
              )}
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
              {bookingsLoading ? "..." : paidBookings.length} bookings
            </span>
          </div>
        </div>
        
        {bookingsLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-300" /></div>
        ) : (
        <>
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
                    <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Total</th>
                    <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Payment</th>
                    </tr>
                </thead>
                <tbody>
                    {paidBookings.map((booking) => (
                        <tr key={booking.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3 px-4">
                            <Link href={`/dashboard/bookings/${booking.id}`} className="font-mono text-xs text-[#7A1F1F] hover:underline">
                            {booking.bookingCode}
                            </Link>
                        </td>
                        <td className="py-3 px-4 text-[#111827]">{booking.client.name}</td>
                        <td className="py-3 px-4 text-[#6B7280]">{formatDate(booking.date)}</td>
                        <td className="py-3 px-4 text-[#6B7280]">{booking.package.name}</td>
                        <td className="py-3 px-4">
                            <span className="font-bold text-green-600">{formatCurrency(booking.totalAmount)}</span>
                        </td>
                        <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            PAID
                            </span>
                        </td>
                        </tr>
                    ))}
                </tbody>
                </table>
            </div>
            ) : (
            /* Mobile Cards */
            <div className="p-4 space-y-3">
                {paidBookings.map((booking) => (
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
                    <p className="text-xs text-[#6B7280] mb-2">{formatDate(booking.date)} • {booking.package.name}</p>
                    <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                    <span className="text-xs text-[#6B7280]">Total</span>
                    <span className="font-bold text-green-600">{formatCurrency(booking.totalAmount)}</span>
                    </div>
                </div>
                ))}
            </div>
            )}

            {paidBookings.length === 0 && (
            <div className="text-center py-12">
                <p className="text-[#6B7280]">Tidak ada income di bulan ini</p>
            </div>
            )}
        </>
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
                  amount: 0
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
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
            >
              <option value="ALL">All Categories</option>
              {Object.entries(CATEGORY_STYLES).map(([key, style]) => (
                <option key={key} value={key}>{style.label}</option>
              ))}
            </select>
            
            {/* Additional Date filter inputs could go here if needed, but we already filter by month using the top selector */}
          </div>
        </div>

        {expensesLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-300"/></div>
        ) : (
            <>
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
                    <th className="text-center py-3 px-4 font-medium text-[#6B7280]">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredExpenses.map((expense: Expense) => {
                    const categoryStyle = CATEGORY_STYLES[expense.category] || CATEGORY_STYLES.OTHER
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
                {filteredExpenses.length > 0 && (
                <div className="p-4 bg-[#F9FAFB] border-t border-[#E5E7EB]">
                    <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-[#111827]">Total Expenses ({filteredExpenses.length}):</span>
                    <span className="text-lg font-bold text-red-600">
                        {formatCurrency(filteredExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0))}
                    </span>
                    </div>
                </div>
                )}
            </div>
            ) : (
            /* Mobile Cards */
            <div className="p-4 space-y-3">
                {filteredExpenses.map((expense: Expense) => {
                const categoryStyle = CATEGORY_STYLES[expense.category] || CATEGORY_STYLES.OTHER
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
                {filteredExpenses.length > 0 && (
                <div className="p-4 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                    <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-[#111827]">Total:</span>
                    <span className="text-base font-bold text-red-600">{formatCurrency(filteredExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0))}</span>
                    </div>
                </div>
                )}
            </div>
            )}

            {filteredExpenses.length === 0 && (
            <div className="text-center py-12">
                <p className="text-[#6B7280]">Tidak ada expense di bulan ini</p>
            </div>
            )}
            </>
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
                    label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[entry.category] || "#999"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value) || 0)} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: any, entry: any) => `${value} (${formatCurrency(entry.payload?.value || 0)})`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            /* Mobile: Category Cards with Bars */
            <div className="space-y-3">
              {expenseByCategory.map((item) => {
                const totalExpenses = summary?.totalExpense || 1
                const percentage = (item.value / totalExpenses) * 100
                const categoryStyle = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.OTHER
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
                          backgroundColor: CHART_COLORS[item.category] || "#999"
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

      {/* Section E: Top 5 Most Popular Packages */}
      {packageStatsData.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#111827] mb-6">Top 5 Most Popular Packages</h2>

          {!isMobile ? (
            /* Desktop Bar Chart */
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={packageStatsData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="packageName"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{ value: 'Bookings', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: any, name: string | undefined) => {
                      if (name === 'Bookings') return [value, 'Bookings']
                      return [formatCurrency(Number(value) || 0), 'Revenue']
                    }}
                    labelStyle={{ color: '#111827', fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="bookingCount" fill="#7A1F1F" name="Bookings" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="totalRevenue" fill="#D4AF37" name="Revenue (Rp)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            /* Mobile: Progress Bar List with Rankings */
            <div className="space-y-4">
              {packageStatsData.map((pkg, index) => {
                const maxBookings = packageStatsData[0]?.bookingCount || 1
                const percentage = (pkg.bookingCount / maxBookings) * 100

                return (
                  <div key={pkg.packageId} className="p-4 rounded-lg border border-[#E5E7EB] bg-gray-50">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#7A1F1F] text-white flex items-center justify-center font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-[#111827] truncate">{pkg.packageName}</h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-[#6B7280]">{pkg.bookingCount} bookings</span>
                          <span className="text-xs font-medium text-[#111827]">{formatCurrency(pkg.totalRevenue)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full bg-[#7A1F1F]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
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
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              >
                {Object.entries(CATEGORY_STYLES).map(([key, style]) => (
                  <option key={key} value={key}>{style.label}</option>
                ))}
              </select>
            </div>

            {/* Notes Field */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Notes (Optional)</label>
              <textarea
                value={expenseForm.notes || ""}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                rows={3}
                placeholder="Catatan tambahan untuk expense ini..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F] resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
               <button
                  onClick={() => setAddExpenseModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              <button
                onClick={handleAddExpense}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors disabled:opacity-70"
              >
                {isSubmitting ? "Saving..." : "Save Expense"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Expense Modal */}
        <Modal
          isOpen={editExpenseModal}
          onClose={() => setEditExpenseModal(false)}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Amount (Rp) *</label>
              <input
                type="number"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

             <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Category *</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as ExpenseCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              >
                {Object.entries(CATEGORY_STYLES).map(([key, style]) => (
                  <option key={key} value={key}>{style.label}</option>
                ))}
              </select>
            </div>

            {/* Notes Field */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Notes (Optional)</label>
              <textarea
                value={expenseForm.notes || ""}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                rows={3}
                placeholder="Catatan tambahan untuk expense ini..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F] resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
               <button
                  onClick={() => setEditExpenseModal(false)}
                  disabled={isSubmitting}
                   className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              <button
                onClick={handleEditExpense}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors disabled:opacity-70"
              >
                {isSubmitting ? "Updating..." : "Update Expense"}
              </button>
            </div>
          </div>
        </Modal>

        {/* Delete Modal */}
        {selectedExpense && (
            <Modal
            isOpen={deleteExpenseModal}
            onClose={() => setDeleteExpenseModal(false)}
            title="Hapus Expense?"
            description={`Apakah anda yakin ingin menghapus expense "${selectedExpense.description}"? Data yang dihapus tidak dapat dikembalikan.`}
            confirmLabel={isSubmitting ? "Deleting..." : "Delete"}
            variant="danger"
            onConfirm={handleDeleteExpense}
            />
        )}
    </div>
  )
}
