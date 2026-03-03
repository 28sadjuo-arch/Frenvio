/*
  Minimal service worker to enable an installable PWA experience.
  - Keeps the app working as-is (no aggressive caching)
  - Adds a small runtime cache for same-origin GET requests
*/

const CACHE_NAME = 'frenvio-runtime-v1'
const APP_SHELL = ['/']

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch(() => undefined)
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => (k === CACHE_NAME ? Promise.resolve() : caches.delete(k))))
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request

  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Only cache same-origin requests.
  if (url.origin !== self.location.origin) return

  // For navigations, try network first, then fallback to cached app shell.
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req)
          return res
        } catch {
          const cache = await caches.open(CACHE_NAME)
          return (await cache.match('/')) || Response.error()
        }
      })()
    )
    return
  }

  // For other same-origin GET requests: cache-first, then network + update cache.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      const cached = await cache.match(req)
      if (cached) return cached

      try {
        const res = await fetch(req)
        if (res && res.ok) {
          cache.put(req, res.clone()).catch(() => undefined)
        }
        return res
      } catch {
        return Response.error()
      }
    })()
  )
})
