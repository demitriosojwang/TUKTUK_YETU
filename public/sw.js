// TUKTUK YETU Service Worker
// Provides offline support so drivers and passengers can keep using the app
// even with spotty Kenyan mobile data connectivity.
//
// Caching strategy:
//  - App shell (HTML, JS, CSS, fonts): stale-while-revalidate
//  - Static assets (logos, icons, manifest): cache-first
//  - API calls (/api/tuktuk-yetu/*): network-first, fallback to cache
//  - Next.js image optimization (_next/image): stale-while-revalidate

const VERSION = 'tuktuk-yetu-v1'
const APP_SHELL_CACHE = `${VERSION}-shell`
const ASSET_CACHE = `${VERSION}-assets`
const API_CACHE = `${VERSION}-api`
const IMAGE_CACHE = `${VERSION}-images`

const APP_SHELL = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/logo-192.png',
  '/logo-512.png',
  '/maskable-192.png',
  '/maskable-512.png',
  '/offline.html',
]

// Install: pre-cache the app shell so the app boots offline
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  )
})

// Activate: clean up old caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.startsWith(VERSION))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

// Helper: stale-while-revalidate
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const fetchPromise = fetch(request).then((response) => {
    if (response && response.status === 200 && response.type === 'basic') {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => cached)
  return cached || fetchPromise
}

// Helper: cache-first (for immutable assets)
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response && response.status === 200) {
    cache.put(request, response.clone())
  }
  return response
}

// Helper: network-first with cache fallback (for API calls)
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      cache.put(request, response.clone())
    }
    return response
  } catch (err) {
    const cached = await cache.match(request)
    if (cached) return cached
    throw err
  }
}

// Main fetch handler — routes requests to the right strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Skip cross-origin requests (e.g. fonts from Google, CDNs)
  if (url.origin !== self.location.origin) return

  // API calls — network-first so drivers always see fresh passenger data
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirst(request, API_CACHE).catch(() => {
        return new Response(
          JSON.stringify({ error: 'offline', message: 'You are offline. Showing last cached data.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      })
    )
    return
  }

  // Next.js optimized images
  if (url.pathname.startsWith('/_next/image')) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE))
    return
  }

  // Static assets in /public (logos, icons, screenshots, manifest)
  if (
    url.pathname.startsWith('/logo') ||
    url.pathname.startsWith('/maskable') ||
    url.pathname.startsWith('/screenshot') ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/robots.txt'
  ) {
    event.respondWith(cacheFirst(request, ASSET_CACHE))
    return
  }

  // Next.js static chunks (_next/static/*) — immutable, cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE))
    return
  }

  // Navigation requests (HTML pages) — stale-while-revalidate, fall back to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request)
          const cache = await caches.open(APP_SHELL_CACHE)
          cache.put(request, response.clone())
          return response
        } catch (err) {
          const cached = await caches.match(request)
          if (cached) return cached
          const offline = await caches.match('/offline.html')
          if (offline) return offline
          throw err
        }
      })()
    )
    return
  }

  // Default: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, ASSET_CACHE))
})

// Allow the page to trigger immediate activation
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})
