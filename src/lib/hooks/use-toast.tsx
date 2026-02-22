"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react"

type ToastType = "success" | "error" | "warning" | "info"
type ToastVariant = ToastType // Alias for compatibility

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastOptions {
  title?: string
  description: string
  variant?: ToastVariant
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  showToast: (messageOrOptions: string | ToastOptions, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (messageOrOptions: string | ToastOptions, type: ToastType = "info", duration: number = 4000) => {
      const id = Math.random().toString(36).substring(2, 9)

      let toast: Toast

      // Support both old (string) and new (object) formats
      if (typeof messageOrOptions === 'string') {
        // Old format: showToast(message, type, duration)
        toast = { id, type, message: messageOrOptions, duration }
      } else {
        // New format: showToast({ title, description, variant, duration })
        const { title, description, variant, duration: optDuration } = messageOrOptions
        const message = title ? `${title}: ${description}` : description
        toast = {
          id,
          type: variant || type,
          message,
          duration: optDuration !== undefined ? optDuration : duration
        }
      }

      setToasts((prev) => [...prev, toast])

      if (toast.duration && toast.duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, toast.duration)
      }
    },
    [removeToast]
  )

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[]
  removeToast: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const config = {
    success: {
      icon: CheckCircle,
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
      textColor: "text-green-800",
    },
    error: {
      icon: XCircle,
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      iconColor: "text-red-600",
      textColor: "text-red-800",
    },
    warning: {
      icon: AlertTriangle,
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      iconColor: "text-yellow-600",
      textColor: "text-yellow-800",
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      textColor: "text-blue-800",
    },
  }

  const { icon: Icon, bgColor, borderColor, iconColor, textColor } = config[toast.type]

  return (
    <div
      className={`${bgColor} ${borderColor} ${textColor} border rounded-xl shadow-lg p-4 pr-10 min-w-[320px] max-w-md pointer-events-auto animate-slideInRight`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <p className="text-sm font-medium flex-1 leading-relaxed">{toast.message}</p>
        <button
          onClick={onClose}
          className={`${iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}
