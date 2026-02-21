"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Bell,
  Calendar,
  Phone,
  Package as PackageIcon,
  MessageCircle,
  AlertCircle,
  Clock,
  CheckCircle,
  Loader2,
  Check,
  RotateCcw,
  Heart,
  Sparkles
} from "lucide-react"
import { useReminders } from "@/lib/hooks/use-reminders"
import { useReminderCount } from "@/lib/hooks/use-reminder-count"
import { formatDate, getInitials } from "@/lib/utils"
import { useMobile } from "@/lib/hooks/use-mobile"
import { StatusBadge } from "@/components/shared/status-badge"
import { apiPatch } from "@/lib/api-client"
import { useToast } from "@/lib/hooks/use-toast"

type TabFilter = "today" | "tomorrow" | "week" | "all"

export default function RemindersPage() {
  const isMobile = useMobile()
  const [activeTab, setActiveTab] = useState<TabFilter>("today")
  const { reminders, isLoading, isError, refresh } = useReminders(activeTab)
  const { refresh: refreshCount } = useReminderCount()
  const { showToast } = useToast()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleMarkReminded = async (bookingId: string, reminded: boolean) => {
    setUpdatingId(bookingId)
    try {
      const { error } = await apiPatch(`/api/bookings/${bookingId}/remind`, { reminded })
      if (error) throw new Error(error)

      await refresh()
      await refreshCount()
      showToast(reminded ? "Berhasil menandai sudah diremind" : "Status reminder dikembalikan", "success")
    } catch (err: any) {
      showToast(err.message || "Gagal mengupdate status reminder", "error")
    } finally {
      setUpdatingId(null)
    }
  }

  // Format time left display
  const formatTimeLeft = (hoursUntilSession: number) => {
    if (hoursUntilSession < 0) {
      if (hoursUntilSession > -2) return "Sedang berlangsung"
      return "Lewat"
    }

    if (hoursUntilSession < 1) {
      const minutes = Math.round(hoursUntilSession * 60)
      return `${minutes} menit lagi`
    }

    return `${Math.floor(hoursUntilSession)} jam lagi`
  }

  // Get color for time left badge
  const getTimeLeftColor = (hours: number) => {
    if (hours < 0) {
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: AlertCircle
      }
    }

    if (hours < 2) {
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: AlertCircle
      }
    }

    if (hours < 6) {
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        icon: Clock
      }
    }

    return {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
      icon: CheckCircle
    }
  }

  // No filteredBookings useMemo needed, handled by hook and data shape

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
        <p>Gagal memuat reminders</p>
      </div>
    )
  }

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "tomorrow", label: "Tomorrow" },
    { key: "week", label: "This Week" },
    { key: "all", label: "All" }
  ]

  const getEmptyStateText = () => {
    switch (activeTab) {
      case "today": return "Tidak ada reminder untuk hari ini"
      case "tomorrow": return "Tidak ada reminder untuk besok"
      case "week": return "Tidak ada reminder minggu ini"
      default: return "Tidak ada upcoming bookings"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F5ECEC] flex items-center justify-center">
            <Bell className="h-5 w-5 text-[#7A1F1F]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#111827]">Reminders</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              {reminders.length} upcoming session{reminders.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Filter */}
      <div className="inline-flex rounded-lg bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-[#7A1F1F] shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Desktop Table */}
      {!isMobile ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Client</th>
                  <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Date & Time</th>
                  <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Package</th>
                  <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Hours Left</th>
                  <th className="text-center py-3 px-4 font-medium text-[#6B7280]">Action</th>
                </tr>
              </thead>
              <tbody>
                {reminders.map((item) => {
                  const { booking, hoursUntilSession, waLink } = item
                  const date = new Date(booking.date)
                  const dayName = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][date.getDay()]

                  return (
                    <tr
                      key={booking.id}
                      className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors"
                    >
                      {/* Client */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/dashboard/bookings/${booking.id}`}
                          className="flex items-center gap-3 hover:text-[#7A1F1F]"
                        >
                          <div className="w-9 h-9 rounded-full bg-[#F5ECEC] flex items-center justify-center text-xs font-semibold text-[#7A1F1F] shrink-0">
                            {getInitials(booking.client.name)}
                          </div>
                          <span className="font-semibold text-[#111827]">{booking.client.name}</span>
                        </Link>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4">
                        <a
                          href={`https://wa.me/${booking.client.phone.replace(/^0/, '62')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[#6B7280] hover:text-[#7A1F1F] transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>{booking.client.phone}</span>
                        </a>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-[#6B7280]">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {dayName}, {formatDate(booking.date)} • {formatDate(booking.startTime, 'HH:mm')}
                          </span>
                        </div>
                      </td>

                      {/* Package */}
                      <td className="py-3 px-4 text-[#6B7280]">
                        {booking.package.name}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={booking.status} size="sm" />
                      </td>

                      {/* Hours Left */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getTimeLeftColor(hoursUntilSession).bg} ${getTimeLeftColor(hoursUntilSession).text} ${getTimeLeftColor(hoursUntilSession).border}`}>
                          {(() => {
                            const color = getTimeLeftColor(hoursUntilSession)
                            const Icon = color.icon
                            return <Icon className="h-3 w-3" />
                          })()}
                          {formatTimeLeft(hoursUntilSession)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-1.5 flex-wrap">
                          {booking.remindedAt ? (
                            <button
                              onClick={() => handleMarkReminded(booking.id, false)}
                              disabled={updatingId === booking.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                              title="Tandai belum diremind"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Undo
                            </button>
                          ) : (
                            <>
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
                                title="Kirim Reminder"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                Remind
                              </a>
                              <button
                                onClick={() => handleMarkReminded(booking.id, true)}
                                disabled={updatingId === booking.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                                title="Tandai sudah diremind"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          {/* Thank You Buttons */}
                          <a
                            href={item.waThankYouPaymentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-colors"
                            title="Say Thank You (Payment)"
                          >
                            <Heart className="h-3.5 w-3.5" />
                            Pay
                          </a>
                          <a
                            href={item.waThankYouSessionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-600 text-white text-xs font-medium hover:bg-pink-700 transition-colors"
                            title="Say Thank You (After Session)"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Session
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Mobile Cards */
        <div className="space-y-3">
          {reminders.map((item) => {
            const { booking, hoursUntilSession, waLink } = item
            const timeColor = getTimeLeftColor(hoursUntilSession)
            const TimeIcon = timeColor.icon
            const date = new Date(booking.date)
            const dayName = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][date.getDay()]

            return (
              <div
                key={booking.id}
                className="p-4 rounded-xl border border-[#E5E7EB] bg-white"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <Link
                    href={`/dashboard/bookings/${booking.id}`}
                    className="flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#F5ECEC] flex items-center justify-center text-sm font-semibold text-[#7A1F1F] shrink-0">
                      {getInitials(booking.client.name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">{booking.client.name}</p>
                    </div>
                  </Link>
                  <StatusBadge status={booking.status} size="sm" />
                </div>

                {/* Body */}
                <div className="space-y-2 text-xs mb-3">
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <Calendar className="h-3 w-3" />
                    <span>{dayName}, {formatDate(booking.date)} • {formatDate(booking.startTime, 'HH:mm')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <PackageIcon className="h-3 w-3" />
                    <span>{booking.package.name}</span>
                  </div>
                  <a
                    href={`https://wa.me/${booking.client.phone.replace(/^0/, '62')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#6B7280] hover:text-[#7A1F1F]"
                  >
                    <Phone className="h-3 w-3" />
                    <span>{booking.client.phone}</span>
                  </a>
                </div>

                {/* Footer */}
                <div className="space-y-2 pt-3 border-t border-[#E5E7EB]">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${timeColor.bg} ${timeColor.text} ${timeColor.border}`}>
                      <TimeIcon className="h-3 w-3" />
                      {formatTimeLeft(hoursUntilSession)}
                    </span>
                    <div className="flex gap-1.5">
                      {booking.remindedAt ? (
                        <button
                          onClick={() => handleMarkReminded(booking.id, false)}
                          disabled={updatingId === booking.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Undo
                        </button>
                      ) : (
                        <>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Remind
                          </a>
                          <button
                            onClick={() => handleMarkReminded(booking.id, true)}
                            disabled={updatingId === booking.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Thank You Buttons Row */}
                  <div className="flex gap-1.5">
                    <a
                      href={item.waThankYouPaymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-colors"
                      title="Say Thank You (Payment)"
                    >
                      <Heart className="h-3.5 w-3.5" />
                      Thank You (Pay)
                    </a>
                    <a
                      href={item.waThankYouSessionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-600 text-white text-xs font-medium hover:bg-pink-700 transition-colors"
                      title="Say Thank You (After Session)"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Thank You (Session)
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {reminders.length === 0 && !isLoading && (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E5E7EB]">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">{getEmptyStateText()}</p>
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7A1F1F] text-white text-sm font-medium hover:bg-[#9B3333] transition-colors"
          >
            Lihat Semua Bookings
          </Link>
        </div>
      )}

    </div>
  )
}
