"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  Calendar as CalendarIcon,
  Plus
} from "lucide-react"
import { StatusBadge } from "@/components/shared/status-badge"
import { mockBookings } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/utils"
import { useMobile } from "@/lib/hooks/use-mobile"
import { BookingStatus, Booking } from "@/lib/types"

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
const DAYS_FULL = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

type ViewMode = "month" | "week" | "day"

// Helper to get status color
const getStatusColor = (status: BookingStatus) => {
  const colors = {
    BOOKED: "bg-blue-500",
    PAID: "bg-emerald-500",
    SHOOT_DONE: "bg-purple-500",
    PHOTOS_DELIVERED: "bg-amber-500",
    CLOSED: "bg-gray-500",
    CANCELLED: "bg-red-500"
  }
  return colors[status] || "bg-gray-400"
}

// Helper to format time from "HH:mm" string
const getTimeInMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export default function CalendarPage() {
  const router = useRouter()
  const isMobile = useMobile()
  const today = new Date()

  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [currentDate, setCurrentDate] = useState(today)
  const [selectedDateMobile, setSelectedDateMobile] = useState<string | null>(null)

  // Get current year/month/day/week
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const currentDay = currentDate.getDate()

  // Navigation handlers
  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "month") {
      newDate.setMonth(currentMonth - 1)
    } else if (viewMode === "week") {
      newDate.setDate(currentDay - 7)
    } else {
      newDate.setDate(currentDay - 1)
    }
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "month") {
      newDate.setMonth(currentMonth + 1)
    } else if (viewMode === "week") {
      newDate.setDate(currentDay + 7)
    } else {
      newDate.setDate(currentDay + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get calendar display text
  const getDisplayText = () => {
    if (viewMode === "month") {
      return `${MONTHS[currentMonth]} ${currentYear}`
    } else if (viewMode === "week") {
      const startOfWeek = getWeekStart(currentDate)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      return `${startOfWeek.getDate()} ${MONTHS[startOfWeek.getMonth()]} - ${endOfWeek.getDate()} ${MONTHS[endOfWeek.getMonth()]} ${currentYear}`
    } else {
      return `${currentDay} ${MONTHS[currentMonth]} ${currentYear}`
    }
  }

  // Get week start (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day // Monday as first day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  // Get bookings for a specific date
  const getBookingsForDate = (dateStr: string) => {
    return mockBookings.filter((b) => b.sessionDate === dateStr && b.status !== "CANCELLED")
  }

  // Check if date is Tuesday (day off)
  const isTuesday = (date: Date) => {
    return date.getDay() === 2
  }

  // Check if date is today
  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Generate calendar grid for month view
  const generateMonthGrid = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1 // Adjust for Monday start

    const days: (Date | null)[] = []

    // Add empty cells for days before month starts
    for (let i = 0; i < adjustedFirstDay; i++) {
      const prevMonthDate = new Date(currentYear, currentMonth, 0 - (adjustedFirstDay - i - 1))
      days.push(prevMonthDate)
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day))
    }

    // Add days from next month to complete the grid
    const remainingCells = 42 - days.length // 6 rows x 7 days
    for (let i = 1; i <= remainingCells; i++) {
      days.push(new Date(currentYear, currentMonth + 1, i))
    }

    return days
  }

  // Generate week days
  const generateWeekDays = () => {
    const startOfWeek = getWeekStart(currentDate)
    const weekDays: Date[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      weekDays.push(day)
    }
    return weekDays
  }

  // Time slots for week/day view (08:00 - 20:00)
  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = 8 + i
    return `${hour.toString().padStart(2, "0")}:00`
  })

  const monthDays = useMemo(() => generateMonthGrid(), [currentYear, currentMonth])
  const weekDays = useMemo(() => generateWeekDays(), [currentDate])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Calendar</h1>
          <p className="text-sm text-[#6B7280] mt-1">Jadwal sesi foto studio</p>
        </div>
        <Link
          href="/dashboard/bookings/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7A1F1F] text-white text-sm font-semibold hover:bg-[#9B3333] transition-colors w-fit"
        >
          <Plus className="h-4 w-4" />
          New Booking
        </Link>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-xl border border-[#E5E7EB] p-4">
        {/* View Toggle */}
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          {(["month", "week", "day"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                viewMode === mode
                  ? "bg-white text-[#7A1F1F] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevious}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>

          <div className="min-w-[200px] text-center">
            <p className="text-sm font-bold text-gray-900">{getDisplayText()}</p>
          </div>

          <button
            onClick={goToNext}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-1"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>

          <button
            onClick={goToToday}
            className="px-4 py-1.5 rounded-lg bg-[#7A1F1F] text-white text-sm font-medium hover:bg-[#9B3333] transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Views */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        {viewMode === "month" && (
          <MonthView
            days={monthDays}
            currentMonth={currentMonth}
            getBookingsForDate={getBookingsForDate}
            isTuesday={isTuesday}
            isToday={isToday}
            isMobile={isMobile}
            selectedDateMobile={selectedDateMobile}
            setSelectedDateMobile={setSelectedDateMobile}
            setViewMode={setViewMode}
            setCurrentDate={setCurrentDate}
          />
        )}

        {viewMode === "week" && (
          <WeekView
            weekDays={weekDays}
            timeSlots={timeSlots}
            getBookingsForDate={getBookingsForDate}
            isTuesday={isTuesday}
            isToday={isToday}
          />
        )}

        {viewMode === "day" && (
          <DayView
            date={currentDate}
            timeSlots={timeSlots}
            getBookingsForDate={getBookingsForDate}
            isTuesday={isTuesday}
          />
        )}
      </div>
    </div>
  )
}

// ============ MONTH VIEW ============
function MonthView({
  days,
  currentMonth,
  getBookingsForDate,
  isTuesday,
  isToday,
  isMobile,
  selectedDateMobile,
  setSelectedDateMobile,
  setViewMode,
  setCurrentDate
}: {
  days: (Date | null)[]
  currentMonth: number
  getBookingsForDate: (dateStr: string) => Booking[]
  isTuesday: (date: Date) => boolean
  isToday: (date: Date) => boolean
  isMobile: boolean
  selectedDateMobile: string | null
  setSelectedDateMobile: (date: string | null) => void
  setViewMode: (mode: ViewMode) => void
  setCurrentDate: (date: Date) => void
}) {
  const router = useRouter()

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]

    if (isMobile) {
      setSelectedDateMobile(selectedDateMobile === dateStr ? null : dateStr)
    } else {
      // Desktop: switch to day view
      setCurrentDate(date)
      setViewMode("day")
    }
  }

  const handleBookingClick = (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation()
    router.push(`/dashboard/bookings/${bookingId}`)
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide py-2 bg-gray-50 rounded">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date: Date | null, index: number) => {
          if (!date) return <div key={`empty-${index}`} />

          const dateStr = date.toISOString().split("T")[0]
          const bookings = getBookingsForDate(dateStr)
          const isCurrentMonth = date.getMonth() === currentMonth
          const isTues = isTuesday(date)
          const isCurrentDay = isToday(date)
          const isSelected = selectedDateMobile === dateStr

          return (
            <div
              key={dateStr}
              onClick={() => handleDateClick(date)}
              className={`min-h-[80px] sm:min-h-[100px] p-1.5 sm:p-2 rounded-lg border cursor-pointer transition-all ${
                isCurrentDay
                  ? "border-2 border-[#7A1F1F] bg-[#F5ECEC]"
                  : isTues && isCurrentMonth
                    ? "bg-gray-50 border-gray-200"
                    : "border-gray-100 hover:border-gray-300 hover:bg-gray-50"
              } ${!isCurrentMonth ? "opacity-40" : ""} ${isSelected ? "ring-2 ring-[#7A1F1F]" : ""}`}
            >
              {/* Date number */}
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs sm:text-sm font-medium ${
                  isCurrentDay
                    ? "text-[#7A1F1F] font-bold"
                    : isCurrentMonth
                      ? "text-gray-900"
                      : "text-gray-400"
                }`}>
                  {date.getDate()}
                </span>
                {isTues && isCurrentMonth && (
                  <span className="text-[10px] text-gray-400 hidden sm:inline">Day Off</span>
                )}
              </div>

              {/* Bookings */}
              {isMobile ? (
                // Mobile: just show dots
                bookings.length > 0 && (
                  <div className="flex gap-0.5 flex-wrap mt-1">
                    {bookings.slice(0, 5).map((booking: Booking, i: number) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${getStatusColor(booking.status)}`}
                      />
                    ))}
                    {bookings.length > 5 && (
                      <span className="text-[10px] text-gray-500 ml-0.5">+{bookings.length - 5}</span>
                    )}
                  </div>
                )
              ) : (
                // Desktop: show booking cards
                <div className="space-y-1">
                  {bookings.slice(0, 2).map((booking) => (
                    <button
                      key={booking.id}
                      onClick={(e) => handleBookingClick(e, booking.id)}
                      className="w-full text-left p-1.5 rounded bg-white border border-gray-200 hover:shadow-sm transition-shadow text-[10px] sm:text-xs"
                    >
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(booking.status)}`} />
                        <span className="font-medium text-gray-900 truncate">{booking.sessionTime}</span>
                      </div>
                      <p className="text-gray-600 truncate ml-2.5 mt-0.5">{booking.client.name}</p>
                    </button>
                  ))}
                  {bookings.length > 2 && (
                    <div className="text-[10px] text-gray-500 pl-1">+{bookings.length - 2} more</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: Selected date details */}
      {isMobile && selectedDateMobile && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            {new Date(selectedDateMobile + "T00:00:00").toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h3>
          {getBookingsForDate(selectedDateMobile).length > 0 ? (
            <div className="space-y-2">
              {getBookingsForDate(selectedDateMobile).map((booking: Booking) => (
                <Link
                  key={booking.id}
                  href={`/dashboard/bookings/${booking.id}`}
                  className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200"
                >
                  <Camera className="h-4 w-4 text-[#7A1F1F] mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{booking.client.name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{booking.sessionTime} • {booking.package.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={booking.status} size="sm" />
                      <span className="text-xs font-medium text-[#7A1F1F]">{formatCurrency(booking.totalPrice)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Tidak ada booking</p>
          )}
        </div>
      )}
    </div>
  )
}

// ============ WEEK VIEW ============
function WeekView({ weekDays, timeSlots, getBookingsForDate, isTuesday, isToday }: {
  weekDays: Date[]
  timeSlots: string[]
  getBookingsForDate: (dateStr: string) => Booking[]
  isTuesday: (date: Date) => boolean
  isToday: (date: Date) => boolean
}) {
  const router = useRouter()

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px] p-4 sm:p-6">
        {/* Week day headers */}
        <div className="grid grid-cols-8 gap-2 mb-4">
          <div className="text-xs font-semibold text-gray-500" />
          {weekDays.map((date: Date) => {
            const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1
            const isTues = isTuesday(date)
            const isCurrentDay = isToday(date)

            return (
              <div
                key={date.toISOString()}
                className={`text-center p-2 rounded-lg ${
                  isCurrentDay ? "bg-[#F5ECEC]" : isTues ? "bg-gray-50" : ""
                }`}
              >
                <p className="text-xs font-semibold text-gray-500">{DAYS[dayIndex]}</p>
                <p className={`text-lg font-bold mt-1 ${
                  isCurrentDay ? "text-[#7A1F1F]" : "text-gray-900"
                }`}>
                  {date.getDate()}
                </p>
                {isTues && <p className="text-[10px] text-gray-400 mt-0.5">Day Off</p>}
              </div>
            )
          })}
        </div>

        {/* Time grid */}
        <div className="relative">
          {timeSlots.map((time: string, timeIndex: number) => (
            <div key={time} className="grid grid-cols-8 gap-2 border-t border-gray-100">
              {/* Time label */}
              <div className="py-2 text-xs text-gray-500 font-medium">{time}</div>

              {/* Day columns */}
              {weekDays.map((date: Date) => {
                const dateStr = date.toISOString().split("T")[0]
                const bookings = getBookingsForDate(dateStr)
                const isTues = isTuesday(date)

                // Find bookings in this hour
                const hourBookings = bookings.filter((b: Booking) => {
                  const bookingTime = getTimeInMinutes(b.sessionTime)
                  const slotTime = getTimeInMinutes(time)
                  return bookingTime >= slotTime && bookingTime < slotTime + 60
                })

                return (
                  <div
                    key={dateStr}
                    className={`relative min-h-[60px] p-1 ${
                      isTues ? "bg-gray-50" : ""
                    }`}
                  >
                    {hourBookings.map((booking: any) => (
                      <button
                        key={booking.id}
                        onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                        className={`w-full p-2 rounded text-left text-[10px] border border-white shadow-sm hover:shadow transition-shadow ${getStatusColor(booking.status)} text-white`}
                      >
                        <p className="font-semibold">{booking.sessionTime}</p>
                        <p className="truncate mt-0.5 opacity-90">{booking.client.name}</p>
                        <p className="truncate opacity-75">{booking.package.name}</p>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============ DAY VIEW ============
function DayView({ date, timeSlots, getBookingsForDate, isTuesday }: {
  date: Date
  timeSlots: string[]
  getBookingsForDate: (dateStr: string) => Booking[]
  isTuesday: (date: Date) => boolean
}) {
  const router = useRouter()
  const dateStr = date.toISOString().split("T")[0]
  const bookings = getBookingsForDate(dateStr)
  const isTues = isTuesday(date)
  const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1

  return (
    <div className="p-4 sm:p-6">
      {/* Day header */}
      <div className={`mb-6 p-4 rounded-lg ${isTues ? "bg-gray-50" : "bg-[#F5ECEC]"}`}>
        <h2 className="text-lg font-bold text-gray-900">
          {DAYS_FULL[dayIndex]}, {date.getDate()} {MONTHS[date.getMonth()]} {date.getFullYear()}
        </h2>
        {isTues && <p className="text-sm text-gray-500 mt-1">Studio Day Off</p>}
        <p className="text-sm text-gray-600 mt-1">{bookings.length} booking{bookings.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {timeSlots.map((time: string) => {
          // Find bookings in this hour
          const hourBookings = bookings.filter((b: any) => {
            const bookingTime = getTimeInMinutes(b.sessionTime)
            const slotTime = getTimeInMinutes(time)
            return bookingTime >= slotTime && bookingTime < slotTime + 60
          })

          return (
            <div key={time} className="grid grid-cols-[80px_1fr] gap-4 border-t border-gray-100 py-3">
              {/* Time */}
              <div className="text-sm font-medium text-gray-500 pt-1">{time}</div>

              {/* Booking or empty slot */}
              <div className="space-y-2">
                {hourBookings.length > 0 ? (
                  hourBookings.map((booking: Booking) => (
                    <button
                      key={booking.id}
                      onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                      className="w-full text-left p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Camera className="h-4 w-4 text-[#7A1F1F]" />
                            <span className="text-sm font-bold text-gray-900">{booking.sessionTime}</span>
                            <StatusBadge status={booking.status} size="sm" />
                          </div>
                          <p className="text-base font-semibold text-gray-900">{booking.client.name}</p>
                          <p className="text-sm text-gray-600 mt-0.5">{booking.client.phone}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>{booking.package.name}</span>
                            <span>•</span>
                            <span>{booking.numPeople || 1} orang</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold text-[#7A1F1F]">{formatCurrency(booking.totalPrice)}</p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-3 text-xs text-gray-400 italic">Available</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state for whole day */}
      {bookings.length === 0 && (
        <div className="text-center py-16">
          <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Tidak ada booking di hari ini</p>
          <Link
            href="/dashboard/bookings/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7A1F1F] text-white text-sm font-medium hover:bg-[#9B3333] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Buat Booking
          </Link>
        </div>
      )}
    </div>
  )
}
