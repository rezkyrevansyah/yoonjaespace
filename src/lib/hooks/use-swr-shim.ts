/**
 * SWR Re-export
 * 
 * Previously a custom implementation without caching.
 * Now uses the real `swr` library for:
 * - In-memory cache shared across components
 * - Deduplication of concurrent requests
 * - Background revalidation
 * - Instant navigation (cache shown while revalidating)
 */
export { default } from 'swr'
