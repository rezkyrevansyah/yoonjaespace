import useSWR from '@/lib/hooks/use-swr-shim'
import { fetcher, apiPost, apiPatch, apiDelete } from '@/lib/api-client'
import { StaffUser } from '@/lib/types'
import { useToast } from '@/lib/hooks/use-toast'
import { useState } from 'react'

export function useUsers() {
  const { data, error, isLoading, mutate } = useSWR<StaffUser[]>('/api/users', fetcher)
  const { showToast } = useToast()
  const [isMutating, setIsMutating] = useState(false)

  const createUser = async (userData: any) => {
    setIsMutating(true)
    try {
      const { data: newUser, error } = await apiPost<StaffUser>('/api/users', userData)
      if (error) throw new Error(error)
      
      if (newUser) {
        await mutate([...(data || []), newUser], false)
        showToast(`User ${newUser.name} created successfully`, 'success')
        return true
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
    try {
      const { data: updatedUser, error } = await apiPatch<StaffUser>(`/api/users/${id}`, userData)
      if (error) throw new Error(error)

      if (updatedUser) {
        await mutate((data || []).map(u => u.id === id ? updatedUser : u), false)
        showToast(`User ${updatedUser.name} updated successfully`, 'success')
        return true
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
    try {
      const { error } = await apiDelete(`/api/users/${id}`)
      if (error) throw new Error(error)

      await mutate((data || []).filter(u => u.id !== id), false)
      showToast(`User ${name} deleted successfully`, 'success')
      return true
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
