"use client"

import { cn } from "@/lib/utils"
import type { BookingStatus, PaymentStatus } from "@/lib/types"
import { BOOKING_STATUS_MAP, PAYMENT_STATUS_MAP } from "@/lib/constants"

interface StatusBadgeProps {
  status: BookingStatus | PaymentStatus
  type?: "booking" | "payment"
  size?: "sm" | "md"
  className?: string
}

export function StatusBadge({
  status,
  type = "booking",
  size = "sm",
  className,
}: StatusBadgeProps) {
  const statusMap = type === "booking" ? BOOKING_STATUS_MAP : PAYMENT_STATUS_MAP
  const config = statusMap[status as keyof typeof statusMap]

  if (!config) return null

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className
      )}
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
      }}
    >
      {config.label}
    </span>
  )
}
