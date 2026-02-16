"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  Camera,
  Clock,
  type LucideIcon,
} from "lucide-react"
import { ReactNode } from "react"

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  Camera,
  Clock,
}

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: string
  iconNode?: ReactNode
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  iconNode,
  className,
}: StatCardProps) {
  const IconComponent = icon ? iconMap[icon] : null
  const isPositive = change !== undefined && change >= 0

  return (
    <div
      className={cn(
        "rounded-xl border border-[#E5E7EB] bg-white p-5 transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#6B7280]">{title}</p>
          <p className="text-2xl font-semibold text-[#111827]">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-[#059669]" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-[#DC2626]" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  isPositive ? "text-[#059669]" : "text-[#DC2626]"
                )}
              >
                {isPositive ? "+" : ""}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-[#9CA3AF]">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className="rounded-lg bg-[#F5ECEC] p-2.5">
          {iconNode ? (
            iconNode
          ) : IconComponent ? (
            <IconComponent className="h-5 w-5 text-[#7A1F1F]" />
          ) : null}
        </div>
      </div>
    </div>
  )
}
