const CACHE_VERSION = "holomotion-v4.4.0";
const CORE_CACHE = `${CACHE_VERSION}-core`;
const MODULE_CACHE = `${CACHE_VERSION}-modules`;
const EXTERNAL_CACHE = `${CACHE_VERSION}-external`;

// Somente o portal leve é armazenado na instalação.
const CORE_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/styles.css",
  "./assets/icons/icon.svg",
  "./src/bootstrap.js",
  "./src/store-ui.js",
  "./src/app-catalog.js",
  "./src/versioning.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CORE_CACHE).then((cache) => cache.addAll(CORE_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (request.mode === "navigate" ? caches.match("./index.html") : Response.error());
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.headers.has("range")) return;
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin) {
    const isCore = CORE_SHELL.some((entry) => url.pathname.endsWith(entry.replace("./", ""))) || event.request.mode === "navigate";
    event.respondWith(networkFirst(event.request, isCore ? CORE_CACHE : MODULE_CACHE));
    return;
  }
  if (url.hostname.includes("jsdelivr.net") || url.hostname.includes("googleapis.com") || url.hostname.includes("gstatic.com")) {
    event.respondWith(cacheFirst(event.request, EXTERNAL_CACHE));
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_MODULE_CACHE") {
    event.waitUntil(caches.delete(MODULE_CACHE).then(() => event.source?.postMessage?.({ type: "MODULE_CACHE_CLEARED" })));
  }
});
