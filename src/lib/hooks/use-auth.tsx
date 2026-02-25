"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { StaffUser, UserRole } from "@/lib/types"

interface AuthContextType {
  user: StaffUser | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const userData = await response.json()
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || "",
          role: userData.role as UserRole,
          isActive: true,
          createdAt: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Auth check failed:", error)
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
        setUser({
          id: data.dbUser.id,
          name: data.dbUser.name,
          email: data.dbUser.email,
          phone: data.dbUser.phone ?? "",
          role: data.dbUser.role as UserRole,
          isActive: true,
          createdAt: new Date().toISOString(),
        })
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

      setUser(null)
    } catch (error) {
      console.error("Logout error:", error)
      // Still clear user even if API call fails
      setUser(null)
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
