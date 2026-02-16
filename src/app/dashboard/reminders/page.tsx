"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bell,
  Calendar,
  Phone,
  Package as PackageIcon,
  MessageCircle,
  AlertCircle,
  Clock,
  CheckCircle
} from "lucide-react"
import { mockBookings } from "@/lib/mock-data"
import { formatDate, getInitials } from "@/lib/utils"
import { useMobile } from "@/lib/hooks/use-mobile"
import { StatusBadge } from "@/components/shared/status-badge"

type TabFilter = "today" | "tomorrow" | "week" | "all"

// Mock current time for testing - adjust as needed
const MOCK_CURRENT_TIME = new Date("2026-02-15T07:00:00") // Saturday, Feb 15, 2026, 07:00 AM

export default function RemindersPage() {
  const router = useRouter()
  const isMobile = useMobile()
  const [activeTab, setActiveTab] = useState<TabFilter>("today")

  // Get day name in Indonesian
  const getDayName = (date: Date) => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
    return days[date.getDay()]
  }

  // Calculate hours/minutes left
  const getTimeLeft = (sessionDate: string, sessionTime: string) => {
    const [hours, minutes] = sessionTime.split(":").map(Number)
    const sessionDateTime = new Date(sessionDate)
    sessionDateTime.setHours(hours, minutes, 0, 0)

    const diffMs = sessionDateTime.getTime() - MOCK_CURRENT_TIME.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = diffMins / 60

    return {
      totalMinutes: diffMins,
      hours: Math.floor(diffHours),
      minutes: diffMins % 60,
      isPast: diffMins < 0,
      isOngoing: diffMins >= -120 && diffMins <= 0 // Within 2 hours of start time
    }
  }

  // Format time left display
  const formatTimeLeft = (timeLeft: ReturnType<typeof getTimeLeft>) => {
    if (timeLeft.isPast) {
      if (timeLeft.isOngoing) return "Sedang berlangsung"
      return "Lewat"
    }

    if (timeLeft.hours < 1) {
      return `${timeLeft.minutes} menit lagi`
    }

    if (timeLeft.minutes === 0) {
      return `${timeLeft.hours} jam lagi`
    }

    return `${timeLeft.hours}.${Math.floor(timeLeft.minutes / 6)} jam lagi`
  }

  // Get color for time left badge
  const getTimeLeftColor = (timeLeft: ReturnType<typeof getTimeLeft>) => {
    if (timeLeft.isPast) {
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: AlertCircle
      }
    }

    if (timeLeft.hours < 2) {
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: AlertCircle
      }
    }

    if (timeLeft.hours < 6) {
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

  // Generate WhatsApp reminder link
  const generateWALink = (booking: any) => {
    const phone = booking.client.phone.replace(/^0/, '62')
    const sessionDate = new Date(booking.sessionDate)
    const dayName = getDayName(sessionDate)
    const dateStr = formatDate(booking.sessionDate)
    const statusLink = `${window.location.origin}/status/${booking.slug}`

    const message = `Halo ${booking.client.name},

Ini reminder untuk sesi foto kamu di Yoonjaespace:
📅 ${dayName}, ${dateStr} pukul ${booking.sessionTime}
📦 Paket: ${booking.package.name}
📍 Yoonjaespace Studio

Ditunggu ya! 😊

Cek status booking kamu: ${statusLink}`

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  // Filter bookings
  const filteredBookings = useMemo(() => {
    const now = MOCK_CURRENT_TIME
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    return mockBookings
      .filter(b => {
        // Only show non-cancelled bookings
        if (b.status === "CANCELLED") return false

        const sessionDate = new Date(b.sessionDate)
        const sessionDateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate())

        // Filter by tab
        if (activeTab === "today") {
          return sessionDateOnly.getTime() === today.getTime()
        } else if (activeTab === "tomorrow") {
          return sessionDateOnly.getTime() === tomorrow.getTime()
        } else if (activeTab === "week") {
          return sessionDateOnly >= today && sessionDateOnly < nextWeek
        } else {
          // All upcoming bookings
          return sessionDateOnly >= today
        }
      })
      .sort((a, b) => {
        // Sort by date and time (earliest first)
        const dateA = new Date(`${a.sessionDate}T${a.sessionTime}`)
        const dateB = new Date(`${b.sessionDate}T${b.sessionTime}`)
        return dateA.getTime() - dateB.getTime()
      })
  }, [activeTab])

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
              {filteredBookings.length} upcoming session{filteredBookings.length !== 1 ? "s" : ""}
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
                {filteredBookings.map((booking) => {
                  const timeLeft = getTimeLeft(booking.sessionDate, booking.sessionTime)
                  const timeColor = getTimeLeftColor(timeLeft)
                  const TimeIcon = timeColor.icon
                  const sessionDate = new Date(booking.sessionDate)
                  const dayName = getDayName(sessionDate)

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
                            {dayName}, {formatDate(booking.sessionDate)} • {booking.sessionTime}
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
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${timeColor.bg} ${timeColor.text} ${timeColor.border}`}>
                          <TimeIcon className="h-3 w-3" />
                          {formatTimeLeft(timeLeft)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          <a
                            href={generateWALink(booking)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Send WA Reminder
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
          {filteredBookings.map((booking) => {
            const timeLeft = getTimeLeft(booking.sessionDate, booking.sessionTime)
            const timeColor = getTimeLeftColor(timeLeft)
            const TimeIcon = timeColor.icon
            const sessionDate = new Date(booking.sessionDate)
            const dayName = getDayName(sessionDate)

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
                    <span>{dayName}, {formatDate(booking.sessionDate)} • {booking.sessionTime}</span>
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
                <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${timeColor.bg} ${timeColor.text} ${timeColor.border}`}>
                    <TimeIcon className="h-3 w-3" />
                    {formatTimeLeft(timeLeft)}
                  </span>
                  <a
                    href={generateWALink(booking)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WA
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredBookings.length === 0 && (
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

      {/* Current Time Info (for testing) */}
      <div className="text-xs text-gray-400 text-center">
        Mock current time: {MOCK_CURRENT_TIME.toLocaleString("id-ID")}
      </div>
    </div>
  )
}
