"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, User, Phone, Package, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDate, formatTime } from "@/lib/utils"
import Image from "next/image"

interface MUAScheduleItem {
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

export default function MUASchedulePage() {
  const [schedule, setSchedule] = useState<MUAScheduleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    fetchSchedule()
  }, [currentMonth])

  const fetchSchedule = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/public/mua-schedule?month=${currentMonth}`)
      const data = await res.json()
      setSchedule(data.schedule || [])
    } catch (error) {
      console.error('Error fetching MUA schedule:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number)
    const prevDate = new Date(year, month - 2, 1)
    setCurrentMonth(`${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`)
  }

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number)
    const nextDate = new Date(year, month, 1)
    setCurrentMonth(`${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`)
  }

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number)
    const date = new Date(year, month - 1, 1)
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }

  // Group by date
  const scheduleByDate: Record<string, MUAScheduleItem[]> = {}
  schedule.forEach((item) => {
    const dateKey = item.sessionDate.split('T')[0]
    if (!scheduleByDate[dateKey]) {
      scheduleByDate[dateKey] = []
    }
    scheduleByDate[dateKey].push(item)
  })

  const sortedDates = Object.keys(scheduleByDate).sort()

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-2">
            <Image
              src="/logo_yoonjae.png"
              alt="Yoonjaespace"
              width={50}
              height={50}
              className="object-contain"
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#7A1F1F]">MUA Schedule</h1>
              <p className="text-sm text-gray-500 mt-0.5">Jadwal MUA Yoonjaespace Studio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="max-w-5xl mx-auto p-6 sm:p-8">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">{getMonthName(currentMonth)}</h2>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Schedule List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading schedule...</div>
        ) : sortedDates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Tidak ada jadwal MUA untuk bulan ini</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateKey) => {
              const items = scheduleByDate[dateKey]
              const dateObj = new Date(dateKey)
              const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' })
              const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

              return (
                <div key={dateKey} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-[#7A1F1F] to-[#9B3333] p-4">
                    <div className="flex items-center gap-3 text-white">
                      <Calendar className="h-5 w-5" />
                      <div>
                        <p className="font-semibold">{dayName}</p>
                        <p className="text-sm opacity-90">{dateStr}</p>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <div key={item.id} className="p-5 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-[#7A1F1F]" />
                            <div>
                              <p className="font-bold text-lg text-gray-900">
                                {item.muaStartTime ? formatTime(item.muaStartTime) : formatTime(item.sessionStartTime)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.muaStartTime ? 'MUA Start Time' : 'Session Start (estimate MUA 1h before)'}
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            {item.bookingCode}
                          </span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{item.clientName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{item.clientPhone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700 sm:col-span-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span>{item.packageName}</span>
                          </div>
                        </div>

                        {item.muaAddOns.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">MUA Services:</p>
                            <div className="flex flex-wrap gap-2">
                              {item.muaAddOns.map((addon, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-pink-50 text-pink-700 text-xs font-medium rounded-full"
                                >
                                  {addon.name} {addon.quantity > 1 && `(${addon.quantity}x)`}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto p-6 sm:p-8 text-center text-sm text-gray-500">
        <p>Yoonjaespace Studio • MUA Schedule Calendar</p>
        <p className="mt-1">Jadwal ini hanya menampilkan booking dengan add-on MUA</p>
      </div>
    </div>
  )
}
