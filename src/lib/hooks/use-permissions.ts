import useSWR from '@/lib/hooks/use-swr-shim'
import { fetcher } from '@/lib/api-client'
import { staticDataConfig } from '@/lib/swr-config'

export interface MenuPermission {
  menuName: string
  menuLabel: string
  sortOrder: number
  canView: boolean
  canEdit: boolean
  canDelete: boolean
}

export interface PermissionsResponse {
  permissions: MenuPermission[]
  user: {
    id: string
    name: string
    email: string
    role: string
    customRoleName?: string
  }
}

export function usePermissions() {
  const { data, error, isLoading, mutate } = useSWR<PermissionsResponse>(
    '/api/permissions',
    fetcher,
    {
      ...staticDataConfig,
      dedupingInterval: 30000, // 30 seconds - permissions don't change often
    }
  )

  // Debug logging
  if (error) {
    console.error('[usePermissions] Error:', error)
  }
  if (data) {
    console.log('[usePermissions] Loaded permissions:', data.permissions.length, 'menus')
  }

  const hasPermission = (menuName: string, action: 'view' | 'edit' | 'delete' = 'view'): boolean => {
    if (!data?.permissions) return false

    const permission = data.permissions.find(p => p.menuName === menuName)
    if (!permission) return false

    if (action === 'view') return permission.canView
    if (action === 'edit') return permission.canEdit
    if (action === 'delete') return permission.canDelete

    return false
  }

  const getVisibleMenus = (): MenuPermission[] => {
    if (!data?.permissions) return []
    return data.permissions.filter(p => p.canView)
  }

  return {
    permissions: data?.permissions || [],
    user: data?.user,
    isLoading,
    isError: error,
    hasPermission,
    getVisibleMenus,
    refresh: mutate,
  }
}
