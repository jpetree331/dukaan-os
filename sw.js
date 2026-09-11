/* Dukaan OS — offline-first service worker.
   Cache-first for the shell so the counter opens with no network at all. */
const CACHE = 'dukaan-os-v4';
const SHELL = [
  './', './index.html', './manifest.json',
  './css/app.css',
  './js/core.js', './js/safety.js', './js/i18n.js', './js/qr.js', './js/ui.js', './js/auth.js', './js/voice.js',
  './js/pos.js', './js/inventory.js', './js/ledger.js', './js/insights.js',
  './js/settings.js', './js/app.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('dukaan-os-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(CACHE).then((cache) => cache.match(req)).then((hit) => {
      if (hit) {
        // Install a new version as a complete shell instead of mixing files.
        return hit;
      }
      return fetch(req)
        .then((res) => {
          return res;
        })
        .catch(() => req.mode === 'navigate' ? caches.open(CACHE).then((c) => c.match('./index.html')) : Response.error());
    })
  );
});
