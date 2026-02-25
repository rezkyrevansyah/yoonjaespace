/**
 * Optimistic UI Update Helpers
 *
 * These functions enable instant UI updates before API responses,
 * making the app feel real-time and snappy.
 */

type MutateFn<T> = (data?: T | Promise<T> | undefined, shouldRevalidate?: boolean) => Promise<void | T | undefined>

/**
 * Optimistically add an item to a list
 * Updates UI immediately, then revalidates from server
 */
export async function optimisticAdd<T extends { id?: string }>(
  mutate: MutateFn<T[]>,
  currentData: T[] | undefined,
  newItem: T,
  apiCall: () => Promise<{ data?: T; error?: string }>
): Promise<boolean> {
  if (!currentData) return false

  // 1. Optimistically update UI (instant!)
  const tempId = `temp-${Date.now()}`
  const optimisticItem = { ...newItem, id: tempId }
  await mutate([...currentData, optimisticItem], false)

  try {
    // 2. Make API call in background
    const { data: createdItem, error } = await apiCall()
    if (error) throw new Error(error)

    // 3. Replace temp item with real item from server
    if (createdItem) {
      await mutate(
        currentData.map(item => (item.id === tempId ? createdItem : item)).concat(
          currentData.every(item => item.id !== createdItem.id) ? [createdItem] : []
        ),
        false
      )
    }

    // 4. Revalidate to ensure consistency
    await mutate()
    return true
  } catch (error) {
    // Rollback on error - remove optimistic item
    await mutate(currentData, false)
    return false
  }
}

/**
 * Optimistically update an item in a list
 * Updates UI immediately, then revalidates from server
 */
export async function optimisticUpdate<T extends { id: string }>(
  mutate: MutateFn<T[]>,
  currentData: T[] | undefined,
  itemId: string,
  updates: Partial<T>,
  apiCall: () => Promise<{ data?: T; error?: string }>
): Promise<boolean> {
  if (!currentData) return false

  // Store original data for rollback
  const originalData = [...currentData]

  // 1. Optimistically update UI (instant!)
  const optimisticData = currentData.map(item =>
    item.id === itemId ? { ...item, ...updates } : item
  )
  await mutate(optimisticData, false)

  try {
    // 2. Make API call in background
    const { data: updatedItem, error } = await apiCall()
    if (error) throw new Error(error)

    // 3. Update with real data from server
    if (updatedItem) {
      await mutate(
        currentData.map(item => (item.id === itemId ? updatedItem : item)),
        false
      )
    }

    // 4. Revalidate to ensure consistency
    await mutate()
    return true
  } catch (error) {
    // Rollback on error
    await mutate(originalData, false)
    return false
  }
}

/**
 * Optimistically delete an item from a list
 * Updates UI immediately, then revalidates from server
 */
export async function optimisticDelete<T extends { id: string }>(
  mutate: MutateFn<T[]>,
  currentData: T[] | undefined,
  itemId: string,
  apiCall: () => Promise<{ error?: string }>
): Promise<boolean> {
  if (!currentData) return false

  // Store original data for rollback
  const originalData = [...currentData]

  // 1. Optimistically remove from UI (instant!)
  const optimisticData = currentData.filter(item => item.id !== itemId)
  await mutate(optimisticData, false)

  try {
    // 2. Make API call in background
    const { error } = await apiCall()
    if (error) throw new Error(error)

    // 3. Revalidate to ensure consistency
    await mutate()
    return true
  } catch (error) {
    // Rollback on error
    await mutate(originalData, false)
    return false
  }
}

/**
 * Optimistically update a single object (non-list)
 * Updates UI immediately, then revalidates from server
 */
export async function optimisticUpdateSingle<T>(
  mutate: MutateFn<T>,
  currentData: T | undefined,
  updates: Partial<T>,
  apiCall: () => Promise<{ data?: T; error?: string }>
): Promise<boolean> {
  if (!currentData) return false

  // Store original data for rollback
  const originalData = { ...currentData }

  // 1. Optimistically update UI (instant!)
  const optimisticData = { ...currentData, ...updates }
  await mutate(optimisticData, false)

  try {
    // 2. Make API call in background
    const { data: updatedData, error } = await apiCall()
    if (error) throw new Error(error)

    // 3. Update with real data from server
    if (updatedData) {
      await mutate(updatedData, false)
    }

    // 4. Revalidate to ensure consistency
    await mutate()
    return true
  } catch (error) {
    // Rollback on error
    await mutate(originalData, false)
    return false
  }
}
