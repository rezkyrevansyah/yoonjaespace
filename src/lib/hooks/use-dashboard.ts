"use client"

import useSWR from 'swr'
import { apiGet } from '@/lib/api-client'

/**
 * Dashboard API Response Types
 */
export interface DashboardData {
  todaySchedule: Array<{
    id: string
    bookingCode: string
    status: string
    paymentStatus: string
    date: string
    startTime: string
    endTime: string
    client: {
      name: string
      phone: string
    }
    package: {
      name: string
    }
    handledBy: {
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
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    '/api/dashboard',
    async (url) => {
      const response = await apiGet<DashboardData>(url)
      if (response.error) {
        throw new Error(response.error)
      }
      return response.data!
    },
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  )

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
  }
}
