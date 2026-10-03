const cacheName = "flag-football-play-studio-v26";
const appShell = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./app-icon.svg",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  // Activate a freshly deployed worker right away instead of waiting for every
  // tab/PWA instance to close, so a version bump reaches the app on one reload.
  self.skipWaiting();
  event.waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll(appShell)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== cacheName)
            .map((key) => caches.delete(key)),
        ),
      )
      // Take control of open clients so the new cache serves the next navigation.
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  );
});
