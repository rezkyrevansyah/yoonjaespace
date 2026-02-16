"use client"

import { useState, useEffect } from 'react'
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
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const response = await apiGet<DashboardData>('/api/dashboard')
      if (response.error) {
        setError(response.error)
      } else {
        setData(response.data || null)
        setError(null)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Refresh interval
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  return {
    data,
    error,
    isLoading,
    refresh: fetchData,
  }
}
