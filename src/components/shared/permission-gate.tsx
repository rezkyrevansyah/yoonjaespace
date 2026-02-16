"use client"

import { ReactNode } from "react"
import { UserRole } from "@/lib/types" // Adjust path if needed
import { mockCurrentUser } from "@/lib/mock-data" // In real app, useAuth() hook

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
  // In a real application, get the current user from auth context/hook
  const userRole = mockCurrentUser.role

  if (allowedRoles.includes(userRole)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
