"use client"

import * as React from "react"
import { Calendar } from "lucide-react"

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Calendar className="h-4 w-4 text-[#9CA3AF]" />
        </div>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="pl-10 pr-3 py-2 h-10 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] transition-all w-[140px]"
          placeholder="Start Date"
        />
      </div>
      <span className="text-[#9CA3AF] text-sm hidden sm:inline">-</span>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Calendar className="h-4 w-4 text-[#9CA3AF]" />
        </div>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          min={startDate}
          className="pl-10 pr-3 py-2 h-10 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] transition-all w-[140px]"
          placeholder="End Date"
        />
      </div>
    </div>
  )
}
