"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useSWRConfig } from "swr"
import { StaffUser, UserRole } from "@/lib/types"
import { clearSWRCache } from "@/lib/swr-cache-provider"

const AUTH_CACHE_KEY = 'yjs-auth-user'

interface AuthContextType {
  user: StaffUser | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { mutate } = useSWRConfig()

  // Inisialisasi dari localStorage cache → UI langsung render tanpa loading
  const [user, setUser] = useState<StaffUser | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const cached = localStorage.getItem(AUTH_CACHE_KEY)
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === 'undefined') return true
    return !localStorage.getItem(AUTH_CACHE_KEY)
  })

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const saveAuthCache = (userData: StaffUser) => {
    try {
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(userData))
    } catch { /* ignore */ }
  }

  const clearAuthCache = () => {
    try {
      localStorage.removeItem(AUTH_CACHE_KEY)
    } catch { /* ignore */ }
  }

  const checkAuth = async () => {
    try {
      // Fetch /api/initial — 1 API call untuk auth + settings + permissions + reminders
      const response = await fetch("/api/initial", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        const staffUser: StaffUser = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone || "",
          role: data.user.role as UserRole,
          isActive: true,
          createdAt: new Date().toISOString(),
        }
        setUser(staffUser)
        saveAuthCache(staffUser)

        // Populate SWR caches → useSettings, usePermissions, useReminderCount langsung dapat data
        mutate('/api/settings', data.settings, false)
        mutate('/api/permissions', data.permissions, false)
        mutate('/api/reminders/count', data.reminderCount, false)
      } else {
        // Auth gagal (session expired) → clear cache
        setUser(null)
        clearAuthCache()
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      // Network error → keep cached user (offline support)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const text = await response.text()
      let data: { error?: string; dbUser?: { id: string; name: string; email: string; role: string; phone: string } } = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        // server returned non-JSON body
      }

      if (!response.ok) {
        return { success: false, error: data.error || "Login gagal" }
      }

      // Set user state directly from login response — NO extra /api/auth/me round-trip needed
      if (data.dbUser) {
        const staffUser: StaffUser = {
          id: data.dbUser.id,
          name: data.dbUser.name,
          email: data.dbUser.email,
          phone: data.dbUser.phone ?? "",
          role: data.dbUser.role as UserRole,
          isActive: true,
          createdAt: new Date().toISOString(),
        }
        setUser(staffUser)
        saveAuthCache(staffUser)
      } else {
        // Fallback: fetch user data if dbUser not in response
        await checkAuth()
      }

      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Terjadi kesalahan saat login" }
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Always clear user + all cached data (security)
      setUser(null)
      clearAuthCache()
      clearSWRCache()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
