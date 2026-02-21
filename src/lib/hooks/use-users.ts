import useSWR from '@/lib/hooks/use-swr-shim'
import { fetcher, apiPost, apiPatch, apiDelete } from '@/lib/api-client'
import { StaffUser } from '@/lib/types'
import { useToast } from '@/lib/hooks/use-toast'
import { useState } from 'react'
import { optimisticAdd, optimisticUpdate, optimisticDelete } from '@/lib/optimistic-updates'

export function useUsers() {
  const { data, error, isLoading, mutate } = useSWR<StaffUser[]>('/api/users', fetcher)
  const { showToast } = useToast()
  const [isMutating, setIsMutating] = useState(false)

  const createUser = async (userData: any) => {
    setIsMutating(true)
    showToast(`Creating user...`, 'info') // Instant feedback
    try {
      // Optimistic update - UI updates INSTANTLY!
      const success = await optimisticAdd(
        mutate,
        data,
        { ...userData, id: `temp-${Date.now()}`, createdAt: new Date().toISOString() } as StaffUser,
        () => apiPost<StaffUser>('/api/users', userData)
      )

      if (success) {
        showToast(`User ${userData.name} created successfully`, 'success')
        return true
      } else {
        throw new Error('Failed to create user')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create user', 'error')
      return false
    } finally {
      setIsMutating(false)
    }
  }

  const updateUser = async (id: string, userData: any) => {
    setIsMutating(true)
    showToast(`Updating user...`, 'info') // Instant feedback
    try {
      // Optimistic update - UI updates INSTANTLY!
      const success = await optimisticUpdate(
        mutate,
        data,
        id,
        userData,
        () => apiPatch<StaffUser>(`/api/users/${id}`, userData)
      )

      if (success) {
        showToast(`User updated successfully`, 'success')
        return true
      } else {
        throw new Error('Failed to update user')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update user', 'error')
      return false
    } finally {
      setIsMutating(false)
    }
  }

  const deleteUser = async (id: string, name: string) => {
    setIsMutating(true)
    showToast(`Deleting user...`, 'info') // Instant feedback
    try {
      // Optimistic delete - UI updates INSTANTLY!
      const success = await optimisticDelete(
        mutate,
        data,
        id,
        () => apiDelete(`/api/users/${id}`)
      )

      if (success) {
        showToast(`User ${name} deleted successfully`, 'success')
        return true
      } else {
        throw new Error('Failed to delete user')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error')
      return false
    } finally {
      setIsMutating(false)
    }
  }

  return {
    users: data || [],
    isLoading,
    isError: error,
    createUser,
    updateUser,
    deleteUser,
    isMutating,
    mutate
  }
}
