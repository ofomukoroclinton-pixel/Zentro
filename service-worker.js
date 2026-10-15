const CACHE_NAME = "zentro-shell-v1";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./zentro-icon-192.svg", "./zentro-icon-512.svg"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);
  // Cache only same-origin app shell requests. Supabase/API calls must always go to the network.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.includes("/rest/") || url.pathname.includes("/auth/") || url.pathname.includes("/storage/")) return;
  event.respondWith(
    fetch(req).then(response => {
      if (response && response.ok && (url.pathname.endsWith("/") || url.pathname.endsWith(".html") || url.pathname.endsWith(".webmanifest") || url.pathname.endsWith(".svg"))) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      }
      return response;
    }).catch(() => caches.match(req).then(cached => cached || caches.match("./index.html")))
  );
});
