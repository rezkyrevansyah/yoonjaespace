import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/utils"
import { useAuth } from "@/lib/hooks/use-auth"
import { useActivities } from "@/lib/hooks/use-activities"
import { USER_ROLE_MAP } from "@/lib/constants"
import { Breadcrumb } from "./breadcrumb"
import { Bell, Search, Menu, X, Loader2 } from "lucide-react"
import { ActivityLogItem } from "@/components/shared/activity-log-item"

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { activities, isLoading: isActivitiesLoading } = useActivities(5)
  const [showActivities, setShowActivities] = useState(false)
  const activityRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activityRef.current && !activityRef.current.contains(event.target as Node)) {
        setShowActivities(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const getPageTitle = () => {
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length <= 1) return "Dashboard"
    const lastSegment = segments[segments.length - 1]
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
  }

  // Get today's activities (already limited to 5 by hook params for dropdown)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todaysActivities = activities.filter((activity) => {
    const activityDate = new Date(activity.timestamp)
    activityDate.setHours(0, 0, 0, 0)
    return activityDate.getTime() === today.getTime()
  })

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E5E7EB] h-16">
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

          {/* Notifications / Activity Log */}
          <div className="relative" ref={activityRef}>
            <button 
              onClick={() => setShowActivities(!showActivities)}
              className={cn(
                "relative p-2 rounded-lg transition-colors",
                showActivities ? "bg-[#F9FAFB] text-[#111827]" : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]"
              )}
            >
              <Bell className="h-5 w-5" />
              {todaysActivities.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC2626] rounded-full"></span>
              )}
            </button>

            {/* Dropdown */}
            {showActivities && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-[#E5E7EB] overflow-hidden z-50">
                <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
                  <h3 className="font-semibold text-[#111827]">Aktivitas Hari Ini</h3>
                  <button 
                    onClick={() => setShowActivities(false)}
                    className="text-[#9CA3AF] hover:text-[#6B7280]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="max-h-[320px] overflow-y-auto">
                  {isActivitiesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : todaysActivities.length > 0 ? (
                    <div className="divide-y divide-[#E5E7EB]">
                      {todaysActivities.map((activity) => (
                        <div key={activity.id} className="px-4 hover:bg-[#F9FAFB] transition-colors">
                          <ActivityLogItem activity={activity} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-[#6B7280]">
                      <p className="text-sm">Belum ada aktivitas hari ini</p>
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-[#E5E7EB] bg-[#F9FAFB]">
                  <Link 
                    href="/dashboard/activities" 
                    className="flex justify-center w-full text-sm font-medium text-[#7A1F1F] hover:text-[#9B3333]"
                    onClick={() => setShowActivities(false)}
                  >
                    Lihat Semua Aktivitas
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Avatar (desktop) */}
          <div className="hidden lg:flex items-center gap-2 ml-2 pl-3 border-l border-[#E5E7EB]">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F5ECEC] text-[#7A1F1F] text-xs font-semibold">
              {getInitials(user?.name || "User")}
            </div>
            <div className="hidden xl:block">
              <p className="text-sm font-medium text-[#111827] leading-tight">
                {user?.name || "User"}
              </p>
              <p className="text-[11px] text-[#9CA3AF]">
                {user?.role ? USER_ROLE_MAP[user.role].label : "Staff"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
