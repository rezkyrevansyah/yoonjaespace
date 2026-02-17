"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Award, CalendarCheck, ChevronDown, ChevronUp, Users } from "lucide-react"
import { useCommissions } from "@/lib/hooks/use-commissions"
import { formatCurrency, getInitials } from "@/lib/utils"
import { USER_ROLE_MAP } from "@/lib/constants"
import { useMobile } from "@/lib/hooks/use-mobile"
import { useToast } from "@/lib/hooks/use-toast"
import { Loader2, AlertCircle } from "lucide-react"
import type { UserRole } from "@/lib/types"

interface CommissionData {
  staffId: string
  staffName: string
  role: UserRole
  bookingsHandled: number
  revenueGenerated: number
  commissionAmount: number
  notes: string
  isPaid: boolean
}


export default function CommissionsPage() {
  const isMobile = useMobile()
  const { showToast } = useToast()

  const now = new Date()
  // Period state
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  // Fetch from API
  const { data: staffStats, isLoading, isError, saveCommission } = useCommissions(selectedMonth, selectedYear)

  // Expanded detail view
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null)

  // Form states for each staff
  const [editingStaff, setEditingStaff] = useState<Record<string, {
    commissionAmount: number
    notes: string
    isPaid: boolean
  }>>({})

  // Get month name
  const getMonthName = (month: number) => {
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    return months[month - 1]
  }

  // Get month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: getMonthName(i + 1)
  }))

  // Get year options (2024-2026)
  const yearOptions = [2024, 2025, 2026]

  // No staffList needed, using hook data

  // No staffStats useMemo needed, handled by hook

  // Initialize editing state for a staff
  const initEditingState = (staffId: string, data: { commissionAmount: number; notes: string; isPaid: boolean }) => {
    if (editingStaff[staffId]) return
    setEditingStaff(prev => ({
      ...prev,
      [staffId]: data
    }))
  }

  // Handle save commission
  const handleSaveCommission = async (staffId: string, staffName: string) => {
    const editData = editingStaff[staffId]
    if (!editData) {
      showToast("Data commission tidak valid", "warning")
      return
    }

    if (editData.commissionAmount < 0) {
      showToast("Jumlah commission tidak boleh negatif", "warning")
      return
    }

    try {
      const res = await saveCommission({
        userId: staffId,
        month: selectedMonth,
        year: selectedYear,
        amount: editData.commissionAmount,
        notes: editData.notes,
        isPaid: editData.isPaid
      })

      if (res.error) throw new Error(res.error)
      showToast(`Commission untuk ${staffName} berhasil disimpan`, "success")
    } catch (err: any) {
      showToast(err.message || "Gagal menyimpan commission", "error")
    }
  }

  // Toggle expanded view
  const toggleExpanded = (staffId: string) => {
    setExpandedStaffId(expandedStaffId === staffId ? null : staffId)
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-red-500">
        <AlertCircle className="h-10 w-10 mb-2" />
        <p>Gagal memuat data commission</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F5ECEC] flex items-center justify-center">
            <Award className="h-5 w-5 text-[#7A1F1F]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#111827]">Staff Commissions</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Manual commission tracking untuk {getMonthName(selectedMonth)} {selectedYear}
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
          >
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
          <p className="text-sm text-[#6B7280]">Total Commission</p>
          <p className="text-2xl font-bold text-[#111827] mt-2">
            {formatCurrency(staffStats.reduce((sum, s) => sum + (s.commission?.amount || 0), 0))}
          </p>
          <p className="text-xs text-[#6B7280] mt-1">{staffStats.length} staff</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
          <p className="text-sm text-[#6B7280]">Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(staffStats.filter(s => s.commission?.isPaid).reduce((sum, s) => sum + (s.commission?.amount || 0), 0))}
          </p>
          <p className="text-xs text-green-600 mt-1">{staffStats.filter(s => s.commission?.isPaid).length} staff</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
          <p className="text-sm text-[#6B7280]">Unpaid</p>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {formatCurrency(staffStats.filter(s => !s.commission?.isPaid).reduce((sum, s) => sum + (s.commission?.amount || 0), 0))}
          </p>
          <p className="text-xs text-red-600 mt-1">{staffStats.filter(s => !s.commission?.isPaid).length} staff</p>
        </div>
      </div>

      {/* Staff Cards */}
      {staffStats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffStats.map((item) => {
            const roleConfig = USER_ROLE_MAP[item.staff.role]
            const isExpanded = expandedStaffId === item.staff.id
            const editData = editingStaff[item.staff.id] || {
              commissionAmount: item.commission?.amount || 0,
              notes: item.commission?.notes || "",
              isPaid: item.commission?.isPaid || false
            }

            // Initialize editing state if not exists
            if (!editingStaff[item.staff.id]) {
              initEditingState(item.staff.id, {
                commissionAmount: item.commission?.amount || 0,
                notes: item.commission?.notes || "",
                isPaid: item.commission?.isPaid || false
              })
            }

            return (
              <div key={item.staff.id} className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                {/* Card Header */}
                <div className="p-5 space-y-4">
                  {/* Staff Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#F5ECEC] flex items-center justify-center text-sm font-semibold text-[#7A1F1F] shrink-0">
                      {getInitials(item.staff.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold text-[#111827] truncate">{item.staff.name}</p>
                      <span
                        className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-1"
                        style={{ color: roleConfig.color, backgroundColor: roleConfig.bgColor }}
                      >
                        {roleConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-[#6B7280]">
                        <CalendarCheck className="h-4 w-4" />
                        <span>Bookings Handled</span>
                      </div>
                      <span className="font-medium text-[#111827]">{item.bookingCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#6B7280]">Revenue Generated</span>
                      <span className="text-base font-bold text-green-600">{formatCurrency(item.revenueGenerated)}</span>
                    </div>
                  </div>

                  {/* Commission Input */}
                  <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
                    <div>
                      <label className="block text-sm font-medium text-[#6B7280] mb-1">Commission Amount (Rp)</label>
                      <input
                        type="number"
                        value={editData.commissionAmount}
                        onChange={(e) => setEditingStaff(prev => ({
                          ...prev,
                          [item.staff.id]: {
                            ...editData,
                            commissionAmount: parseFloat(e.target.value) || 0
                          }
                        }))}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#6B7280] mb-1">Notes (Optional)</label>
                      <input
                        type="text"
                        value={editData.notes}
                        onChange={(e) => setEditingStaff(prev => ({
                          ...prev,
                          [item.staff.id]: {
                            ...editData,
                            notes: e.target.value
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
                        placeholder="Catatan..."
                      />
                    </div>

                    {/* Status Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#6B7280]">Status</span>
                      <button
                        onClick={() => setEditingStaff(prev => ({
                          ...prev,
                          [item.staff.id]: {
                            ...editData,
                            isPaid: !editData.isPaid
                          }
                        }))}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          editData.isPaid
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {editData.isPaid ? "Paid" : "Unpaid"}
                      </button>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={() => handleSaveCommission(item.staff.id, item.staff.name)}
                    className="w-full px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
                  >
                    Save Commission
                  </button>

                  {/* Expand Detail Button */}
                  {item.bookings.length > 0 && (
                    <button
                      onClick={() => toggleExpanded(item.staff.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Hide Bookings
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          View Bookings ({item.bookings.length})
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Expanded Detail View */}
                {isExpanded && item.bookings.length > 0 && (
                  <div className="border-t border-[#E5E7EB] bg-[#F9FAFB] p-5">
                    <h3 className="text-sm font-semibold text-[#111827] mb-3">Bookings Handled</h3>
                    <div className="space-y-2">
                      {item.bookings.map(booking => (
                        <Link
                          key={booking.id}
                          href={`/dashboard/bookings/${booking.id}`}
                          className="block p-3 bg-white rounded-lg border border-[#E5E7EB] hover:border-[#7A1F1F] transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs text-[#7A1F1F] font-medium">{booking.bookingCode}</span>
                            <span className="text-xs font-semibold text-green-600">{formatCurrency(booking.totalAmount)}</span>
                          </div>
                          <p className="text-sm text-[#111827] font-medium">{booking.client.name}</p>
                          <p className="text-xs text-[#6B7280]">{booking.package.name}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-[#6B7280] mb-4">Belum ada staff</p>
          <Link
            href="/dashboard/users"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
          >
            Tambah Staff
          </Link>
        </div>
      )}
    </div>
  )
}
