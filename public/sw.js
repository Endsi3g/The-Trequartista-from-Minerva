const CACHE_VERSION = 'v1.8.0-' + Date.now();
const CACHE_NAME = 'minerva-trequartista-' + CACHE_VERSION;
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-512.png',
  '/icon-192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache.startsWith('minerva-') && cache !== CACHE_NAME) {
            console.log('[SW] Purging old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network-first for pages and assets, falling back to cache when offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Skip API routes and Supabase websocket from caching
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/realtime/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return caches.match('/');
        });
      })
  );
});
