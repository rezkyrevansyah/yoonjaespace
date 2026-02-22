import useSWR from 'swr'
import type { Vendor } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface VendorWithStats extends Vendor {
  totalExpenses: number
  unpaidExpenses: number
  transactionCount: number
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
