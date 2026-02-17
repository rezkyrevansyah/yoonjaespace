"use client"

import useSWR from '@/lib/hooks/use-swr-shim'
import { fetcher } from '@/lib/api-client'
import { ActivityLog } from '@/lib/types'

export function useActivities(limit: number = 20) {
  const url = `/api/activities?limit=${limit}`

  const { data, error, isLoading, mutate } = useSWR<ActivityLog[]>(url, fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  })

  return {
    activities: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  }
}
