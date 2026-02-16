"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface MobileCardProps {
  children: ReactNode
  onClick?: () => void
  className?: string
}

export function MobileCard({ children, onClick, className }: MobileCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border border-[#E5E7EB] bg-white p-4 transition-shadow",
        onClick && "cursor-pointer hover:shadow-md active:bg-[#F9FAFB]",
        className
      )}
    >
      {children}
    </div>
  )
}

interface MobileCardRowProps {
  label: string
  value: ReactNode
  className?: string
}

export function MobileCardRow({ label, value, className }: MobileCardRowProps) {
  return (
    <div className={cn("flex items-center justify-between py-1", className)}>
      <span className="text-xs text-[#6B7280]">{label}</span>
      <span className="text-sm font-medium text-[#111827]">{value}</span>
    </div>
  )
}
