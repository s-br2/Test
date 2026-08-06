// Bei jedem Update der App diese Versionsnummer hochzählen (v1 -> v2 -> ...),
// damit Geräte zuverlässig merken, dass eine neue Version verfügbar ist.
const CACHE_VERSION = "kochbuch-v5";
const APP_SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});

// Erlaubt der Seite, die neue Version sofort zu aktivieren, sobald der
// Nutzer im Update-Hinweis auf "Jetzt aktualisieren" klickt.
self.addEventListener("message", event => {
  if (event.data === "skipWaiting") self.skipWaiting();
});
