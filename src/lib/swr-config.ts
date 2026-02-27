import { SWRConfiguration } from 'swr'

/**
 * Global SWR Configuration for REAL-TIME Performance
 *
 * Key optimizations:
 * 1. keepPreviousData — show stale data instantly while revalidating in background
 * 2. revalidateOnMount — always fetch fresh on mount, but show cache first
 * 3. Deduplication — prevent concurrent duplicate requests (5s window)
 */
export const swrConfig: SWRConfiguration = {
  // Aggressive deduping for instant navigation
  dedupingInterval: 30000, // 30 seconds — navigasi balik ke halaman yang sama pakai cache langsung

  // CRITICAL: Keep previous data while revalidating → zero loading flash
  keepPreviousData: true,

  // Always fetch fresh data on mount, but show cached data immediately
  revalidateOnMount: true,

  // Focus/reconnect behavior
  revalidateOnFocus: false, // Don't refetch when window regains focus
  revalidateOnReconnect: true, // Refetch when internet reconnects

  // Faster error handling
  errorRetryCount: 2,
  errorRetryInterval: 2000,

  // Loading timeout
  loadingTimeout: 5000,

  // Don't block UI — show stale data from cache immediately
  revalidateIfStale: true,
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
  dedupingInterval: 300000, // 5 minutes — very aggressive dedup for static data
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,   // Trust cache for static data — don't re-fetch stale
  revalidateOnMount: true,    // Always fetch on mount if no cached data
}
