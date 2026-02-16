"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { StatusBadge } from "@/components/shared/status-badge"
import { CustomSelect } from "@/components/shared/custom-select"
import { DateRangePicker } from "@/components/shared/date-range-picker"
import { Modal } from "@/components/shared/modal"
import { Pagination } from "@/components/shared/pagination"
import { mockBookings, mockCurrentUser } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useMobile } from "@/lib/hooks/use-mobile"
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
  ChevronDown
} from "lucide-react"
import type { BookingStatus, PaymentStatus } from "@/lib/types"

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

type SortField = "date" | "total" | "status"
type SortOrder = "asc" | "desc"

const ITEMS_PER_PAGE = 10

export default function BookingsPage() {
  const router = useRouter()
  const isMobile = useMobile()
  const [bookings, setBookings] = useState(mockBookings)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; code: string }>({
    isOpen: false,
    id: "",
    code: "",
  })

  // --- Actions ---

  const handleDeleteClick = (id: string, code: string) => {
    setDeleteModal({ isOpen: true, id, code })
  }

  const confirmDelete = () => {
    setBookings((prev) => prev.filter((b) => b.id !== deleteModal.id))
    setDeleteModal({ isOpen: false, id: "", code: "" })
  }

  const handleStatusUpdate = (id: string, newStatus: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b))
  }

  const handlePaymentUpdate = (id: string, newStatus: PaymentStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, paymentStatus: newStatus } : b))
  }

  // --- Permissions ---

  const canEditPayment = useMemo(() => {
    return ["OWNER", "ADMIN"].includes(mockCurrentUser.role)
  }, [])

  const canUpdateToStatus = (currentStatus: BookingStatus, targetStatus: BookingStatus) => {
    const role = mockCurrentUser.role
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

  // --- Filter & Sort ---

  const filteredAndSortedBookings = useMemo(() => {
    const filtered = bookings.filter((b) => {
      // Search
      const matchesSearch =
        b.bookingCode.toLowerCase().includes(search.toLowerCase()) ||
        b.client.name.toLowerCase().includes(search.toLowerCase()) ||
        b.client.phone.includes(search) ||
        b.package.name.toLowerCase().includes(search.toLowerCase())
      
      // Status
      const matchesStatus = statusFilter === "ALL" || b.status === statusFilter

      // Payment
      const matchesPayment = paymentFilter === "ALL" || b.paymentStatus === paymentFilter

      // Date Range
      let matchesDate = true
      if (startDate && endDate) {
        const bookingDate = new Date(b.sessionDate)
        const start = new Date(startDate)
        const end = new Date(endDate)
        matchesDate = bookingDate >= start && bookingDate <= end
      } else if (startDate) {
        const bookingDate = new Date(b.sessionDate)
        const start = new Date(startDate)
        matchesDate = bookingDate >= start
      } else if (endDate) {
        const bookingDate = new Date(b.sessionDate)
        const end = new Date(endDate)
        matchesDate = bookingDate <= end
      }

      return matchesSearch && matchesStatus && matchesPayment && matchesDate
    })

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0

      if (sortField === "date") {
        comparison = new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
      } else if (sortField === "total") {
        comparison = a.totalPrice - b.totalPrice
      } else if (sortField === "status") {
        comparison = a.status.localeCompare(b.status)
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [bookings, search, statusFilter, paymentFilter, startDate, endDate, sortField, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedBookings.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedBookings = filteredAndSortedBookings.slice(startIndex, endIndex)

  const handleClearFilters = () => {
    setSearch("")
    setStatusFilter("ALL")
    setPaymentFilter("ALL")
    setStartDate("")
    setEndDate("")
    setCurrentPage(1)
  }

  const hasActiveFilters = search !== "" || statusFilter !== "ALL" || paymentFilter !== "ALL" || startDate !== "" || endDate !== ""

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Bookings</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {bookings.length} total booking
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

      {/* Results count & Sort */}
      <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
        <p>
          Menampilkan {filteredAndSortedBookings.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredAndSortedBookings.length)} dari {filteredAndSortedBookings.length} booking
        </p>
        {!isMobile && (
          <div className="flex items-center gap-3">
            <span>Sort by:</span>
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-") as [SortField, SortOrder]
                setSortField(field)
                setSortOrder(order)
              }}
              className="px-2 py-1 rounded-lg border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
            >
              <option value="date-desc">Tanggal (Terbaru)</option>
              <option value="date-asc">Tanggal (Terlama)</option>
              <option value="total-desc">Total (Tertinggi)</option>
              <option value="total-asc">Total (Terendah)</option>
              <option value="status-asc">Status (A-Z)</option>
              <option value="status-desc">Status (Z-A)</option>
            </select>
          </div>
        )}
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
                  <th className="text-right py-3 px-4 font-medium text-[#6B7280]">Total</th>
                  <th className="py-3 px-4 font-medium text-[#6B7280]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map((booking) => (
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
                      {formatDate(booking.sessionDate)}
                    </td>
                    <td className="py-3 px-4 text-[#6B7280] whitespace-nowrap">
                      {booking.sessionTime}
                    </td>
                    <td className="py-3 px-4 text-[#6B7280]">{booking.package.name}</td>
                    
                    {/* Inline Status Edit */}
                    <td className="py-3 px-4">
                      <div className="relative group flex items-center gap-1 cursor-pointer">
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusUpdate(booking.id, e.target.value as BookingStatus)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
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
                    </td>

                    {/* Inline Payment Edit */}
                    <td className="py-3 px-4">
                       {canEditPayment ? (
                        <div className="relative group flex items-center gap-1 cursor-pointer">
                           <select
                              value={booking.paymentStatus}
                              onChange={(e) => handlePaymentUpdate(booking.id, e.target.value as PaymentStatus)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
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
                    </td>

                    <td className="py-3 px-4 text-[#6B7280] text-sm">
                      {booking.photographer ? booking.photographer.name : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[#111827]">
                      {formatCurrency(booking.totalPrice)}
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
                          {/* Mock Edit Link */}
                          <button 
                             className="p-1.5 text-gray-500 hover:text-[#7A1F1F] hover:bg-red-50 rounded-lg transition-colors"
                             title="Edit (Mock)"
                          >
                             <Edit className="h-4 w-4" />
                          </button>
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
          {paginatedBookings.map((booking) => (
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
                  <span>{formatDate(booking.sessionDate)} • {booking.sessionTime}</span>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                  <PackageIcon className="h-3.5 w-3.5" />
                  <span>{booking.package.name}</span>
                </div>
              </Link>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <StatusBadge status={booking.paymentStatus} type="payment" size="sm" />
                   <span className="text-xs text-[#9CA3AF]">
                    {booking.photographer ? booking.photographer.name : "Belum ditugaskan"}
                  </span>
                </div>
                <p className="font-semibold text-base text-[#7A1F1F]">
                  {formatCurrency(booking.totalPrice)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredAndSortedBookings.length === 0 && (
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
