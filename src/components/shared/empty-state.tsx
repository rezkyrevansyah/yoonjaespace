"use client"

import { cn } from "@/lib/utils"
import { Inbox, type LucideIcon } from "lucide-react"
import { ReactNode } from "react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      <div className="rounded-full bg-[#F5ECEC] p-4 mb-4">
        <Icon className="h-8 w-8 text-[#7A1F1F]" />
      </div>
      <h3 className="text-lg font-medium text-[#111827] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#6B7280] max-w-sm mb-4">{description}</p>
      )}
      {children}
    </div>
  )
}
