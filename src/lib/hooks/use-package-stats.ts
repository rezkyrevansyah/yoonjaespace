"use client"

import useSWR from '@/lib/hooks/use-swr-shim'
import { fetcher } from '@/lib/api-client'

export interface PackageStatItem {
  packageId: string
  packageName: string
  bookingCount: number
  totalRevenue: number
}

export interface PackageStatsResponse {
  month: string
  stats: PackageStatItem[]
}

export function usePackageStats(month?: string) {
  const url = month ? `/api/finance/package-stats?month=${month}` : null

  const { data, error, isLoading, mutate } = useSWR<PackageStatsResponse>(url, fetcher, {
    refreshInterval: 60000, // Refresh every minute
  })

  return {
    packageStats: data,
    stats: data?.stats || [],
    isLoading,
    isError: error,
    refresh: mutate,
  }
}
