"use client"

import { SWRConfig } from 'swr'
import { swrConfig } from '@/lib/swr-config'
import { ReactNode } from 'react'

interface SWRProviderProps {
  children: ReactNode
}

/**
 * Global SWR Provider with optimized caching configuration
 *
 * This provider wraps the entire app to enable:
 * - Global cache sharing across components
 * - Optimized revalidation strategy
 * - Better performance with deduplication
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  )
}
