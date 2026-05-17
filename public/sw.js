const CACHE_NAME = "athletiq-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/brand/athletiq-icon.svg",
  "/brand/athletiq-icon.png"
];

// Installation: cache l'app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation: nettoie les anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: stratégie Network First avec fallback au cache
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip les requêtes non-GET
  if (request.method !== "GET") {
    return;
  }

  // Pour les assets statiques et l'app shell: Cache First
  if (
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "style" ||
    request.destination === "script" ||
    request.url.includes("/brand/") ||
    request.url.endsWith("/") ||
    request.url.endsWith(".html")
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }

        return fetch(request).then((response) => {
          // Ne cache que les réponses valides
          if (!response || response.status !== 200) {
            return response;
          }

          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });

          return response;
        });
      })
    );
    return;
  }

  // Pour les autres requêtes: Network First avec fallback au cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Ne cache que les réponses valides
        if (!response || response.status !== 200) {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      })
      .catch(() => {
        // En cas d'erreur réseau, retourner le cache
        return caches.match(request).then((response) => {
          if (response) {
            return response;
          }

          // Si aucun cache n'existe, retourner une page offline
          return caches.match("/");
        });
      })
  );
});
