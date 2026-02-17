"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { SIDEBAR_MENU } from "@/lib/constants"

import { getInitials } from "@/lib/utils"
import { useAuth } from "@/lib/hooks/use-auth"
import { useReminderCount } from "@/lib/hooks/use-reminder-count"
import { USER_ROLE_MAP } from "@/lib/constants"
import {
  LayoutDashboard,
  CalendarCheck,
  Calendar,
  Users,
  Bell,
  Wallet,
  Award,
  Settings,
  ShieldCheck,
  LogOut,
  X,
  Activity,
} from "lucide-react"

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  CalendarCheck,
  Calendar,
  Users,
  Bell,
  Wallet,
  Award,
  Settings,
  ShieldCheck,
  Activity,
}

interface SidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { count: reminderCount } = useReminderCount()

  const handleLogout = async () => {
    await logout()
    onClose?.()
    router.push("/login")
  }

  const handleLinkClick = () => {
    // Close mobile sidebar when link is clicked
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-[#E5E7EB] flex flex-col transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:z-30",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo / Branding */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#E5E7EB]">
          {/* Close button - Mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 -ml-2 rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-md">
              <Image
                src="/logo_yoonjae.png"
                alt="Yoonjaespace Logo"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            <div>
              <h1
                className="text-lg font-bold text-[#7A1F1F] leading-tight"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Yoonjaespace
              </h1>
              <p className="text-xs text-[#9CA3AF]">Studio Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {SIDEBAR_MENU.filter((item) =>
              user?.role && item.roles.includes(user.role as any)
            ).map((item) => {
              const Icon = iconMap[item.icon]
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href)

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[#F5ECEC] text-[#7A1F1F]"
                        : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]"
                    )}
                  >
                    {/* Left Border Indicator for Active State */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-[#7A1F1F] rounded-r-full" />
                    )}

                    {Icon && (
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          isActive ? "text-[#7A1F1F]" : "text-[#9CA3AF]"
                        )}
                      />
                    )}
                    <span style={{ fontFamily: "var(--font-poppins)" }}>
                      {item.label}
                    </span>

                    {item.href === "/dashboard/reminders" && reminderCount > 0 ? (
                      <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#7A1F1F] text-[10px] font-semibold text-white">
                        {reminderCount}
                      </span>
                    ) : null}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Profile Card */}
        <div className="border-t border-[#E5E7EB] p-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F5ECEC] text-[#7A1F1F] text-sm font-semibold shrink-0">
              {getInitials(user?.name || "User")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#111827] truncate">
                {user?.name || "User"}
              </p>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F5ECEC] mt-1">
                <span className="text-[10px] font-semibold text-[#7A1F1F] uppercase">
                  {user?.role ? USER_ROLE_MAP[user.role]?.label : "Staff"}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#DC2626] hover:bg-red-50 transition-colors shrink-0"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
