"use client"

import { AuthProvider } from "@/lib/hooks/use-auth"
import { ToastProvider } from "@/lib/hooks/use-toast"

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  )
}
