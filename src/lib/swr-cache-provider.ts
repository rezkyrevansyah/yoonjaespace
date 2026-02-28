"use client"

/**
 * SWR Cache Provider dengan localStorage Persistence
 *
 * Saat app dibuka ulang (setelah ditutup di HP):
 * 1. Load cache dari localStorage secara SINKRON → data langsung tersedia
 * 2. SWR render data cached (isLoading: false) → UI tampil instant
 * 3. SWR revalidate di background → data segar replace seamlessly
 *
 * Saat logout → semua cache dihapus (security)
 */

const CACHE_KEY = 'yjs-swr-cache'
const CACHE_TIMESTAMP_KEY = 'yjs-swr-cache-ts'
const MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 jam

// Key patterns yang di-persist (whitelist approach)
const PERSIST_PATTERNS = [
  '/api/auth/me',
  '/api/permissions',
  '/api/settings',
  '/api/reminders',
  '/api/activities',
  '/api/dashboard',
  '/api/bookings',
  '/api/calendar',
  '/api/clients',
  '/api/finance',
  '/api/expenses',
  '/api/vendors',
  '/api/commissions',
  '/api/packages',
  '/api/backgrounds',
  '/api/custom-fields',
  '/api/addon-templates',
  '/api/vouchers',
  '/api/roles',
  '/api/initial',
]

function shouldPersist(key: string): boolean {
  return PERSIST_PATTERNS.some(pattern => key.startsWith(pattern))
}

interface CacheState {
  data?: unknown
  error?: unknown
  isValidating?: boolean
  isLoading?: boolean
}

/**
 * Load persisted cache dari localStorage (sinkron)
 */
function loadCache(): Map<string, CacheState> {
  const map = new Map<string, CacheState>()

  if (typeof window === 'undefined') return map

  try {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    if (timestamp) {
      const age = Date.now() - parseInt(timestamp, 10)
      if (age > MAX_AGE_MS) {
        localStorage.removeItem(CACHE_KEY)
        localStorage.removeItem(CACHE_TIMESTAMP_KEY)
        return map
      }
    }

    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return map

    const entries: [string, { data: unknown }][] = JSON.parse(raw)
    for (const [key, value] of entries) {
      if (value.data !== undefined) {
        map.set(key, {
          data: value.data,
          error: undefined,
          isValidating: true,  // Tandai: sedang revalidate di background
          isLoading: false,    // TIDAK loading — sudah ada data cached
        })
      }
    }
  } catch {
    // Cache corrupt → clear
    try {
      localStorage.removeItem(CACHE_KEY)
      localStorage.removeItem(CACHE_TIMESTAMP_KEY)
    } catch { /* ignore */ }
  }

  return map
}

/**
 * Save cache ke localStorage (debounced)
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null

function saveCache(map: Map<string, CacheState>) {
  if (typeof window === 'undefined') return

  if (saveTimeout) clearTimeout(saveTimeout)

  saveTimeout = setTimeout(() => {
    try {
      const entries: [string, { data: unknown }][] = []

      for (const [key, value] of map.entries()) {
        if (shouldPersist(key) && value.data !== undefined) {
          entries.push([key, { data: value.data }])
        }
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(entries))
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    } catch (e) {
      // Quota exceeded → clear dan coba lagi
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        try {
          localStorage.removeItem(CACHE_KEY)
        } catch { /* ignore */ }
      }
    }
  }, 2000) // Debounce 2 detik
}

/**
 * Clear semua cache (dipanggil saat logout)
 */
export function clearSWRCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_TIMESTAMP_KEY)
  } catch { /* ignore */ }
}

/**
 * SWR Cache Provider yang persist ke localStorage
 *
 * Digunakan di SWRConfig: provider: localStorageCacheProvider
 */
export function localStorageCacheProvider() {
  const map = loadCache()

  return {
    keys() {
      return map.keys()
    },
    get(key: string) {
      return map.get(key)
    },
    set(key: string, value: CacheState) {
      map.set(key, value)
      saveCache(map)
    },
    delete(key: string) {
      map.delete(key)
      saveCache(map)
    },
  }
}
