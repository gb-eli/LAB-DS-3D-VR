const CACHE_VERSION = "holomotion-v4.3.0";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/styles.css",
  "./assets/icons/icon.svg",
  "./src/main.js",
  "./src/config.js",
  "./src/versioning.js",
  "./src/app-catalog.js",
  "./src/explorer-catalog.js",
  "./src/store-ui.js",
  "./src/storage.js",
  "./src/audio.js",
  "./src/vision.js",
  "./src/vision.worker.js",
  "./src/gesture-engine.js",
  "./src/interaction-router.js",
  "./src/vision-renderer.js",
  "./src/three-scene.js",
  "./src/draw-engine.js",
  "./src/shape-game.js",
  "./src/pose-game.js",
  "./src/gesture-game.js",
  "./src/face-engine.js",
  "./src/body-actions.js",
  "./src/academy-game.js",
  "./src/sequence-game.js",
  "./src/aura-game.js",
  "./src/body-challenge-game.js",
  "./src/dance-game.js",
  "./src/stretch-game.js",
  "./src/saber-game.js",
  "./src/libras-game.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || caches.match("./index.html");
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
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
    event.respondWith(networkFirst(event.request));
    return;
  }
  if (url.hostname.includes("jsdelivr.net") || url.hostname.includes("googleapis.com") || url.hostname.includes("gstatic.com")) {
    event.respondWith(cacheFirst(event.request));
  }
});
