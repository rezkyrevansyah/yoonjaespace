"use client"

import { useEffect } from "react"
import { AuthProvider } from "@/lib/hooks/use-auth"
import { ToastProvider } from "@/lib/hooks/use-toast"
import { SWRProvider } from "@/components/providers/swr-provider"

function useServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration failed:', err)
      })
    }
  }, [])
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  useServiceWorkerRegistration()

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
