import { SWRConfiguration } from 'swr'

/**
 * Global SWR Configuration for REAL-TIME Performance
 *
 * Key optimizations:
 * 1. Optimistic UI updates - instant feedback
 * 2. Background revalidation - no blocking
 * 3. Smart caching - reduce network requests
 * 4. Fast error recovery
 */
export const swrConfig: SWRConfiguration = {
  // Faster deduping for real-time feel
  dedupingInterval: 2000, // 2 seconds - allow faster updates

  // Focus/reconnect behavior
  revalidateOnFocus: false, // Don't refetch when window regains focus
  revalidateOnReconnect: true, // Refetch when internet reconnects

  // CRITICAL: Keep previous data while revalidating (enables optimistic updates)
  keepPreviousData: true,

  // Faster error handling
  errorRetryCount: 2, // Fail faster (reduced from 3)
  errorRetryInterval: 2000, // 2 seconds (faster retry)

  // Loading timeout
  loadingTimeout: 5000, // 5 seconds (faster timeout)

  // Revalidation - OPTIMIZED for instant feel
  revalidateIfStale: true, // Revalidate if data is stale
  revalidateOnMount: false, // Use cache first! Don't block UI with refetch on mount

  // Comparison function (default is referential equality)
  compare: (a, b) => {
    // Use JSON comparison for deep equality check
    return JSON.stringify(a) === JSON.stringify(b)
  },
}

/**
 * Fast refresh config for frequently changing data (e.g., dashboard stats)
 */
export const fastRefreshConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 30000, // Auto-refresh every 30 seconds
  revalidateOnFocus: true,
}

/**
 * Static data config for rarely changing data (e.g., packages, backgrounds)
 */
export const staticDataConfig: SWRConfiguration = {
  ...swrConfig,
  dedupingInterval: 60000, // 1 minute
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
}
