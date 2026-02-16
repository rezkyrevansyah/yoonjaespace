"use client"

import { ReactNode, useState } from "react"
import { cn } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
  onConfirm: () => void | Promise<void>
  children?: ReactNode
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!open) return null

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
    } finally {
      setIsLoading(false)
      onOpenChange(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-md rounded-xl bg-white p-6 shadow-lg mx-4">
        <div className="flex items-start gap-4">
          {variant === "destructive" && (
            <div className="rounded-full bg-red-50 p-2 shrink-0">
              <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
            </div>
          )}
          <div className="space-y-2 flex-1">
            <h3 className="text-lg font-semibold text-[#111827]">{title}</h3>
            {description && <p className="text-sm text-[#6B7280]">{description}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-[#6B7280] rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors"
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50",
              variant === "destructive"
                ? "bg-[#DC2626] hover:bg-[#B91C1C]"
                : "bg-[#7A1F1F] hover:bg-[#9B3333]"
            )}
          >
            {isLoading ? "Loading..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
