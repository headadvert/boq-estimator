// BOQ Quick Estimator — Service Worker
// Caches all app files for full offline use

const CACHE_NAME = 'boq-estimator-v1';

// All files to cache on install
const FILES_TO_CACHE = [
  '/boq-estimator/',
  '/boq-estimator/index.html',
  '/boq-estimator/boq-estimator.html',
  '/boq-estimator/access.html',
  '/boq-estimator/cost-estimator.html',
  '/boq-estimator/manifest.json',
  '/boq-estimator/icons/icon-192.png',
  '/boq-estimator/icons/icon-512.png'
];

// ── INSTALL — cache all files ──────────────────────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] Pre-caching app files');
      // Use addAll but don't fail if some optional files are missing
      return Promise.allSettled(
        FILES_TO_CACHE.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[SW] Failed to cache:', url, err);
          });
        })
      );
    }).then(function() {
      // Activate immediately — don't wait for old tabs to close
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE — clean up old caches ────────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(
        keyList.map(function(key) {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(function() {
      // Take control of all open pages immediately
      return self.clients.claim();
    })
  );
});

// ── FETCH — serve from cache, fall back to network ────────────────────────
self.addEventListener('fetch', function(event) {
  // Only handle same-origin GET requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Skip chrome-extension and non-http requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        // Serve from cache — works offline
        return cachedResponse;
      }

      // Not in cache — fetch from network and cache it
      return fetch(event.request).then(function(networkResponse) {
        // Only cache valid responses
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Clone because response can only be consumed once
        var responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(function() {
        // Network failed and not in cache — show offline fallback for HTML pages
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/boq-estimator/boq-estimator.html');
        }
      });
    })
  );
});
