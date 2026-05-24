/* Margherita Pizzeria — minimal service worker for PWA install eligibility
 * Strategy:
 *  - App shell: precache root + offline fallback page
 *  - Navigations: network-first with offline fallback
 *  - Static assets (/_next/static, images, icons): cache-first with background revalidate
 *  - Everything else: pass-through (network-only)
 * Keep it tiny and dependency-free.
 */
const VERSION = "v1.0.0";
const APP_CACHE = `margherita-app-${VERSION}`;
const RUNTIME_CACHE = `margherita-runtime-${VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = ["/", OFFLINE_URL, "/logo.png", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_CACHE);
      // Fail-soft: don't block install if a single asset is missing.
      await Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(u)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== APP_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/legacy/") ||
    url.pathname.startsWith("/uploads/") ||
    /\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|webp|gif|svg|ico)$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API or auth endpoints.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network-first, offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(APP_CACHE);
          const cached = (await cache.match(req)) || (await cache.match(OFFLINE_URL)) || (await cache.match("/"));
          return cached || new Response("Offline", { status: 503, statusText: "Offline" });
        }
      })(),
    );
    return;
  }

  // Static assets: cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(req);
        if (cached) {
          // Revalidate in background.
          fetch(req)
            .then((resp) => {
              if (resp && resp.ok) cache.put(req, resp.clone());
            })
            .catch(() => {});
          return cached;
        }
        try {
          const resp = await fetch(req);
          if (resp && resp.ok) cache.put(req, resp.clone());
          return resp;
        } catch {
          return new Response("", { status: 504 });
        }
      })(),
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
