/**
 * EVER GAIN — Indoor Football Booking Platform
 * Progressive Web App (PWA) Service Worker
 *
 * Cache strategy:
 * - Static assets (CSS, JS, Fonts, Images): Cache-first with background revalidation
 * - Firebase & Realtime APIs: Network-first, never persist sensitive tokens/data
 * - Admin Panel (admin.html): Never cached for security
 * - Offline handling: Graceful offline fallback page and assets
 */

const CACHE_NAME = 'evergain-v1';

// Static resources to pre-cache on service worker installation
const STATIC_PRECACHE_URLS = [
  './',
  './index.html',
  './booking.html',
  './gallery.html',
  './rules.html',
  './contact.html',
  './style.css',
  './firebase-config.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Bengali:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

// Offline fallback image (emerald turf SVG icon)
const OFFLINE_IMAGE_SVG = 
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">' +
  '<rect width="100" height="100" fill="#111a11" rx="12"/>' +
  '<circle cx="50" cy="50" r="28" fill="none" stroke="#10b981" stroke-width="3" stroke-dasharray="4 2"/>' +
  '<path d="M50 22 L50 78 M22 50 L78 50" stroke="#10b981" stroke-width="2" opacity="0.6"/>' +
  '</svg>';

// Offline fallback HTML response
const OFFLINE_HTML_PAGE = 
  '<!DOCTYPE html>' +
  '<html lang="bn" dir="ltr">' +
  '<head>' +
  '<meta charset="UTF-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
  '<title>অফলাইন | EVER GAIN</title>' +
  '<style>' +
    'body {' +
      'margin: 0; padding: 1.5rem; min-height: 100vh; display: flex; align-items: center; justify-content: center;' +
      'background-color: #0a0f0a; color: #f0fdf4;' +
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Bengali", sans-serif;' +
    '}' +
    '.offline-card {' +
      'max-width: 440px; width: 100%; text-align: center; padding: 2.5rem 1.75rem;' +
      'background: rgba(20, 35, 20, 0.85); border: 1px solid rgba(16, 185, 129, 0.25);' +
      'border-radius: 1rem; box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);' +
    '}' +
    '.offline-icon {' +
      'font-size: 3rem; color: #10b981; margin-bottom: 1rem;' +
    '}' +
    '.offline-title {' +
      'font-size: 1.4rem; font-weight: 700; margin: 0 0 0.75rem 0; color: #f0fdf4;' +
    '}' +
    '.offline-text {' +
      'font-size: 0.95rem; line-height: 1.6; color: #a7c4a7; margin: 0 0 1.75rem 0;' +
    '}' +
    '.offline-btn {' +
      'display: inline-block; padding: 0.8rem 1.8rem;' +
      'background: #10b981; color: #0a0f0a; font-weight: 700; text-decoration: none;' +
      'border-radius: 0.5rem; border: none; cursor: pointer; transition: background 0.2s;' +
    '}' +
    '.offline-btn:hover { background: #34d399; }' +
  '</style>' +
  '</head>' +
  '<body>' +
  '<div class="offline-card">' +
    '<div class="offline-icon">&#x26BD;</div>' +
    '<h1 class="offline-title">ইন্টারনেট সংযোগ নেই</h1>' +
    '<p class="offline-text">আপনি বর্তমানে অফলাইনে আছেন। স্লট বুকিং ও আপডেট তথ্যের জন্য ইন্টারনেট সংযোগ চালু করে পুনরায় চেষ্টা করুন।</p>' +
    '<button class="offline-btn" onclick="window.location.reload()">পুনরায় চেষ্টা করুন</button>' +
  '</div>' +
  '</body>' +
  '</html>';

// ============================================================================
// 1. Install Event: Cache Core Static Shell
// ============================================================================
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // Use individual caching with Promise.allSettled to guarantee installation
      // even if one external font or CDN file experiences network issues
      const cachePromises = STATIC_PRECACHE_URLS.map(function (url) {
        return fetch(new Request(url, { mode: 'cors', credentials: 'omit' }))
          .then(function (response) {
            if (response.ok) {
              return cache.put(url, response);
            }
            return Promise.resolve();
          })
          .catch(function (err) {
            console.warn('[EVER GAIN SW] Failed pre-caching asset:', url, err);
            return Promise.resolve();
          });
      });

      return Promise.all(cachePromises);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

// ============================================================================
// 2. Activate Event: Clean Out Old Caches & Take Immediate Control
// ============================================================================
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(
        keyList.map(function (key) {
          if (key !== CACHE_NAME) {
            console.log('[EVER GAIN SW] Removing obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// ============================================================================
// 3. Fetch Event: Intelligent Strategy Routing
// ============================================================================
self.addEventListener('fetch', function (event) {
  const request = event.request;

  // Only handle HTTP/HTTPS GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // --------------------------------------------------------------------------
  // Rule A: Security Exclusion — NEVER Cache Admin Panel
  // --------------------------------------------------------------------------
  if (url.pathname.includes('admin.html') || url.pathname.startsWith('/admin')) {
    event.respondWith(
      fetch(request).catch(function () {
        // If admin is offline, return offline notification
        return new Response(OFFLINE_HTML_PAGE, {
          status: 503,
          statusText: 'Service Unavailable (Offline)',
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      })
    );
    return;
  }

  // --------------------------------------------------------------------------
  // Rule B: Network-First for Firebase, Database & Realtime APIs
  // --------------------------------------------------------------------------
  const isFirebaseOrApi = 
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firebasedatabase.app') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.pathname.endsWith('.json');

  if (isFirebaseOrApi) {
    event.respondWith(
      fetch(request).catch(function () {
        // Return a structured offline error response for API callers
        return new Response(
          JSON.stringify({
            error: 'network_offline',
            message: 'ইন্টারনেট সংযোগ পাওয়া যায়নি। অফলাইন মোডে বুকিং আপডেট সম্ভব নয়।'
          }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
          }
        );
      })
    );
    return;
  }

  // --------------------------------------------------------------------------
  // Rule C: HTML Navigation Requests (Customer Pages)
  // Cache-first with network fallback & friendly offline page
  // --------------------------------------------------------------------------
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then(function (cachedResponse) {
        if (cachedResponse) {
          // Serve cached version immediately and refresh in background
          fetch(request).then(function (networkResponse) {
            if (networkResponse && networkResponse.ok) {
              caches.open(CACHE_NAME).then(function (cache) {
                cache.put(request, networkResponse);
              });
            }
          }).catch(function () {
            // Network silent fail, client uses cached page
          });
          return cachedResponse;
        }

        // Not in cache, try network
        return fetch(request).then(function (networkResponse) {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(request, copy);
            });
          }
          return networkResponse;
        }).catch(function () {
          // Both cache and network failed -> return offline HTML page
          return new Response(OFFLINE_HTML_PAGE, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        });
      })
    );
    return;
  }

  // --------------------------------------------------------------------------
  // Rule D: Static Assets (CSS, JS, Fonts, Images)
  // Cache-first strategy with dynamic caching
  // --------------------------------------------------------------------------
  event.respondWith(
    caches.match(request).then(function (cachedResponse) {
      if (cachedResponse) {
        // Revalidate in background
        fetch(request).then(function (networkResponse) {
          if (networkResponse && networkResponse.ok) {
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(request, networkResponse);
            });
          }
        }).catch(function () {
          // Silent offline revalidation error
        });

        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(request).then(function (networkResponse) {
        // Cache valid successful responses
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(function (error) {
        // Provide graceful fallbacks for media
        if (request.destination === 'image') {
          return new Response(OFFLINE_IMAGE_SVG, {
            headers: { 'Content-Type': 'image/svg+xml' }
          });
        }
        throw error;
      });
    })
  );
});
