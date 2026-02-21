import useSWR from '@/lib/hooks/use-swr-shim'
import { fetcher, apiPost, apiPatch, apiDelete } from '@/lib/api-client'
import { useState } from 'react'
import { useToast } from '@/lib/hooks/use-toast'

export interface MenuPermission {
  menuId: string
  canView: boolean
  canEdit: boolean
  canDelete: boolean
}

export interface Role {
  id: string
  name: string
  description?: string
  isSystem: boolean
  createdAt: string
  updatedAt: string
  permissions: Array<{
    id: string
    menuId: string
    canView: boolean
    canEdit: boolean
    canDelete: boolean
    menu: {
      id: string
      name: string
      label: string
      sortOrder: number
    }
  }>
  _count: {
    users: number
  }
}

export interface Menu {
  id: string
  name: string
  label: string
  sortOrder: number
  createdAt: string
}

export function useRoles() {
  const { data, error, isLoading, mutate } = useSWR<{ roles: Role[] }>('/api/roles', fetcher)
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createRole = async (name: string, description: string, menuPermissions: MenuPermission[]) => {
    setIsSubmitting(true)
    try {
      const { data: role, error } = await apiPost('/api/roles', {
        name,
        description,
        menuPermissions
      })
      if (error) throw new Error(error)

      await mutate()
      showToast('Role berhasil dibuat', 'success')
      return { success: true, role }
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat role', 'error')
      return { success: false, error: err.message }
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateRole = async (id: string, name: string, description: string, menuPermissions: MenuPermission[]) => {
    setIsSubmitting(true)
    try {
      const { data: role, error } = await apiPatch(`/api/roles/${id}`, {
        name,
        description,
        menuPermissions
      })
      if (error) throw new Error(error)

      await mutate()
      showToast('Role berhasil diupdate', 'success')
      return { success: true, role }
    } catch (err: any) {
      showToast(err.message || 'Gagal update role', 'error')
      return { success: false, error: err.message }
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteRole = async (id: string) => {
    setIsSubmitting(true)
    try {
      const { error } = await apiDelete(`/api/roles/${id}`)
      if (error) throw new Error(error)

      await mutate()
      showToast('Role berhasil dihapus', 'success')
      return { success: true }
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus role', 'error')
      return { success: false, error: err.message }
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    roles: data?.roles || [],
    isLoading,
    isError: error,
    isSubmitting,
    createRole,
    updateRole,
    deleteRole,
    refresh: mutate
  }
}

export function useMenus() {
  const { data, error, isLoading } = useSWR<{ menus: Menu[] }>('/api/menus', fetcher)

  return {
    menus: data?.menus || [],
    isLoading,
    isError: error
  }
}
