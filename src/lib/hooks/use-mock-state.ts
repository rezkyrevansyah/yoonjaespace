"use client"

import { useState, useCallback } from "react"

/**
 * Hook to manage mock data state with CRUD operations.
 * Simulates API-like behavior with local state.
 */
export function useMockState<T extends { id: string }>(initialData: T[]) {
  const [data, setData] = useState<T[]>(initialData)
  const [isLoading, setIsLoading] = useState(false)

  const simulateDelay = useCallback(async (ms: number = 300) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, ms))
    setIsLoading(false)
  }, [])

  const addItem = useCallback(
    async (item: T) => {
      await simulateDelay()
      setData((prev) => [item, ...prev])
    },
    [simulateDelay]
  )

  const updateItem = useCallback(
    async (id: string, updates: Partial<T>) => {
      await simulateDelay()
      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      )
    },
    [simulateDelay]
  )

  const deleteItem = useCallback(
    async (id: string) => {
      await simulateDelay()
      setData((prev) => prev.filter((item) => item.id !== id))
    },
    [simulateDelay]
  )

  const getById = useCallback(
    (id: string) => {
      return data.find((item) => item.id === id) || null
    },
    [data]
  )

  return {
    data,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    getById,
    setData,
  }
}
