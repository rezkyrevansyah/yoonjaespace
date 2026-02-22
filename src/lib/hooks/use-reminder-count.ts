"use client"

import useSWR from '@/lib/hooks/use-swr-shim'
import { fetcher } from '@/lib/api-client'

export function useReminderCount() {
  const url = '/api/reminders/count'

  // Use global SWR config for consistent caching behavior
  const { data, error, isLoading, mutate } = useSWR<{ count: number }>(url, fetcher)

  return {
    count: data?.count || 0,
    isLoading,
    isError: error,
    refresh: mutate,
  }
}
