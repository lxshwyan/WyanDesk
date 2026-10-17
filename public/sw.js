const CACHE_PREFIX = 'wyandesk-shell-';
const CACHE_NAME = `${CACHE_PREFIX}v10`;
const BUILD_ASSETS = /* __WYANDESK_BUILD_ASSETS__ */ [];
const SHELL = [...new Set(['/', '/index.html', '/favicon.svg', '/pwa-192.png', '/pwa-512.png', '/manifest.webmanifest', ...BUILD_ASSETS])];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function cacheResponse(request, response) {
  if (!response || !response.ok || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) return response;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    return await cacheResponse(request, await fetch(request));
  } catch {
    const cached = await caches.match(request, { ignoreVary: true });
    if (cached) return cached;
    if (request.mode === 'navigate') return (await caches.match('/index.html')) || Response.error();
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreVary: true });
  if (cached) return cached;
  try {
    return await cacheResponse(request, await fetch(request));
  } catch {
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(url.pathname.startsWith('/assets/') ? cacheFirst(event.request) : networkFirst(event.request));
});
