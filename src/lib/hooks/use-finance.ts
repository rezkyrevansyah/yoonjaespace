import useSWR from '@/lib/hooks/use-swr-shim'
import { fetcher } from '@/lib/api-client'
import { Expense, FinanceSummary } from '@/lib/types'

interface UseExpensesParams {
  month?: string // YYYY-MM
  category?: string
  startDate?: string
  endDate?: string
}

export function useExpenses(params?: UseExpensesParams) {
  const searchParams = new URLSearchParams()
  if (params) {
    if (params.month) searchParams.set('month', params.month)
    if (params.category && params.category !== 'ALL') searchParams.set('category', params.category)
    if (params.startDate) searchParams.set('startDate', params.startDate)
    if (params.endDate) searchParams.set('endDate', params.endDate)
  }

  const key = `/api/finance/expenses?${searchParams.toString()}`
  const { data, error, isLoading, mutate } = useSWR<{ expenses: Expense[] }>(key, fetcher)

  return {
    expenses: data?.expenses || [],
    isLoading,
    isError: error,
    mutate
  }
}

export function useFinanceSummary(month?: string) {
  const searchParams = new URLSearchParams()
  if (month) searchParams.set('month', month)

  const key = `/api/finance/summary?${searchParams.toString()}`
  const { data, error, isLoading, mutate } = useSWR<FinanceSummary>(key, fetcher)

  return {
    summary: data,
    isLoading,
    isError: error,
    mutate
  }
}
