"use client"

import useSWR from '@/lib/hooks/use-swr-shim'
import { fetcher } from '@/lib/api-client'
import { BookingStatus, PaymentStatus } from '@/lib/types'

/**
 * Dashboard API Response Types
 */
export interface DashboardData {
  todaySchedule: Array<{
    id: string
    bookingCode: string
    status: BookingStatus
    paymentStatus: PaymentStatus
    sessionDate: string
    sessionTime: string
    client: {
      name: string
      phone: string
    }
    package: {
      name: string
    }
    handledBy?: {
      name: string
    }
  }>
  actionItems: {
    waitingClientSelection: number
    sentToVendor: number
    needPackaging: number
    needShipping: number
  }
  monthlyStats: {
    totalBookings: number
    revenue: number
    unpaidBookings: number
  }
}

/**
 * Custom hook for fetching dashboard data
 */
export function useDashboard() {
  // Use global SWR config for consistent caching behavior
  const { data, error, isLoading, mutate } = useSWR<DashboardData>('/api/dashboard', fetcher)

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
  }
}
