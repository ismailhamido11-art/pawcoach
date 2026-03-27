const CACHE_NAME = 'pawcoach-v1';

// Static assets to pre-cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

// Install: pre-cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Ne pas appeler self.skipWaiting() ici — l'update est declenchee par consentement utilisateur via postMessage
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Claim all open clients immediately
  self.clients.claim();
});

// Message listener — permet a main.jsx de declencher le skipWaiting via postMessage
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch: cache-first for static assets, network passthrough for API/dynamic
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (API calls, CDN, etc.)
  if (url.origin !== self.location.origin) return;

  // Skip Base44 API and backend function calls
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/functions/')) return;

  // Cache-first strategy for static assets (JS, CSS, images, fonts)
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/mascot/') ||
    /\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$/.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          // Only cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first (passthrough) for HTML navigation and everything else
  event.respondWith(
    fetch(request).catch(() => {
      // Offline fallback: serve cached root if navigation fails
      if (request.mode === 'navigate') {
        return caches.match('/');
      }
      return new Response('Offline', { status: 503 });
    })
  );
});
