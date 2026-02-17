"use client"

import useSWR from '@/lib/hooks/use-swr-shim'
import { fetcher, apiPost } from '@/lib/api-client'
import { UserRole } from '@/lib/types'

export interface CommissionItem {
  staff: {
    id: string
    name: string
    role: UserRole
  }
  bookingCount: number
  revenueGenerated: number
  bookings: any[]
  commission: {
    id: string
    amount: number
    notes: string | null
    isPaid: boolean
  } | null
}

export interface CommissionsResponse {
  month: number
  year: number
  data: CommissionItem[]
}

export function useCommissions(month: number, year: number) {
  const url = `/api/commissions?month=${month}&year=${year}`

  const { data, error, isLoading, mutate } = useSWR<CommissionsResponse>(url, fetcher)

  const saveCommission = async (params: {
    userId: string
    month: number
    year: number
    amount: number
    notes?: string
    isPaid?: boolean
  }) => {
    const res = await apiPost('/api/commissions', params)
    if (!res.error) {
      mutate()
    }
    return res
  }

  return {
    data: data?.data || [],
    isLoading,
    isError: error,
    saveCommission,
    refresh: mutate,
  }
}
