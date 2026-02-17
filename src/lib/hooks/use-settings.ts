import useSWR from '@/lib/hooks/use-swr-shim'
import { fetcher, apiPatch } from '@/lib/api-client'
import { useState } from 'react'
import { useToast } from '@/lib/hooks/use-toast'

export interface StudioSettings {
  name: string
  address: string
  phone: string
  instagram: string
  openTime: string
  closeTime: string
  dayOff: string[]
  defaultPaymentStatus: "PAID" | "UNPAID"
  reminderMessageTemplate: string
}

export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR<StudioSettings>('/api/settings', fetcher)
  const { showToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const updateSettings = async (newSettings: Partial<StudioSettings>) => {
    setIsSaving(true)
    try {
      const { error } = await apiPatch('/api/settings', newSettings)
      if (error) throw new Error(error)
      
      await mutate({ ...data, ...newSettings } as StudioSettings, false)
      showToast('Settings updated successfully', 'success')
      return true
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return {
    settings: data,
    isLoading,
    isError: error,
    updateSettings,
    isSaving
  }
}
