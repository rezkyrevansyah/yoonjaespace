"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2,
  User,
  Package,
  Link2,
  Check,
} from "lucide-react"

interface MuaSession {
  id: string
  bookingCode: string
  clientName: string
  clientPhone: string
  sessionDate: string
  muaStartTime: string | null
  sessionStartTime: string
  packageName: string
  muaAddOns: { name: string; quantity: number }[]
  status: string
}

interface MuaScheduleResponse {
  month: string
  schedule: MuaSession[]
}

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  BOOKED: { label: "Booked", color: "bg-blue-100 text-blue-700" },
  PAID: { label: "Paid", color: "bg-green-100 text-green-700" },
  SHOOT_DONE: { label: "Selesai Foto", color: "bg-purple-100 text-purple-700" },
  PHOTOS_DELIVERED: { label: "Foto Dikirim", color: "bg-indigo-100 text-indigo-700" },
  CLOSED: { label: "Closed", color: "bg-gray-100 text-gray-600" },
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false })
}

function formatDayFull(dateStr: string): string {
  const d = new Date(dateStr)
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  return `${days[d.getDay()]}, ${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
}

function groupByDay(sessions: MuaSession[]): Record<string, MuaSession[]> {
  const groups: Record<string, MuaSession[]> = {}
  for (const s of sessions) {
    const key = s.sessionDate.split("T")[0]
    if (!groups[key]) groups[key] = []
    groups[key].push(s)
  }
  return groups
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function MuaCalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-indexed
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    const url = typeof window !== "undefined" ? window.location.origin + "/mua" : "/mua"
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea")
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const monthStr = `${year}-${String(month).padStart(2, "0")}`

  const { data, isLoading } = useSWR<MuaScheduleResponse>(
    `/api/public/mua-schedule?month=${monthStr}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const grouped = useMemo(() => {
    if (!data?.schedule) return {}
    return groupByDay(data.schedule)
  }, [data])

  const sortedDays = useMemo(() => Object.keys(grouped).sort(), [grouped])

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  const today = now.toISOString().split("T")[0]

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          {/* Brand */}
          <div className="text-center mb-4">
            <h1 className="text-lg font-bold text-[#7A1F1F]" style={{ fontFamily: "var(--font-poppins, sans-serif)" }}>
              Yoonjaespace
            </h1>
            <p className="text-xs text-gray-500">Jadwal MUA Studio</p>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="text-center">
              <p className="text-base font-semibold text-gray-900">
                {MONTHS_ID[month - 1]} {year}
              </p>
              <p className="text-xs text-gray-500">
                {data?.schedule?.length ?? 0} sesi MUA
              </p>
            </div>

            <button
              onClick={nextMonth}
              className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-600"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-5 pb-24">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#7A1F1F]" />
            <p className="text-sm text-gray-400">Memuat jadwal...</p>
          </div>
        ) : sortedDays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Tidak ada jadwal MUA</p>
            <p className="text-sm text-gray-400">
              Bulan {MONTHS_ID[month - 1]} {year} tidak memiliki sesi MUA
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDays.map((day) => {
              const sessions = grouped[day]
              const isToday = day === today

              return (
                <div key={day}>
                  {/* Day Header */}
                  <div className={`flex items-center gap-3 mb-3 ${isToday ? "sticky top-[117px] z-[5]" : ""}`}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${
                      isToday ? "bg-[#7A1F1F] text-white" : "bg-gray-200 text-gray-700"
                    }`}>
                      {new Date(day).getDate()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDayFull(day)}
                        {isToday && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-[#F5ECEC] text-[#7A1F1F] rounded-full font-medium">
                            Hari ini
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{sessions.length} sesi</p>
                    </div>
                  </div>

                  {/* Session Cards */}
                  <div className="space-y-3 ml-11">
                    {sessions.map((session) => {
                      const statusInfo = STATUS_MAP[session.status] || { label: session.status, color: "bg-gray-100 text-gray-600" }

                      return (
                        <div
                          key={session.id}
                          className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                        >
                          {/* Top row: booking code + status */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-mono text-xs text-[#7A1F1F] font-semibold">
                              {session.bookingCode}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>

                          {/* Client name */}
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-gray-400 shrink-0" />
                            <p className="text-sm font-semibold text-gray-900">{session.clientName}</p>
                          </div>

                          {/* Package */}
                          <div className="flex items-center gap-2 mb-3">
                            <Package className="h-4 w-4 text-gray-400 shrink-0" />
                            <p className="text-sm text-gray-600">{session.packageName}</p>
                          </div>

                          {/* Time row */}
                          <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                            {session.muaStartTime && (
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-pink-400 shrink-0" />
                                <div>
                                  <p className="text-xs text-gray-400">MUA Start</p>
                                  <p className="text-sm font-bold text-pink-600">{formatTime(session.muaStartTime)}</p>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-[#7A1F1F] shrink-0" />
                              <div>
                                <p className="text-xs text-gray-400">Sesi Mulai</p>
                                <p className="text-sm font-bold text-[#7A1F1F]">{formatTime(session.sessionStartTime)}</p>
                              </div>
                            </div>
                          </div>

                          {/* MUA Add-ons */}
                          {session.muaAddOns.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="flex flex-wrap gap-1.5">
                                {session.muaAddOns.map((addon, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 text-xs border border-pink-200"
                                  >
                                    {addon.name}{addon.quantity > 1 ? ` ×${addon.quantity}` : ""}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">© Yoonjaespace Studio • Real-time</p>
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              copied
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-[#F5ECEC] text-[#7A1F1F] border border-[#e8c5c5] hover:bg-[#ecdada] active:scale-95"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Link disalin!
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5" />
                Salin Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
