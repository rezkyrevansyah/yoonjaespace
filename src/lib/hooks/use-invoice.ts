import useSWR from '@/lib/hooks/use-swr-shim'
import { fetcher } from '@/lib/api-client'

interface InvoiceData {
  booking: {
    id: string
    bookingCode: string
    date: string
    startTime: string
    totalAmount: number
    packagePrice: number
    discountAmount: number
    paymentStatus: string
    publicSlug: string
    paidAmount: number
    outstandingBalance: number
    payments: any[]
    addOns: any[]
    client: {
      name: string
      phone: string
      email: string | null
      address: string | null
    }
    package: {
      name: string
      description: string | null
      price: number
    }
  }
  studio: {
    name: string
    address: string
    phone: string
    instagram: string
    logoUrl: string
    footerText: string
  }
}

/**
 * SWR hook for public invoice data.
 * Caches the response so revisiting the invoice page is instant.
 */
export function useInvoice(id: string | null) {
  const { data, error, isLoading } = useSWR<InvoiceData>(
    id ? `/api/public/invoice/${id}` : null,
    fetcher,
    {
      // Public invoice doesn't change frequently — cache aggressively
      dedupingInterval: 60000,      // 1 min dedup
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,     // trust cache once loaded
    }
  )

  return {
    booking: data?.booking,
    studio: data?.studio,
    isLoading,
    isError: error,
  }
}
