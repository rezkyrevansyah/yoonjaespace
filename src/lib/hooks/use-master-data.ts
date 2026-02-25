import useSWR from '@/lib/hooks/use-swr-shim'
import { fetcher } from '@/lib/api-client'
import { staticDataConfig, swrConfig } from '@/lib/swr-config'
import type { Package, Background, AddOn, StaffUser, Voucher, CustomField } from '@/lib/types'

// Package
export function usePackages(activeOnly = true, enabled = true) {
  const key = enabled ? `/api/packages?active=${activeOnly}` : null
  const { data, error, isLoading, mutate } = useSWR<Package[]>(
    key,
    fetcher,
    staticDataConfig  // aggressively cached — rarely changes
  )
  return {
    packages: data || [],
    isLoading: enabled ? isLoading : false,
    isError: error,
    mutate
  }
}

// Background
export function useBackgrounds(activeOnly = true, enabled = true) {
  const key = enabled ? `/api/backgrounds?active=${activeOnly}` : null
  const { data, error, isLoading, mutate } = useSWR<Background[]>(
    key,
    fetcher,
    staticDataConfig
  )
  return {
    backgrounds: data || [],
    isLoading: enabled ? isLoading : false,
    isError: error,
    mutate
  }
}

// AddOn Templates
export function useAddOnTemplates(activeOnly = true, enabled = true) {
  const key = enabled ? `/api/addon-templates?active=${activeOnly}` : null
  const { data, error, isLoading, mutate } = useSWR<AddOn[]>(
    key,
    fetcher,
    staticDataConfig
  )
  return {
    addOnTemplates: data || [],
    isLoading: enabled ? isLoading : false,
    isError: error,
    mutate
  }
}

// Staff (Users)
export function useStaff() {
  const { data, error, isLoading, mutate } = useSWR<StaffUser[]>(
    '/api/users',
    fetcher,
    swrConfig  // staff may change, use regular config
  )
  return {
    staff: data || [],
    isLoading,
    isError: error,
    mutate
  }
}

// Vouchers
export function useVouchers(activeOnly = true, enabled = true) {
  const key = enabled ? `/api/vouchers?active=${activeOnly}` : null
  const { data, error, isLoading, mutate } = useSWR<Voucher[]>(
    key,
    fetcher,
    staticDataConfig
  )
  return {
    vouchers: data || [],
    isLoading: enabled ? isLoading : false,
    isError: error,
    mutate
  }
}
// Custom Fields
export function useCustomFields(activeOnly = true, enabled = true) {
  const key = enabled ? `/api/custom-fields?active=${activeOnly}` : null
  const { data, error, isLoading, mutate } = useSWR<CustomField[]>(
    key,
    fetcher,
    staticDataConfig
  )
  return {
    customFields: data || [],
    isLoading: enabled ? isLoading : false,
    isError: error,
    mutate
  }
}

// Studio Settings
export function useStudioSettings() {
  const { data, error, isLoading, mutate } = useSWR<Record<string, unknown>>(
    '/api/settings',
    fetcher,
    swrConfig  // settings may change frequently
  )
  return {
    settings: data || {},
    isLoading,
    isError: error,
    mutate
  }
}
