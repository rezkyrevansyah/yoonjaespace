"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  bookings: "Bookings",
  new: "Buat Baru",
  calendar: "Calendar",
  clients: "Clients",
  reminders: "Reminders",
  finance: "Finance",
  commissions: "Commissions",
  settings: "Settings",
  users: "Users",
  invoices: "Invoices",
}

export function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  // Build breadcrumb items
  const items = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    const label = labelMap[segment] || segment
    const isLast = index === segments.length - 1

    return { href, label, isLast, isId: segment.startsWith("[") || /^[a-zA-Z0-9-]{8,}$/.test(segment) }
  })

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      <Link
        href="/dashboard"
        className="text-[#9CA3AF] hover:text-[#111827] transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => {
        if (index === 0 && item.label === "Dashboard") return null

        return (
          <div key={item.href} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-[#D1D5DB]" />
            {item.isLast ? (
              <span className="font-medium text-[#111827]">
                {item.isId ? "Detail" : item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-[#9CA3AF] hover:text-[#111827] transition-colors"
              >
                {item.isId ? "Detail" : item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
