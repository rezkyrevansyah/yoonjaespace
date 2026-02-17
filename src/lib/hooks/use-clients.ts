import useSWR from '@/lib/hooks/use-swr-shim'
import { fetcher } from '@/lib/api-client'
import type { Client } from '@/lib/types'

interface UseClientsParams {
  search?: string
  page?: number
  limit?: number
}

interface ClientsResponse {
  data: Client[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function useClients(params?: UseClientsParams) {
  const searchParams = new URLSearchParams()
  
  if (params) {
    if (params.search) searchParams.set('search', params.search)
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
  }

  const key = `/api/clients?${searchParams.toString()}`

  const { data, error, isLoading, mutate } = useSWR<ClientsResponse>(key, fetcher)

  return {
    clients: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate
  }
}

export function useClient(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Client>(
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
