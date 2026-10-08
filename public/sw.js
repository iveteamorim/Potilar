const CACHE_NAME = 'potilar-pwa-static-v2';
const RUNTIME_CACHE_NAME = 'potilar-pwa-runtime-v2';
const PRECACHE_URLS = ['/', '/manifest.webmanifest', '/favicon-192.png', '/favicon-512.png'];
const NAVIGATION_FALLBACK_PATHS = new Set(['/']);
const NAVIGATION_TIMEOUT_MS = 2500;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    /\.(?:css|js|mjs|png|jpg|jpeg|webp|svg|ico|woff|woff2)$/i.test(url.pathname)
  );
}

async function cacheFirst(request, event) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const cached = (await cache.match(request)) || (await caches.match(request));

  if (cached) {
    const updatePromise = fetch(request)
      .then((response) => {
        if (response.ok) {
          return cache.put(request, response.clone());
        }
        return undefined;
      })
      .catch(() => undefined);
    event.waitUntil(updatePromise);
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstNavigation(request, event) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const cached = (await cache.match(request)) || (await caches.match(request)) || (await caches.match('/'));
  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  event.waitUntil(networkPromise.then(() => undefined));
  const timedResponse = await Promise.race([networkPromise, wait(NAVIGATION_TIMEOUT_MS).then(() => null)]);

  if (timedResponse) {
    return timedResponse;
  }

  return cached || networkPromise.then((response) => response || Response.error());
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== RUNTIME_CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === 'navigate' && NAVIGATION_FALLBACK_PATHS.has(url.pathname)) {
    event.respondWith(networkFirstNavigation(event.request, event));
    return;
  }

  if (isStaticAsset(url) || PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(cacheFirst(event.request, event));
  }
});
