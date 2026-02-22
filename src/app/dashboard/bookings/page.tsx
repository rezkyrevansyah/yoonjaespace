"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { StatusBadge } from "@/components/shared/status-badge"
import { CustomSelect } from "@/components/shared/custom-select"
import { DateRangePicker } from "@/components/shared/date-range-picker"
import { Modal } from "@/components/shared/modal"
import { Pagination } from "@/components/shared/pagination"
import { useAuth } from "@/lib/hooks/use-auth"
import { useBookings } from "@/lib/hooks/use-bookings" // Import hook
import { apiPatch, apiDelete } from "@/lib/api-client" // Import API helpers
import { formatCurrency, formatDate } from "@/lib/utils"
import { useMobile } from "@/lib/hooks/use-mobile"
import { useToast } from "@/lib/hooks/use-toast" // Import toast
import {
  Plus,
  Search,
  Filter,
  X,
  CalendarCheck,
  Calendar,
  Package as PackageIcon,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  Loader2,
  AlertCircle
} from "lucide-react"
import type { Booking, BookingStatus, PaymentStatus } from "@/lib/types"

const STATUS_OPTIONS = [
  { label: "Semua Status", value: "ALL" },
  { label: "Booked", value: "BOOKED" },
  { label: "Paid", value: "PAID" },
  { label: "Shoot Done", value: "SHOOT_DONE" },
  { label: "Delivered", value: "PHOTOS_DELIVERED" },
  { label: "Closed", value: "CLOSED" },
  { label: "Cancelled", value: "CANCELLED" },
]

const PAYMENT_OPTIONS = [
  { label: "Semua Pembayaran", value: "ALL" },
  { label: "Lunas", value: "PAID" },
  { label: "Belum Lunas", value: "UNPAID" },
]

const UPDATE_STATUS_OPTIONS: { label: string; value: BookingStatus }[] = [
  { label: "Booked", value: "BOOKED" },
  { label: "Paid", value: "PAID" },
  { label: "Shoot Done", value: "SHOOT_DONE" },
  { label: "Photos Delivered", value: "PHOTOS_DELIVERED" },
  { label: "Closed", value: "CLOSED" },
  { label: "Cancelled", value: "CANCELLED" },
]

const ITEMS_PER_PAGE = 10

export default function BookingsPage() {
  const router = useRouter()
  const isMobile = useMobile()
  const { showToast } = useToast()
  const { user, isLoading: isAuthLoading } = useAuth()
  
  // Filter States
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch Data using SWR hook
  const { bookings, pagination, isLoading, isError, mutate } = useBookings({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: search || undefined,
    status: statusFilter !== "ALL" ? (statusFilter as BookingStatus) : undefined,
    paymentStatus: paymentFilter !== "ALL" ? (paymentFilter as PaymentStatus) : undefined,
    // Add date filtering logic if supported by API/Hook, for now assuming hook inputs
  })

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; code: string }>({
    isOpen: false,
    id: "",
    code: "",
  })

  // Loading state for row updates (format: `${id}-${type}`)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // --- Actions ---

  const handleDeleteClick = (id: string, code: string) => {
    setDeleteModal({ isOpen: true, id, code })
  }

  const confirmDelete = async () => {
    try {
        const res = await apiDelete(`/api/bookings/${deleteModal.id}`)
        if (res.error) throw new Error(res.error)
        
        showToast(`Booking ${deleteModal.code} has been deleted.`, "success")
        mutate() // Refresh data
    } catch (error: any) {
        showToast(error.message || "Failed to delete booking", "error")
    } finally {
        setDeleteModal({ isOpen: false, id: "", code: "" })
    }
  }

  const handleStatusUpdate = async (id: string, newStatus: BookingStatus) => {
    setUpdatingId(id)
    try {
        const res = await apiPatch(`/api/bookings/${id}/status`, { status: newStatus })
        if (res.error) throw new Error(res.error)
        mutate() // Refresh
        showToast("Status updated", "success")
    } catch (error: any) {
        showToast(error.message || "Failed to update status", "error")
    } finally {
        setUpdatingId(null)
    }
  }

  const handlePaymentUpdate = async (id: string, newStatus: PaymentStatus) => {
      setUpdatingId(id)
      try {
        const res = await apiPatch(`/api/bookings/${id}/status`, { paymentStatus: newStatus })
        if (res.error) throw new Error(res.error)
        mutate()
        showToast("Payment status updated", "success")
    } catch (error: any) {
        showToast(error.message || "Failed to update payment", "error")
    } finally {
        setUpdatingId(null)
    }
  }

  // --- Permissions ---

  const canEditPayment = useMemo(() => {
    if (!user) return false
    return ["OWNER", "ADMIN"].includes(user.role)
  }, [user])

  const canUpdateToStatus = (currentStatus: BookingStatus, targetStatus: BookingStatus) => {
    if (!user) return false
    const role = user.role
    if (role === "OWNER" || role === "ADMIN") return true
    
    // Limits for staff
    if (role === "PHOTOGRAPHER") {
      return ["SHOOT_DONE", "PHOTOS_DELIVERED"].includes(targetStatus)
    }
    if (role === "PACKAGING_STAFF") {
        return ["PHOTOS_DELIVERED"].includes(targetStatus)
    }
    return false
  }

  const getAvailableStatusOptions = (currentStatus: BookingStatus) => {
    return UPDATE_STATUS_OPTIONS.filter(opt => 
      canUpdateToStatus(currentStatus, opt.value) || opt.value === currentStatus
    )
  }


  const handleClearFilters = () => {
    setSearch("")
    setStatusFilter("ALL")
    setPaymentFilter("ALL")
    setStartDate("")
    setEndDate("")
    setCurrentPage(1)
  }

  const hasActiveFilters = search !== "" || statusFilter !== "ALL" || paymentFilter !== "ALL" || startDate !== "" || endDate !== ""

  // Memoized total pages from pagination data or fallback
  const totalPages = pagination?.totalPages || 1

  if (isError) {
      return (
          <div className="flex h-[50vh] flex-col items-center justify-center text-red-500">
              <AlertCircle className="h-10 w-10 mb-2" />
              <p>Failed to load bookings</p>
          </div>
      )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Bookings</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {pagination?.total || 0} total booking
          </p>
        </div>
        <Link
          href="/dashboard/bookings/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7A1F1F] text-white text-sm font-semibold hover:bg-[#9B3333] active:bg-[#5C1717] transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Booking</span>
          <span className="sm:hidden">Baru</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-4">
        {/* Mobile Search & Filter Toggle */}
        <div className="flex gap-2 sm:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Cari..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2.5 rounded-xl border transition-colors ${
              showFilters || hasActiveFilters 
                ? "bg-[#7A1F1F] text-white border-[#7A1F1F]" 
                : "bg-white text-[#6B7280] border-[#E5E7EB]"
            }`}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {/* Desktop Filter Row / Mobile Filter Sheet */}
        <div className={`${isMobile && !showFilters ? "hidden" : "flex"} flex-col sm:flex-row gap-3 sm:items-center`}>
          {/* Desktop Search */}
          <div className="relative hidden sm:block min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Cari nama, WA, atau Booking ID..."
              className="w-full pl-10 pr-10 py-2 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] transition-colors h-10"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <CustomSelect 
            value={statusFilter} 
            onChange={(val) => {
              setStatusFilter(val)
              setCurrentPage(1)
            }}
            options={STATUS_OPTIONS}
            placeholder="Status"
          />

          <CustomSelect 
            value={paymentFilter} 
            onChange={(val) => {
              setPaymentFilter(val)
              setCurrentPage(1)
            }}
            options={PAYMENT_OPTIONS}
            placeholder="Pembayaran"
          />

          <DateRangePicker 
            startDate={startDate} 
            endDate={endDate} 
            onStartDateChange={setStartDate} 
            onEndDateChange={setEndDate}
          />

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-[#7A1F1F] hover:text-[#9B3333] font-medium transition-colors px-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {!bookings ? (
          <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
      ) : (
          <>
            {/* Results count */}
            <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                <p>
                Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, pagination?.total || 0)} dari {pagination?.total || 0} booking
                </p>
            </div>

            {/* Desktop Table */}
            {!isMobile ? (
                <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                        <th className="text-left py-3 px-4 font-medium text-[#6B7280] whitespace-nowrap">Booking ID</th>
                        <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Client</th>
                        <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Time</th>
                        <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Package</th>
                        <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Payment</th>
                        <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Handled By</th>
                        <th className="text-left py-3 px-4 font-medium text-[#6B7280] whitespace-nowrap">Dibuat Pada</th>
                        <th className="text-right py-3 px-4 font-medium text-[#6B7280]">Total</th>
                        <th className="py-3 px-4 font-medium text-[#6B7280]">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking: Booking) => (
                        <tr
                            key={booking.id}
                            className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors"
                        >
                            <td className="py-3 px-4">
                            <Link href={`/dashboard/bookings/${booking.id}`} className="font-mono text-sm font-medium text-[#7A1F1F] hover:underline">
                                {booking.bookingCode}
                            </Link>
                            </td>
                            <td className="py-3 px-4">
                            <div>
                                <div className="font-medium text-[#111827]">{booking.client.name}</div>
                                <div className="text-xs text-[#9CA3AF] mt-0.5">{booking.client.phone}</div>
                            </div>
                            </td>
                            <td className="py-3 px-4 text-[#6B7280] whitespace-nowrap">
                            {formatDate(booking.date)}
                            </td>
                            <td className="py-3 px-4 text-[#6B7280] whitespace-nowrap">
                            {formatDate(booking.startTime, 'HH:mm')}
                            </td>
                            <td className="py-3 px-4 text-[#6B7280]">{booking.package.name}</td>
                            
                            {/* Inline Status Edit */}
                            <td className="py-3 px-4">
                              {updatingId === booking.id ? (
                                <div className="flex items-center gap-2 text-gray-500 text-xs">
                                    <Loader2 className="h-4 w-4 animate-spin text-[#7A1F1F]" />
                                    <span>Updating...</span>
                                </div>
                              ) : (
                                <div className="relative group flex items-center gap-1 cursor-pointer">
                                    <select
                                    value={booking.status}
                                    onChange={(e) => handleStatusUpdate(booking.id, e.target.value as BookingStatus)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    disabled={updatingId !== null}
                                    >
                                    {getAvailableStatusOptions(booking.status).map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                    </select>
                                    <div className="flex items-center gap-1.5 transition-transform active:scale-95">
                                        <StatusBadge status={booking.status} size="sm" />
                                        <ChevronDown className="h-3 w-3 text-gray-400" />
                                    </div>
                                </div>
                              )}
                            </td>

                            {/* Inline Payment Edit */}
                            <td className="py-3 px-4">
                             {updatingId === booking.id ? (
                                <div className="flex items-center gap-2 text-gray-500 text-xs">
                                    <Loader2 className="h-4 w-4 animate-spin text-[#7A1F1F]" />
                                    <span>Updating...</span>
                                </div>
                             ) : (
                                <>
                                {canEditPayment ? (
                                    <div className="relative group flex items-center gap-1 cursor-pointer">
                                    <select
                                        value={booking.paymentStatus}
                                        onChange={(e) => handlePaymentUpdate(booking.id, e.target.value as PaymentStatus)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        disabled={updatingId !== null}
                                        >
                                        <option value="PAID">Paid</option>
                                        <option value="UNPAID">Unpaid</option>
                                        </select>
                                        <div className="flex items-center gap-1.5 transition-transform active:scale-95">
                                            <StatusBadge status={booking.paymentStatus} type="payment" size="sm" />
                                            <ChevronDown className="h-3 w-3 text-gray-400" />
                                        </div>
                                    </div>
                                ) : (
                                    <StatusBadge status={booking.paymentStatus} type="payment" size="sm" />
                                )}
                                </>
                             )}
                            </td>

                            <td className="py-3 px-4 text-[#6B7280] text-sm">
                            {booking.handledBy ? booking.handledBy.name : "-" }
                            </td>
                            <td className="py-3 px-4 text-[#6B7280] text-sm whitespace-nowrap">
                            {formatDate(booking.createdAt, 'dd/MM/yyyy HH:mm')}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-[#111827]">
                            {formatCurrency(booking.totalAmount)}
                            </td>
                            
                            {/* Actions */}
                            <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1">
                                <Link 
                                    href={`/dashboard/bookings/${booking.id}`}
                                    className="p-1.5 text-gray-500 hover:text-[#7A1F1F] hover:bg-red-50 rounded-lg transition-colors"
                                    title="View Details"
                                >
                                    <Eye className="h-4 w-4" />
                                </Link>
                                    {canEditPayment && (
                                    <button 
                                        onClick={() => handleDeleteClick(booking.id, booking.bookingCode)}
                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                </div>
            ) : (
                /* Mobile Cards */
                <div className="space-y-3">
                {bookings.map((booking: Booking) => (
                    <div
                    key={booking.id}
                    className="block p-4 rounded-xl border border-[#E5E7EB] bg-white hover:shadow-sm transition-all"
                    >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <Link href={`/dashboard/bookings/${booking.id}`}>
                        <p className="text-sm font-mono font-semibold text-[#7A1F1F]">
                            {booking.bookingCode}
                        </p>
                        <StatusBadge status={booking.status} size="sm" className="mt-1.5" />
                        </Link>
                        {/* Mobile Actions */}
                        <div className="flex items-center gap-1">
                            {canEditPayment && (
                                <button 
                                onClick={() => handleDeleteClick(booking.id, booking.bookingCode)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Body */}
                    <Link href={`/dashboard/bookings/${booking.id}`} className="space-y-2 block">
                        <div>
                        <p className="font-semibold text-base text-[#111827]">{booking.client.name}</p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">{booking.client.phone}</p>
                        </div>

                        <div className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(booking.date)} • {formatDate(booking.startTime, 'HH:mm')}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                        <PackageIcon className="h-3.5 w-3.5" />
                        <span>{booking.package.name}</span>
                        </div>
                    </Link>

                    {/* Footer */}
                    <div className="mt-3 pt-3 border-t border-[#E5E7EB] space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <StatusBadge status={booking.paymentStatus} type="payment" size="sm" />
                                <span className="text-xs text-[#9CA3AF]">
                                    {booking.handledBy ? booking.handledBy.name : "Belum ditugaskan" }
                                </span>
                            </div>
                            <p className="font-semibold text-base text-[#7A1F1F]">
                            {formatCurrency(booking.totalAmount)}
                            </p>
                        </div>
                        <div className="text-xs text-[#9CA3AF]">
                            Dibuat: {formatDate(booking.createdAt, 'dd/MM/yyyy HH:mm')}
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}

            {/* Empty State */}
            {bookings.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                {hasActiveFilters ? (
                    <>
                    <Search className="h-16 w-16 text-[#D1D5DB] mb-4" />
                    <p className="text-[#6B7280] font-medium">Tidak ditemukan</p>
                    <p className="text-sm text-[#9CA3AF] mt-1">
                        Tidak ada booking yang sesuai dengan pencarian Anda
                    </p>
                    <button
                        onClick={handleClearFilters}
                        className="mt-4 px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
                    >
                        Clear Filter
                    </button>
                    </>
                ) : (
                    <>
                    <CalendarCheck className="h-16 w-16 text-[#D1D5DB] mb-4" />
                    <p className="text-[#6B7280] font-medium">Belum ada booking</p>
                    <p className="text-sm text-[#9CA3AF] mt-1">
                        Buat booking pertama Anda sekarang!
                    </p>
                    <Link
                        href="/dashboard/bookings/new"
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7A1F1F] text-white text-sm font-semibold hover:bg-[#9B3333] transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Buat Booking Pertama
                    </Link>
                    </>
                )}
                </div>
            )}

            {/* Pagination */}
            <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
          </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
         isOpen={deleteModal.isOpen}
         onClose={() => setDeleteModal({ isOpen: false, id: "", code: "" })}
         title="Delete Booking"
         description={`Are you sure you want to delete booking ${deleteModal.code}? This action cannot be undone.`}
         confirmLabel="Delete"
         onConfirm={confirmDelete}
         variant="danger"
      />
    </div>
  )
}
