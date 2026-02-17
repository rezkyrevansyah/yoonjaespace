import useSWR from '@/lib/hooks/use-swr-shim'
import { fetcher } from '@/lib/api-client'
import type { Booking, BookingStatus, PaymentStatus, PrintOrderStatus } from '@/lib/types'

interface UseBookingsParams {
  status?: BookingStatus | 'ALL'
  paymentStatus?: PaymentStatus | 'ALL'
  printStatus?: PrintOrderStatus | 'ALL'
  date?: string // YYYY-MM-DD
  month?: string // YYYY-MM
  search?: string
  page?: number
  limit?: number
}

interface BookingsResponse {
  data: Booking[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function useBookings(params?: UseBookingsParams) {
  // Construct query string
  const searchParams = new URLSearchParams()
  
  if (params) {
    if (params.status && params.status !== 'ALL') searchParams.set('status', params.status)
    if (params.paymentStatus && params.paymentStatus !== 'ALL') searchParams.set('paymentStatus', params.paymentStatus)
    if (params.printStatus && params.printStatus !== 'ALL') searchParams.set('printStatus', params.printStatus)
    if (params.date) searchParams.set('date', params.date)
    if (params.month) searchParams.set('month', params.month)
    if (params.search) searchParams.set('search', params.search)
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
  }

  // Key is null if waiting for dependent data, but here mostly always active
  const key = `/api/bookings?${searchParams.toString()}`

  const { data, error, isLoading, mutate } = useSWR<BookingsResponse>(key, fetcher)

  return {
    bookings: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate
  }
}

export function useBooking(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Booking>(
    id ? `/api/bookings/${id}` : null,
    fetcher
  )

  return {
    booking: data,
    isLoading,
    isError: error,
    mutate
  }
}
