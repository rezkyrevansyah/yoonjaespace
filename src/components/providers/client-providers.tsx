"use client"

import { AuthProvider } from "@/lib/hooks/use-auth"
import { ToastProvider } from "@/lib/hooks/use-toast"
import { SWRProvider } from "@/components/providers/swr-provider"

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </SWRProvider>
  )
}
