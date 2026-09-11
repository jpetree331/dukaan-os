/* Dukaan OS — offline-first service worker.
   Cache-first for the shell so the counter opens with no network at all. */
const CACHE = 'dukaan-os-v3';
const SHELL = [
  './', './index.html', './manifest.json',
  './css/app.css',
  './js/core.js', './js/i18n.js', './js/qr.js', './js/ui.js', './js/auth.js', './js/voice.js',
  './js/pos.js', './js/inventory.js', './js/ledger.js', './js/insights.js',
  './js/settings.js', './js/app.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) {
        // refresh in the background so updates land on the next open
        fetch(req).then((res) => {
          if (res && res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
        }).catch(() => { });
        return hit;
      }
      return fetch(req)
        .then((res) => {
          if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
