"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  MoreHorizontal,
  Plus,
  Filter,
  Loader2,
  AlertTriangle,
  Link2,
  Check,
} from "lucide-react"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO, startOfWeek, endOfWeek, addDays } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useBookings } from "@/lib/hooks/use-bookings"
import { Booking, BookingStatus } from "@/lib/types"
import { getBookingMuaOverlaps } from "@/lib/client-mua-overlap"
import { useAuth } from "@/lib/hooks/use-auth"
import { useToast } from "@/lib/hooks/use-toast"
import { apiPatch } from "@/lib/api-client"

// Map BookingStatus to UI colors
const STATUS_COLORS: Record<BookingStatus, { bg: string; text: string; border: string }> = {
  BOOKED: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  PAID: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  SHOOT_DONE: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  PHOTOS_DELIVERED: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  CLOSED: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
  CANCELLED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" }
}

const VIEW_OPTIONS = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" }
]

export default function CalendarPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState("day") // day, week, month (default changed to day)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // SESI 12: Quick jump navigation
  const [showJumpMenu, setShowJumpMenu] = useState(false)
  const [jumpMonth, setJumpMonth] = useState(format(new Date(), "yyyy-MM"))

  const [copiedMua, setCopiedMua] = useState(false)

  const handleCopyMuaLink = async () => {
    const url = window.location.origin + "/mua"
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const el = document.createElement("textarea")
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
    }
    setCopiedMua(true)
    setTimeout(() => setCopiedMua(false), 2000)
  }

  // SESI 12: Modal editing state
  const [isEditingModal, setIsEditingModal] = useState(false)
  const [editStatus, setEditStatus] = useState<BookingStatus>("BOOKED")
  const [editPhotoLink, setEditPhotoLink] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Format month for API query (YYYY-MM)
  const queryMonth = useMemo(() => format(currentDate, "yyyy-MM"), [currentDate])

  const { bookings } = useBookings({ month: queryMonth })

  // Navigation
  const nextDate = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1))
    else if (view === "week") setCurrentDate(addDays(currentDate, 7))
    else setCurrentDate(addDays(currentDate, 1))
  }

  const prevDate = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1))
    else if (view === "week") setCurrentDate(addDays(currentDate, -7))
    else setCurrentDate(addDays(currentDate, -1))
  }

  const goToToday = () => setCurrentDate(new Date())

  // SESI 12: Jump to specific month/year
  const handleJumpToMonth = () => {
    const [year, month] = jumpMonth.split('-').map(Number)
    setCurrentDate(new Date(year, month - 1, 1))
    setShowJumpMenu(false)
  }

  // Calendar Grid Generation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentDate])

  const weekDays = useMemo(() => {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      return eachDayOfInterval({ start, end })
  }, [currentDate])


  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => isSameDay(parseISO(booking.date), date))
  }

  // Calculate session duration in minutes
  const calculateDuration = (booking: Booking) => {
    const start = parseISO(booking.startTime)
    const end = parseISO(booking.endTime)
    const diffMs = end.getTime() - start.getTime()
    return Math.round(diffMs / (1000 * 60))
  }

  // Format duration display
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} menit`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours} jam`
    return `${hours} jam ${mins} menit`
  }

  // Open modal with booking details
  const handleBookingClick = (booking: Booking, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSelectedBooking(booking)
    setEditStatus(booking.status)
    setEditPhotoLink(booking.photoLink || "")
    setIsEditingModal(false)
    setIsModalOpen(true)
  }

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false)
    setIsEditingModal(false)
    setTimeout(() => setSelectedBooking(null), 200)
  }

  // SESI 12: Save photo status and Google Drive link from modal
  const handleSaveModalChanges = async () => {
    if (!selectedBooking) return

    setIsSaving(true)
    try {
      const { error } = await apiPatch(`/api/bookings/${selectedBooking.id}/status`, {
        status: editStatus,
        photoLink: editPhotoLink
      })

      if (error) throw new Error(error)

      showToast("Status dan link foto berhasil diupdate", "success")

      // Refresh bookings to get updated data
      window.location.reload()
    } catch (err: any) {
      showToast(err.message || "Gagal menyimpan perubahan", "error")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                <button onClick={prevDate} className="p-1 hover:bg-gray-100 rounded-md text-gray-600">
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={nextDate} className="p-1 hover:bg-gray-100 rounded-md text-gray-600">
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
            <h1 className="text-xl font-semibold text-[#111827]">
                {format(currentDate, "MMMM yyyy", { locale: idLocale })}
            </h1>
            <button
                onClick={goToToday}
                className="text-sm font-medium text-[#6B7280] hover:text-[#111827] px-3 py-1 border border-gray-200 rounded-md bg-white"
            >
                Today
            </button>

            {/* SESI 12: Quick Jump Navigation (Month view only) */}
            {view === "month" && (
              <div className="relative">
                <button
                  onClick={() => setShowJumpMenu(!showJumpMenu)}
                  className="text-sm font-medium text-[#6B7280] hover:text-[#111827] px-3 py-1 border border-gray-200 rounded-md bg-white flex items-center gap-1"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span>Jump to...</span>
                </button>

                {showJumpMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-64">
                    <p className="text-xs font-medium text-gray-700 mb-2">Pilih Bulan & Tahun</p>
                    <input
                      type="month"
                      value={jumpMonth}
                      onChange={(e) => setJumpMonth(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm mb-3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowJumpMenu(false)}
                        className="flex-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleJumpToMonth}
                        className="flex-1 px-3 py-1.5 text-sm text-white bg-[#7A1F1F] rounded-md hover:bg-[#9B3333]"
                      >
                        Go
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>

        <div className="flex items-center gap-3">
             <div className="flex bg-gray-100 p-1 rounded-lg">
                {VIEW_OPTIONS.map(option => (
                    <button
                        key={option.value}
                        onClick={() => setView(option.value)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                            view === option.value
                            ? "bg-white text-[#111827] shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
            <button
                onClick={handleCopyMuaLink}
                title="Salin link kalender MUA untuk dibagikan ke MUA artist"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    copiedMua
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-white text-[#6B7280] border-gray-200 hover:text-[#7A1F1F] hover:border-[#7A1F1F]"
                }`}
            >
                {copiedMua ? (
                    <>
                        <Check className="h-4 w-4" />
                        <span className="hidden sm:inline">Link disalin!</span>
                    </>
                ) : (
                    <>
                        <Link2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Link MUA</span>
                    </>
                )}
            </button>
            <button
                onClick={() => router.push('/dashboard/bookings/new')}
                className="flex items-center gap-2 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
            >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Booking</span>
            </button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden flex flex-col">
          {!bookings ? (
              <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
              </div>
          ) : (
             <>
                 {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day, i) => (
                        <div key={i} className="py-3 text-center text-sm font-medium text-[#6B7280]">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Month View */}
                {view === "month" && (
                    <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
                        {calendarDays.map((day, dayIdx) => {
                            const dayBookings = getBookingsForDate(day)
                            const isSelectedMonth = isSameMonth(day, currentDate)
                            const isTodayDate = isToday(day)

                            return (
                                <div 
                                    key={day.toISOString()} 
                                    className={`min-h-[120px] border-b border-r border-[#E5E7EB] p-2 transition-colors hover:bg-gray-50
                                        ${!isSelectedMonth ? "bg-gray-50/50" : "bg-white"}
                                        ${(dayIdx + 1) % 7 === 0 ? "border-r-0" : ""}
                                    `}
                                    onClick={() => {
                                        setCurrentDate(day)
                                        setView('day')
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`
                                            text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                                            ${isTodayDate ? "bg-[#7A1F1F] text-white" : isSelectedMonth ? "text-[#111827]" : "text-gray-400"}
                                        `}>
                                            {format(day, "d")}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        {dayBookings.slice(0, 3).map(booking => {
                                            const statusStyle = STATUS_COLORS[booking.status] || STATUS_COLORS.BOOKED
                                            return (
                                                <button
                                                    key={booking.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleBookingClick(booking, e)
                                                    }}
                                                    className={`w-full text-left px-2 py-1 rounded text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} hover:brightness-95 transition-all`}
                                                >
                                                    {/* SESI 12: Show start and end time */}
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-semibold">{format(parseISO(booking.startTime), "HH:mm")}</span>
                                                        <span className="text-[10px]">-</span>
                                                        <span className="text-[10px]">{format(parseISO(booking.endTime), "HH:mm")}</span>
                                                    </div>
                                                    <div className="truncate">{booking.client.name}</div>
                                                </button>
                                            )
                                        })}
                                        {dayBookings.length > 3 && (
                                            <div className="text-xs text-gray-500 pl-1">
                                                + {dayBookings.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Week View */}
                {view === "week" && (
                     <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-7 min-h-full">
                            {weekDays.map((day, i) => {
                                const dayBookings = getBookingsForDate(day)
                                const isTodayDate = isToday(day)
                                return (
                                    <div key={day.toISOString()} className={`border-r border-[#E5E7EB] last:border-r-0 p-2 min-h-[500px] ${isTodayDate ? 'bg-red-50/20' : ''}`}>
                                         <div className="text-center mb-4 p-2 border-b border-gray-100">
                                            <div className={`text-sm font-medium ${isTodayDate ? "text-[#7A1F1F]" : "text-gray-500"}`}>
                                                {format(day, "EEE", { locale: idLocale })}
                                            </div>
                                            <div className={`text-xl font-semibold mt-1 w-8 h-8 rounded-full flex items-center justify-center mx-auto ${isTodayDate ? "bg-[#7A1F1F] text-white" : "text-gray-900"}`}>
                                                {format(day, "d")}
                                            </div>
                                         </div>
                                         <div className="space-y-2">
                                            {dayBookings.map(booking => {
                                                const statusStyle = STATUS_COLORS[booking.status] || STATUS_COLORS.BOOKED
                                                const overlapInfo = getBookingMuaOverlaps(booking, dayBookings)
                                                const duration = calculateDuration(booking)
                                                return (
                                                    <div
                                                        key={booking.id}
                                                        onClick={(e) => handleBookingClick(booking, e)}
                                                        className={`p-2 rounded-lg border ${statusStyle.bg} ${statusStyle.border} cursor-pointer hover:shadow-sm transition-all relative`}
                                                    >
                                                        {overlapInfo.hasOverlap && (
                                                            <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                                                                <AlertTriangle className="h-3 w-3 text-white" />
                                                            </div>
                                                        )}
                                                        <div className="text-xs font-medium text-gray-700">
                                                            {format(parseISO(booking.startTime), "HH:mm")} - {format(parseISO(booking.endTime), "HH:mm")}
                                                        </div>
                                                        <div className="text-xs text-purple-600 font-medium mb-1">
                                                            {formatDuration(duration)}
                                                        </div>
                                                        <div className="text-sm font-semibold text-gray-900 truncate">
                                                            {booking.client.name}
                                                        </div>
                                                        <div className="text-xs text-gray-600 truncate">
                                                            {booking.package.name}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                         </div>
                                    </div>
                                )
                            })}
                        </div>
                     </div>
                )}
                
                {/* Day View */}
                 {view === "day" && (
                    <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full">
                         <div className="mb-6 text-center">
                            <h2 className="text-2xl font-bold text-gray-900">{format(currentDate, "EEEE, d MMMM yyyy", { locale: idLocale })}</h2>
                            <p className="text-gray-500 mt-1">{getBookingsForDate(currentDate).length} Bookings</p>
                         </div>

                         <div className="space-y-4">
                             {getBookingsForDate(currentDate)
                             .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                             .map(booking => {
                                  const statusStyle = STATUS_COLORS[booking.status] || STATUS_COLORS.BOOKED
                                  const dayBookings = getBookingsForDate(currentDate)
                                  const overlapInfo = getBookingMuaOverlaps(booking, dayBookings)

                                  const duration = calculateDuration(booking)
                                  return (
                                      <div
                                        key={booking.id}
                                        onClick={() => handleBookingClick(booking)}
                                        className="flex gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#7A1F1F] hover:shadow-md cursor-pointer transition-all bg-white"
                                      >
                                          <div className="flex flex-col items-center justify-center min-w-[80px] border-r border-gray-100 pr-4">
                                              <span className="text-lg font-bold text-gray-900">{format(parseISO(booking.startTime), "HH:mm")}</span>
                                              <span className="text-xs text-gray-500">{format(parseISO(booking.endTime), "HH:mm")}</span>
                                              <span className="text-xs text-purple-600 font-medium mt-1">{formatDuration(duration)}</span>
                                          </div>
                                          <div className="flex-1">
                                              <div className="flex items-center justify-between mb-2">
                                                  <div className="flex items-center gap-2">
                                                      <h3 className="font-semibold text-gray-900 text-lg">{booking.client.name}</h3>
                                                      {overlapInfo.hasOverlap && (
                                                          <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full">
                                                              <AlertTriangle className="h-3 w-3 text-yellow-600" />
                                                              <span className="text-xs font-medium text-yellow-700">MUA Overlap</span>
                                                          </div>
                                                      )}
                                                  </div>
                                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                                    {booking.status}
                                                  </span>
                                              </div>
                                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                                  <div className="flex items-center gap-1.5">
                                                      <User className="h-4 w-4" />
                                                      <span>{booking.package.name}</span>
                                                  </div>
                                                   <div className="flex items-center gap-1.5">
                                                      <MapPin className="h-4 w-4" />
                                                      <span>Studio 1</span>
                                                  </div>
                                              </div>
                                              {overlapInfo.hasOverlap && (
                                                  <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded-lg mb-2 border border-yellow-100">
                                                      <p className="font-medium mb-1">⚠️ Tumpang tindih jadwal MUA terdeteksi:</p>
                                                      {overlapInfo.muaOverlapsMySession.length > 0 && (
                                                          <p className="ml-4">
                                                              • MUA booking <strong>{overlapInfo.muaOverlapsMySession.map(b => b.client.name).join(', ')}</strong> bertabrakan dengan sesi ini
                                                          </p>
                                                      )}
                                                      {overlapInfo.myMuaOverlapsSessions.length > 0 && (
                                                          <p className="ml-4">
                                                              • MUA sesi ini bertabrakan dengan booking <strong>{overlapInfo.myMuaOverlapsSessions.map(b => b.client.name).join(', ')}</strong>
                                                          </p>
                                                      )}
                                                  </div>
                                              )}
                                              {booking.notes && (
                                                  <p className="text-sm text-gray-500 italic bg-gray-50 p-2 rounded-lg">
                                                      "{booking.notes}"
                                                  </p>
                                              )}
                                          </div>
                                      </div>
                                  )
                             })}
                             
                             {getBookingsForDate(currentDate).length === 0 && (
                                 <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                     <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                     <p className="text-gray-500 font-medium">Tidak ada booking pada tanggal ini</p>
                                     <button 
                                        onClick={() => router.push('/dashboard/bookings/new')}
                                        className="mt-4 text-[#7A1F1F] font-semibold hover:underline"
                                     >
                                         Buat Booking Baru
                                     </button>
                                 </div>
                             )}
                         </div>
                    </div>
                )}
             </>
          )}
      </div>

      {/* Booking Detail Modal */}
      {isModalOpen && selectedBooking && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">Detail Booking</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 space-y-4">
              {/* Client Info */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedBooking.client.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[selectedBooking.status].bg} ${STATUS_COLORS[selectedBooking.status].text} ${STATUS_COLORS[selectedBooking.status].border}`}>
                  {selectedBooking.status}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tanggal</p>
                    <p className="text-sm font-medium text-gray-900">{format(parseISO(selectedBooking.date), "EEEE, d MMMM yyyy", { locale: idLocale })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Jam Sesi</p>
                    <p className="text-sm font-medium text-gray-900">
                      {format(parseISO(selectedBooking.startTime), "HH:mm")} - {format(parseISO(selectedBooking.endTime), "HH:mm")}
                    </p>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Durasi</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <p className="text-sm font-medium text-purple-600">{formatDuration(calculateDuration(selectedBooking))}</p>
                  </div>
                </div>

                {/* Package */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Package</p>
                  <p className="text-sm font-medium text-gray-900">{selectedBooking.package.name}</p>
                </div>

                {/* Number of People */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Jumlah Orang</p>
                  <p className="text-sm font-medium text-gray-900">{selectedBooking.numberOfPeople} orang</p>
                </div>

                {/* Photo For */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Photo For</p>
                  <p className="text-sm font-medium text-gray-900">{selectedBooking.photoFor}</p>
                </div>

                {/* Background */}
                {(selectedBooking as any).bookingBackgrounds && (selectedBooking as any).bookingBackgrounds.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Background</p>
                    <div className="flex flex-wrap gap-2">
                      {(selectedBooking as any).bookingBackgrounds.map((bg: any) => (
                        <span key={bg.id} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                          {bg.background?.name || 'Background'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add-ons */}
                {selectedBooking.addOns && selectedBooking.addOns.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Add-ons</p>
                    <div className="space-y-1">
                      {selectedBooking.addOns.map((addon) => (
                        <div key={addon.id} className="flex justify-between text-xs">
                          <span className="text-gray-700">{addon.itemName} x{addon.quantity}</span>
                          <span className="text-gray-900 font-medium">Rp {addon.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* BTS */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">BTS (Behind The Scenes)</p>
                  <p className="text-sm font-medium text-gray-900">{selectedBooking.bts ? "Ya" : "Tidak"}</p>
                </div>

                {/* Notes */}
                {selectedBooking.notes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Catatan</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg italic">"{selectedBooking.notes}"</p>
                  </div>
                )}

                {/* SESI 12: Photo Status & Google Drive Link - Editable by Photographer/Admin/Owner */}
                {(user?.role === "PHOTOGRAPHER" || user?.role === "ADMIN" || user?.role === "OWNER") && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-blue-900">Update Status Foto & Link</p>
                        {!isEditingModal && (
                          <button
                            onClick={() => setIsEditingModal(true)}
                            className="text-xs text-blue-700 hover:text-blue-900 font-medium"
                          >
                            Edit
                          </button>
                        )}
                      </div>

                      {/* Status Dropdown */}
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Status Booking</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as BookingStatus)}
                          disabled={!isEditingModal}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:bg-gray-100 disabled:text-gray-600"
                        >
                          <option value="BOOKED">BOOKED</option>
                          <option value="PAID">PAID</option>
                          <option value="SHOOT_DONE">SHOOT_DONE</option>
                          <option value="PHOTOS_DELIVERED">PHOTOS_DELIVERED</option>
                          <option value="CLOSED">CLOSED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>

                      {/* Google Drive Link Input */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Link Google Drive <span className="text-gray-500">(opsional)</span>
                        </label>
                        <input
                          type="url"
                          value={editPhotoLink}
                          onChange={(e) => setEditPhotoLink(e.target.value)}
                          disabled={!isEditingModal}
                          placeholder="https://drive.google.com/..."
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:bg-gray-100 disabled:text-gray-600"
                        />
                        {editPhotoLink && !isEditingModal && (
                          <a
                            href={editPhotoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                          >
                            Buka Link →
                          </a>
                        )}
                      </div>

                      {/* Save/Cancel buttons when editing */}
                      {isEditingModal && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-blue-200">
                          <button
                            onClick={() => {
                              setIsEditingModal(false)
                              setEditStatus(selectedBooking.status)
                              setEditPhotoLink(selectedBooking.photoLink || "")
                            }}
                            disabled={isSaving}
                            className="flex-1 px-3 py-1.5 text-xs text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleSaveModalChanges}
                            disabled={isSaving}
                            className="flex-1 px-3 py-1.5 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isSaving ? "Menyimpan..." : "Simpan"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  router.push(`/dashboard/bookings/${selectedBooking.id}`)
                  closeModal()
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-[#7A1F1F] rounded-lg hover:bg-[#9B3333] transition-colors"
              >
                Lihat Detail Lengkap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
