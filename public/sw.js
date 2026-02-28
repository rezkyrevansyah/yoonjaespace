/**
 * Service Worker — Stale-While-Revalidate untuk API routes
 *
 * Layer ke-3 dari caching strategy:
 * 1. SWR localStorage cache → instant render
 * 2. Browser HTTP cache → fast revalidation
 * 3. Service Worker cache → offline support + backup
 */

const CACHE_NAME = 'yjs-api-v1'

// API routes yang di-cache dengan stale-while-revalidate
const API_CACHE_ROUTES = [
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
  '/api/roles',
]

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Hanya intercept GET request ke API routes yang di-whitelist
  if (event.request.method !== 'GET') return
  if (!API_CACHE_ROUTES.some(route => url.pathname.startsWith(route))) return

  event.respondWith(staleWhileRevalidate(event.request))
})

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)

  // Fetch dari network di background
  const networkPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    })
    .catch(() => cachedResponse)

  // Return cached response langsung, atau tunggu network jika tidak ada cache
  return cachedResponse || networkPromise
}
