import useSWR from 'swr'
import { fetcher } from '@/lib/api-client'
import type { Vendor, Expense } from '@/lib/types'

export interface VendorWithStats extends Vendor {
  totalExpenses: number
  unpaidExpenses: number
  transactionCount: number
}

export interface VendorDetail extends VendorWithStats {
  expenses: (Expense & {
    relatedBooking: { bookingCode: string; client: { name: string } } | null
  })[]
}

export function useVendors(activeOnly = false) {
  const { data, error, mutate, isLoading } = useSWR<VendorWithStats[]>(
    `/api/vendors?active=${activeOnly}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  return {
    vendors: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

export function useVendorDetail(id: string | null) {
  const { data, error, mutate, isLoading } = useSWR<VendorDetail>(
    id ? `/api/vendors/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  return {
    vendor: data,
    isLoading,
    isError: error,
    mutate,
  }
}
