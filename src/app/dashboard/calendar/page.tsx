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
  Loader2
} from "lucide-react"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO, startOfWeek, endOfWeek, addDays, addMinutes } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useBookings } from "@/lib/hooks/use-bookings"
import { Booking, BookingStatus } from "@/lib/types"

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
  { label: "Month", value: "month" },
  { label: "Week", value: "week" },
  { label: "Day", value: "day" }
]

export default function CalendarPage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState("month") // month, week, day

  // Format month for API query (YYYY-MM)
  const queryMonth = useMemo(() => format(currentDate, "yyyy-MM"), [currentDate])

  const { bookings, isLoading } = useBookings({ month: queryMonth })

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
          {isLoading ? (
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
                                        {dayBookings.map(booking => {
                                            const statusStyle = STATUS_COLORS[booking.status] || STATUS_COLORS.BOOKED
                                            return (
                                                <button
                                                    key={booking.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        router.push(`/dashboard/bookings/${booking.id}`)
                                                    }}
                                                    className={`w-full text-left px-2 py-1 rounded text-xs font-medium truncate border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} hover:brightness-95 transition-all`}
                                                >
                                                    {format(parseISO(booking.startTime), "HH:mm")} {booking.client.name}
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
                                                return (
                                                    <div
                                                        key={booking.id}
                                                        onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                                                        className={`p-2 rounded-lg border ${statusStyle.bg} ${statusStyle.border} cursor-pointer hover:shadow-sm transition-all`}
                                                    >
                                                            {format(parseISO(booking.startTime), "HH:mm")} - {format(addMinutes(parseISO(booking.startTime), booking.package.duration), "HH:mm")}
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
                                  return (
                                      <div 
                                        key={booking.id}
                                        onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                                        className="flex gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#7A1F1F] hover:shadow-md cursor-pointer transition-all bg-white"
                                      >
                                          <div className="flex flex-col items-center justify-center min-w-[80px] border-r border-gray-100 pr-4">
                                              <span className="text-lg font-bold text-gray-900">{format(parseISO(booking.startTime), "HH:mm")}</span>
                                              <span className="text-xs text-gray-500">{format(addMinutes(parseISO(booking.startTime), booking.package.duration), "HH:mm")}</span>
                                          </div>
                                          <div className="flex-1">
                                              <div className="flex items-center justify-between mb-2">
                                                  <h3 className="font-semibold text-gray-900 text-lg">{booking.client.name}</h3>
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
    </div>
  )
}
