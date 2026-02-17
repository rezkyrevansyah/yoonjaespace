import useSWR from '@/lib/hooks/use-swr-shim'
import { fetcher } from '@/lib/api-client'
import type { Package, Background, AddOn, StaffUser, Voucher } from '@/lib/types'

// Package
export function usePackages(activeOnly = true) {
  const { data, error, isLoading, mutate } = useSWR<Package[]>(
    `/api/packages?active=${activeOnly}`,
    fetcher
  )
  return {
    packages: data || [],
    isLoading,
    isError: error,
    mutate
  }
}

// Background
export function useBackgrounds(activeOnly = true) {
  const { data, error, isLoading, mutate } = useSWR<Background[]>(
    `/api/backgrounds?active=${activeOnly}`,
    fetcher
  )
  return {
    backgrounds: data || [],
    isLoading,
    isError: error,
    mutate
  }
}

// AddOn Templates
export function useAddOnTemplates(activeOnly = true) {
  const { data, error, isLoading, mutate } = useSWR<AddOn[]>(
    `/api/addon-templates?active=${activeOnly}`,
    fetcher
  )
  return {
    addOnTemplates: data || [],
    isLoading,
    isError: error,
    mutate
  }
}

// Staff (Users)
export function useStaff() {
  const { data, error, isLoading, mutate } = useSWR<StaffUser[]>(
    '/api/users',
    fetcher
  )
  return {
    staff: data || [],
    isLoading,
    isError: error,
    mutate
  }
}

// Vouchers
export function useVouchers(activeOnly = true) {
  const { data, error, isLoading, mutate } = useSWR<Voucher[]>(
    `/api/vouchers?active=${activeOnly}`,
    fetcher
  )
  return {
    vouchers: data || [],
    isLoading,
    isError: error,
    mutate
  }
}
// Custom Fields
export function useCustomFields(activeOnly = true) {
  // We need to define the type for CustomField in types.ts if not exists, 
  // but for now we can infer or use any if strictly needed, 
  // however better to import valid type.
  // checked types.ts earlier, CustomField might be there? 
  // currently SettingsPage defines it locally. I should check types.ts first.
  // Assuming it will be added to types.ts or is there.
  // Re-reading types.ts... I don't recall CustomField in types.ts.
  // I will check types.ts first.
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    `/api/custom-fields?active=${activeOnly}`,
    fetcher
  )
  return {
    customFields: data || [],
    isLoading,
    isError: error,
    mutate
  }
}

// Studio Settings
export function useStudioSettings() {
  const { data, error, isLoading, mutate } = useSWR<any>(
    '/api/settings',
    fetcher
  )
  return {
    settings: data || {},
    isLoading,
    isError: error,
    mutate
  }
}
