// BOQ Quick Estimator — Service Worker v3
// Caches core app files for offline use

var CACHE_NAME = 'boq-estimator-v3';
var CORE_FILES = [
  '/boq-estimator/',
  '/boq-estimator/index.html',
  '/boq-estimator/boq-estimator.html',
  '/boq-estimator/cost-estimator.html',
  '/boq-estimator/access.html',
  '/boq-estimator/privacy.html',
  '/boq-estimator/manifest.json',
  '/boq-estimator/icons/icon-192.png',
  '/boq-estimator/icons/icon-512.png',
];

// Install — cache core files
self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.allSettled(
        CORE_FILES.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('SW: could not cache', url, err);
          });
        })
      );
    })
  );
});

// Activate — delete old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', function(event) {
  // Only handle GET requests for our own origin
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  // For font requests, go network-only (avoid caching Google Fonts issues)
  if (event.request.url.includes('fonts.googleapis.com') ||
      event.request.url.includes('fonts.gstatic.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // If we got a valid response, cache it
        if (response && response.status === 200 && response.type === 'basic') {
          var responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(function() {
        // Network failed — try cache
        return caches.match(event.request).then(function(cached) {
          if (cached) return cached;
          // If it's a navigation request, return the main app page
          if (event.request.mode === 'navigate') {
            return caches.match('/boq-estimator/index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});
