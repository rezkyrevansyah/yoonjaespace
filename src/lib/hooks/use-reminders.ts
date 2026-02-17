"use client"

import useSWR from '@/lib/hooks/use-swr-shim'
import { fetcher } from '@/lib/api-client'
import { Booking } from '@/lib/types'

export interface ReminderData {
  booking: Booking
  hoursUntilSession: number
  waLink: string
  reminderMessage: string
}

export function useReminders(type: string = 'today') {
  const url = `/api/reminders?type=${type}`

  const { data, error, isLoading, mutate } = useSWR<ReminderData[]>(url, fetcher, {
    refreshInterval: 60000, // Refresh every minute
  })

  return {
    reminders: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  }
}
