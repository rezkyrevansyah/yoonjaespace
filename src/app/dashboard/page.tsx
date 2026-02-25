"use client"

import Link from "next/link"
import { StatusBadge } from "@/components/shared/status-badge"
import { useAuth } from "@/lib/hooks/use-auth"
import { useDashboard } from "@/lib/hooks/use-dashboard"
import {
  CalendarClock,
  Clock,
  Truck,
  Package as PackageIcon,
  Send,
  CalendarCheck,
  Plus,
  ArrowRight,
  CalendarDays,
  CalendarX,
  CheckCircle,
  AlertCircle,
  Calendar,
  Bell
} from "lucide-react"

// ─── Skeleton Components ─────────────────────────────────────────────────────

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-[#E5E7EB] rounded ${className ?? ""}`}
    />
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner Skeleton */}
      <div>
        <SkeletonPulse className="h-7 w-64 mb-2" />
        <SkeletonPulse className="h-4 w-40" />
      </div>

      {/* Quick Menu Skeleton */}
      <div>
        <SkeletonPulse className="h-5 w-24 mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
              <div className="flex flex-col items-center space-y-2">
                <SkeletonPulse className="w-12 h-12 rounded-xl" />
                <SkeletonPulse className="h-4 w-20" />
                <SkeletonPulse className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Skeleton */}
      <div>
        <SkeletonPulse className="h-5 w-36 mb-3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <SkeletonPulse className="h-4 w-28" />
                  <SkeletonPulse className="h-9 w-16" />
                  <SkeletonPulse className="h-3 w-24" />
                </div>
                <SkeletonPulse className="w-12 h-12 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Items Skeleton */}
      <div>
        <SkeletonPulse className="h-5 w-24 mb-3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
              <SkeletonPulse className="h-6 w-6 mb-2" />
              <SkeletonPulse className="h-8 w-10 mb-1" />
              <SkeletonPulse className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Skeleton */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
        <div className="flex items-center gap-2 mb-4">
          <SkeletonPulse className="h-5 w-5 rounded" />
          <SkeletonPulse className="h-5 w-32" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-[#E5E7EB]">
              <SkeletonPulse className="h-9 w-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <SkeletonPulse className="h-4 w-36" />
                <SkeletonPulse className="h-3 w-24" />
              </div>
              <SkeletonPulse className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const { data, error } = useDashboard()

  // Get today's date
  const today = new Date()
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ]
  const todayFormatted = `${dayNames[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`

  // Show skeleton while auth or data is loading — NOT a full-screen spinner
  if (isAuthLoading || !data) {
    if (error) {
      return (
        <div className="flex h-[50vh] flex-col items-center justify-center text-red-500">
          <AlertCircle className="h-10 w-10 mb-2" />
          <p>Gagal memuat data dashboard</p>
          <p className="text-sm text-gray-500 mt-1">{error?.message || String(error)}</p>
        </div>
      )
    }
    return <DashboardSkeleton />
  }

  // Action items stats
  const actionItems = [
    {
      label: "Waiting Selection",
      count: data.actionItems.waitingClientSelection,
      icon: Clock,
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
      iconColor: "text-yellow-600",
      href: "/dashboard/bookings?status=SHOOT_DONE",
    },
    {
      label: "At Vendor",
      count: data.actionItems.sentToVendor,
      icon: Truck,
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      iconColor: "text-blue-600",
      href: "/dashboard/bookings?printStatus=VENDOR",
    },
    {
      label: "Need Packaging",
      count: data.actionItems.needPackaging,
      icon: PackageIcon,
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      iconColor: "text-purple-600",
      href: "/dashboard/bookings?printStatus=PACKAGING",
    },
    {
      label: "Need Shipping",
      count: data.actionItems.needShipping,
      icon: Send,
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      iconColor: "text-green-600",
      href: "/dashboard/bookings?printStatus=SHIPPING",
    },
  ]

  // Quick Menu items
  const quickMenuItems = [
    {
      label: "Buat Booking Baru",
      icon: Plus,
      href: "/dashboard/bookings?action=add",
      bgColor: "bg-[#7A1F1F]",
      textColor: "text-white",
      iconColor: "text-white",
      description: "Tambah booking klien baru"
    },
    {
      label: "Lihat Booking",
      icon: CalendarCheck,
      href: "/dashboard/bookings",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      iconColor: "text-blue-600",
      description: "Kelola semua booking"
    },
    {
      label: "Lihat Kalender",
      icon: Calendar,
      href: "/dashboard/calendar",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      iconColor: "text-purple-600",
      description: "Jadwal foto hari ini"
    },
    {
      label: "Lihat Reminder",
      icon: Bell,
      href: "/dashboard/reminders",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
      iconColor: "text-orange-600",
      description: "Notifikasi & pengingat"
    },
  ]

  return (
    <div className="space-y-6">
      {/* Section A: Welcome Banner */}
      <div>
        <h1 className="text-xl lg:text-2xl font-semibold text-[#111827]">
          Selamat datang, {user?.name || 'User'}! 👋
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">{todayFormatted}</p>
      </div>

      {/* Quick Menu */}
      <div>
        <h2 className="text-base font-semibold text-[#111827] mb-3">Menu Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {quickMenuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group bg-white rounded-xl border border-[#E5E7EB] p-4 hover:shadow-lg hover:border-[#7A1F1F]/20 transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${item.textColor === 'text-white' ? 'text-[#111827]' : item.textColor}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Section B: Monthly Stats */}
      <div>
        <h2 className="text-base font-semibold text-[#111827] mb-3">Statistik Bulan Ini</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Bookings */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#6B7280] mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-[#111827]">
                  {data.monthlyStats.totalBookings}
                </p>
                <p className="text-xs text-[#059669] mt-1">Bulan ini</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#F5ECEC] flex items-center justify-center">
                <CalendarCheck className="h-6 w-6 text-[#7A1F1F]" />
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#6B7280] mb-1">Estimasi Revenue</p>
                <p className="text-3xl font-bold text-[#1D4ED8]">
                  Rp {(data.monthlyStats.revenue / 1000000).toFixed(1)}jt
                </p>
                <p className="text-xs text-[#1D4ED8] mt-1">Bulan ini</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-[#1D4ED8]" />
              </div>
            </div>
          </div>

          {/* Unpaid */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#6B7280] mb-1">Belum Lunas</p>
                <p className="text-3xl font-bold text-[#DC2626]">
                  {data.monthlyStats.unpaidBookings}
                </p>
                <p className="text-xs text-[#6B7280] mt-1">Bookings belum lunas</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <CalendarX className="h-6 w-6 text-[#DC2626]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section C: Action Items */}
      <div>
        <h2 className="text-base font-semibold text-[#111827] mb-3">Action Items</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {actionItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`block ${item.bgColor} rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer border border-transparent`}
              >
                <div className="flex flex-col">
                  <Icon className={`h-6 w-6 ${item.iconColor} mb-2`} />
                  <p className={`text-2xl font-bold ${item.textColor}`}>{item.count}</p>
                  <p className="text-sm text-[#6B7280] mt-1">{item.label}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Section D: Today's Schedule */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock className="h-5 w-5 text-[#7A1F1F]" />
          <h2 className="text-base font-semibold text-[#111827]">Jadwal Hari Ini</h2>
        </div>

        {data.todaySchedule.length > 0 ? (
          <div className="space-y-3">
            {data.todaySchedule.map((booking) => (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.id}`}
                className="flex items-center gap-4 p-4 rounded-lg border border-[#E5E7EB] hover:shadow-sm hover:border-[#7A1F1F]/20 transition-all"
              >
                {/* Time */}
                <div className="shrink-0">
                  <div className="px-3 py-1.5 rounded-lg bg-[#F5ECEC] text-[#7A1F1F] text-sm font-semibold">
                    {booking.sessionTime}
                  </div>
                </div>

                {/* Client Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#111827] truncate">{booking.client.name}</p>
                  <p className="text-sm text-[#6B7280] truncate">{booking.package.name}</p>
                </div>

                {/* Status */}
                <div className="shrink-0">
                  <StatusBadge status={booking.status} size="sm" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="h-16 w-16 text-[#D1D5DB] mb-4" />
            <p className="text-[#6B7280] font-medium">Tidak ada sesi hari ini</p>
            <p className="text-sm text-[#9CA3AF] mt-1">Nikmati hari istirahat Anda!</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
          <Link
            href="/dashboard/calendar"
            className="flex items-center justify-center gap-1 text-sm text-[#7A1F1F] hover:text-[#9B3333] font-medium transition-colors"
          >
            <span>Lihat Calendar</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
