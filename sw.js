const CACHE_NAME = 'yatra-guide-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './expense.html',
  './manifest.json',
  './yatra-logo.png',
  './logo.png',
  './logo 1.png',
  './20250208_142334.jpg',
  './Adi Shankaracharya Samadhi.webp',
  './Badrinath.jpg',
  './Bhairavnath Temple.webp',
  './Bheem Pul.jpg',
  './Brahma Kapal.jpg',
  './Charan Paduka.jpeg',
  './Ganesh Gufa.jpg',
  './Joshimath.jpg',
  './Jyotir Math.jpg',
  './Kedarnath.jpg',
  './Mana Village.webp',
  './Narsingh Temple.png',
  './Ram Jhula.avif',
  './Rishikesh.jpeg',
  './Saraswati River.jpg',
  './Tapt Kund.jpg',
  './Triyuginarayan.jpg',
  './Vasudhara Falls.webp',
  './Vasuki Tal.avif',
  './Vyas Gufa.jpg',
  './haridwar.jpg',
  './triveni ghat.jpeg',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching core assets...');
        // Using return cache.addAll with map catch to ensure a single missing asset doesn't fail installation
        return Promise.all(
          ASSETS_TO_CACHE.map(url => {
            return cache.add(url).catch(err => {
              console.warn(`[Service Worker] Failed to pre-cache asset: ${url}`, err);
            });
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Stale-While-Revalidate Strategy)
self.addEventListener('fetch', event => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  // Bypass service worker for Google Gemini API calls
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Return cached response instantly, then fetch update in background
        fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Silence network errors since we are serving cached copy
          });
        return cachedResponse;
      }

      // Fetch from network directly if not in cache
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
