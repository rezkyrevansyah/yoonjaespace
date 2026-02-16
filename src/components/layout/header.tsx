"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/utils"
import { mockCurrentUser } from "@/lib/mock-data"
import { USER_ROLE_MAP } from "@/lib/constants"
import { Breadcrumb } from "./breadcrumb"
import { Bell, Search, Menu } from "lucide-react"

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()

  const getPageTitle = () => {
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length <= 1) return "Dashboard"
    const lastSegment = segments[segments.length - 1]
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
  }

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-[#E5E7EB] h-16">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Hamburger (Mobile) + Breadcrumb (Desktop) */}
        <div className="flex items-center gap-3">
          {/* Hamburger Menu - Mobile only */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827] transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Title (Mobile) / Breadcrumb (Desktop) */}
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-[#111827] lg:hidden">
              {getPageTitle()}
            </h2>
            <div className="hidden lg:block">
              <Breadcrumb />
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button className="p-2 rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827] transition-colors">
            <Search className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827] transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC2626] rounded-full"></span>
          </button>

          {/* User Avatar (desktop) */}
          <div className="hidden lg:flex items-center gap-2 ml-2 pl-3 border-l border-[#E5E7EB]">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F5ECEC] text-[#7A1F1F] text-xs font-semibold">
              {getInitials(mockCurrentUser.name)}
            </div>
            <div className="hidden xl:block">
              <p className="text-sm font-medium text-[#111827] leading-tight">
                {mockCurrentUser.name}
              </p>
              <p className="text-[11px] text-[#9CA3AF]">
                {USER_ROLE_MAP[mockCurrentUser.role].label}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
