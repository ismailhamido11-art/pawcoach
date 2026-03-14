// PawCoach Service Worker
// Cache-first for static assets, Network-first for API calls

const CACHE_VERSION = 'pawcoach-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_DOMAINS = [
  'base44.com',
  'base44.app',
  'api.base44.com'
];

// Static asset extensions to cache
const STATIC_EXTENSIONS = [
  '.js', '.css', '.woff', '.woff2', '.ttf', '.otf',
  '.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp', '.ico'
];

// ----------------------------------------------------------------
// INSTALL — precache shell only (no app shell defined here,
// Vite handles hashed assets; we just activate immediately)
// ----------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(['/']);
    }).then(() => self.skipWaiting())
  );
});

// ----------------------------------------------------------------
// ACTIVATE — clean up old cache versions
// ----------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('pawcoach-') && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ----------------------------------------------------------------
// FETCH — routing logic
// ----------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept non-GET requests
  if (request.method !== 'GET') return;

  // Never intercept auth or API calls (Base44 backend)
  const isApiCall = API_DOMAINS.some((domain) => url.hostname.includes(domain))
    && (url.pathname.startsWith('/api/') || url.pathname.startsWith('/functions/'));

  if (isApiCall) return;

  // Never intercept Base44 auth flows
  if (url.pathname.startsWith('/auth') || url.pathname.includes('oauth')) return;

  // Static assets → Cache-first
  const isStaticAsset = STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext))
    || url.pathname.startsWith('/assets/');

  if (isStaticAsset) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation requests (HTML) → Network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Everything else → Network-first (no cache)
  event.respondWith(networkFirst(request));
});

// ----------------------------------------------------------------
// Strategies
// ----------------------------------------------------------------

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Asset not available offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Not available offline', { status: 503 });
  }
}

async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    // Try cached version of this URL
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fall back to cached root (the SPA shell)
    const rootCached = await caches.match('/');
    if (rootCached) return rootCached;

    // Last resort: simple offline page
    return new Response(
      `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PawCoach — Hors ligne</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #F5F0E8; color: #1A4D3E;
           display: flex; flex-direction: column; align-items: center;
           justify-content: center; min-height: 100vh; margin: 0; text-align: center; padding: 24px; }
    h1 { font-size: 1.5rem; margin-bottom: 8px; }
    p  { opacity: 0.7; font-size: 0.95rem; }
    button { margin-top: 24px; padding: 12px 28px; background: #1A4D3E; color: #fff;
             border: none; border-radius: 12px; font-size: 1rem; cursor: pointer; }
  </style>
</head>
<body>
  <h1>Pas de connexion</h1>
  <p>PawCoach a besoin d'internet pour fonctionner.<br>Reconnecte-toi et réessaie.</p>
  <button onclick="location.reload()">Réessayer</button>
</body>
</html>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
