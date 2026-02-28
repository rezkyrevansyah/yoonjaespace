"use client"

import { SWRConfig } from 'swr'
import { swrConfig } from '@/lib/swr-config'
import { localStorageCacheProvider } from '@/lib/swr-cache-provider'
import { ReactNode } from 'react'

interface SWRProviderProps {
  children: ReactNode
}

/**
 * Global SWR Provider with localStorage cache persistence
 *
 * Cache di-persist ke localStorage sehingga saat app dibuka ulang:
 * - Data cached langsung tersedia (sinkron, sebelum render pertama)
 * - SWR revalidate di background → data segar replace seamlessly
 * - Zero loading feel pada re-open app
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig value={{
      ...swrConfig,
      provider: localStorageCacheProvider,
    }}>
      {children}
    </SWRConfig>
  )
}
