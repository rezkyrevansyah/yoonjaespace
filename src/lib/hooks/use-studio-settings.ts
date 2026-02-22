"use client"

import useSWR from '@/lib/hooks/use-swr-shim'
import { fetcher } from '@/lib/api-client'

export interface StudioSettings {
  studioName: string
  logoUrl: string
  studioPhotoUrl: string
  address: string
  mapsUrl: string
  mapsLatitude: string
  mapsLongitude: string
  phoneNumber: string
  whatsappNumber: string
  email: string
  instagram: string
  footerText: string
}

export function useStudioSettings() {
  const { data, error, isLoading, mutate } = useSWR<StudioSettings>(
    '/api/settings/studio',
    fetcher
  )

  return {
    settings: data,
    isLoading,
    isError: error,
    mutate,
  }
}
