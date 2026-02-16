"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { MOBILE_NAV_ITEMS, MOBILE_MORE_ITEMS } from "@/lib/constants"
import { useAuth } from "@/lib/hooks/use-auth"
import {
  LayoutDashboard,
  CalendarCheck,
  Calendar,
  Wallet,
  Menu,
  Users,
  Bell,
  Award,
  Settings,
  ShieldCheck,
  LogOut,
  X,
} from "lucide-react"

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  CalendarCheck,
  Calendar,
  Wallet,
  Menu,
  Users,
  Bell,
  Award,
  Settings,
  ShieldCheck,
  LogOut,
}

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const [showMore, setShowMore] = useState(false)

  const handleLogout = async () => {
    await logout()
    setShowMore(false)
    router.push("/login")
  }

  return (
    <>
      {/* More Menu Sheet */}
      {showMore && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowMore(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 pb-8 z-50 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#111827]">Menu Lainnya</h3>
              <button
                onClick={() => setShowMore(false)}
                className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F9FAFB]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {MOBILE_MORE_ITEMS.map((item) => {
                const Icon = iconMap[item.icon]
                const isLogout = item.href === "#logout"
                const isActive = !isLogout && pathname.startsWith(item.href)

                if (isLogout) {
                  return (
                    <button
                      key="logout"
                      onClick={handleLogout}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl transition-colors text-[#DC2626] hover:bg-red-50"
                    >
                      {Icon && <Icon className="h-5 w-5" />}
                      <span className="text-xs font-medium">{item.label}</span>
                    </button>
                  )
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl transition-colors",
                      isActive
                        ? "bg-[#F5ECEC] text-[#7A1F1F]"
                        : "text-[#6B7280] hover:bg-[#F9FAFB]"
                    )}
                  >
                    {Icon && <Icon className="h-5 w-5" />}
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon]
            const isMore = item.href === "#more"
            const isActive = isMore
              ? false
              : item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)

            if (isMore) {
              return (
                <button
                  key="more"
                  onClick={() => setShowMore(true)}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-[#6B7280]"
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                  isActive
                    ? "text-[#7A1F1F]"
                    : "text-[#6B7280]"
                )}
              >
                {Icon && (
                  <Icon
                    className={cn("h-5 w-5", isActive && "text-[#7A1F1F]")}
                  />
                )}
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isActive && "text-[#7A1F1F]"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
