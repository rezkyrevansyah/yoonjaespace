"use client"

import useSWR from '@/lib/hooks/use-swr-shim'
import { fetcher } from '@/lib/api-client'
import { Client, Booking } from '@/lib/types'

export interface ClientDetailResponse extends Client {
  bookings: (Booking & {
    package: { name: string }
    handledBy: { id: string, name: string } | null
    printOrder: any
  })[]
  summary: {
    totalBookings: number
    totalSpent: number
    lastVisit: string | null
  }
}

export function useClient(id: string) {
  const { data, error, isLoading, mutate } = useSWR<ClientDetailResponse>(
    id ? `/api/clients/${id}` : null,
    fetcher
  )

  return {
    client: data,
    isLoading,
    isError: error,
    mutate
  }
}
