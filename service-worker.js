// Framie SW
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Network-first: always try the newest files
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
