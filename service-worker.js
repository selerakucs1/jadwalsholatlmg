const CACHE_VERSION = "v1";
const STATIC_CACHE = "static-" + CACHE_VERSION;
const DYNAMIC_CACHE = "dynamic-" + CACHE_VERSION;
// PRE CACHE FILE
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/manifest.json",
  "/favicon.ico",
  "/waktu_192.png",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css"
];

// INSTALL
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// FETCH
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const requestURL = new URL(event.request.url);
  // API JADWAL SHOLAT
  if (requestURL.hostname.includes("api.myquran.com")) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // STATIC CACHE FIRST
  event.respondWith(
    caches.match(event.request)
      .then(cacheRes => {
        if (cacheRes) {
          return cacheRes;
        }
        return fetch(event.request)
          .then(networkRes => {
            return caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(event.request, networkRes.clone());
                return networkRes;
              });
          })
          .catch(() => {
            if (event.request.destination === "document") {
              return caches.match("/index.html");
            }
          });
      })
  );
});
