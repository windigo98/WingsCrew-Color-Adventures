const CACHE = "wcca-v5";

const SHELL = [
  "./",
  "./index.html",
  "./css/app.css",
  "./manifest.webmanifest",
  "./sw.js",
  "./js/main.js",
  "./js/state.js",
  "./js/db.js",
  "./js/unlock.js",
  "./js/play.js",
  "./js/renderer.js",
  "./js/shop.js",
  "./js/photo.js",
  "./js/photo-worker.js",
  "./js/gate.js",
  "./js/backup.js",
  "./js/vectorize.js",
  "./js/geom.js",
  "./js/aids.js",
  "./icons/logo.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable.png",
  "./icons/apple-touch-icon.png",
  "./favicon.ico",
  "./config/payments.json",
  "./config/pack-keys.json",
  "./data/unlock-hashes.json",
  "./packs/catalog.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fromCacheThenNetwork(request));
});

async function fromCacheThenNetwork(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  if (cached) return cached;
  const fresh = await network;
  if (fresh) return fresh;
  if (request.mode === "navigate") {
    const home = await cache.match("./index.html");
    if (home) return home;
  }
  return new Response("Offline", { status: 503, statusText: "Offline" });
}
