"use client"

import { mockActivities } from "@/lib/mock-data"
import { ActivityLogItem } from "@/components/shared/activity-log-item"
import { CalendarDays } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function ActivitiesPage() {
  // Get today's activities
  const today = new Date().toISOString().split("T")[0]
  const todaysActivities = mockActivities.filter(
    (activity) => activity.timestamp.startsWith(today)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Aktivitas Hari Ini</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          {formatDate(new Date(), "EEEE, dd MMMM yyyy")}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        {todaysActivities.length > 0 ? (
          <div className="divide-y divide-[#E5E7EB]">
            {todaysActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-2 hover:bg-[#F9FAFB] transition-colors">
                <ActivityLogItem activity={activity} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center mb-4">
              <CalendarDays className="h-8 w-8 text-[#9CA3AF]" />
            </div>
            <h3 className="text-lg font-medium text-[#111827]">Belum ada aktivitas</h3>
            <p className="text-[#6B7280] mt-1 max-w-sm">
              Semua aktivitas yang dilakukan hari ini akan muncul di sini. Log akan di-reset setiap hari pukul 00:00.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
