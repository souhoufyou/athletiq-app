const CACHE_NAME = "athletiq-v3";

// Minimal precache: just the app shell so the app opens offline.
const PRECACHE_URLS = ["/"];

// Installation: precache the app shell.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activation: drop every old cache so a new deploy never serves stale files.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - Static media (brand assets, fonts, images): cache first — they don't change.
// - Everything else (HTML, JS, CSS): network first, falling back to cache only
//   when offline. This guarantees a new deploy is always picked up online.
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept API calls or cross-origin requests.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  const isStaticMedia =
    url.pathname.startsWith("/brand/") ||
    request.destination === "font" ||
    request.destination === "image";

  if (isStaticMedia) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network first for app code and pages.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match("/"))
      )
  );
});
