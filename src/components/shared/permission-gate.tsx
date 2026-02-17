"use client"

import { ReactNode } from "react"
import { UserRole } from "@/lib/types" // Adjust path if needed
import { useAuth } from "@/lib/hooks/use-auth"

interface PermissionGateProps {
  allowedRoles: UserRole[]
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGate({
  allowedRoles,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) return null

  if (user && allowedRoles.includes(user.role)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
