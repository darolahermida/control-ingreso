// Service Worker - Control de Rollos PWA
const CACHE_NAME = 'control-rollos-v1';
const URLS_TO_CACHE = [
  '.',
  'control-rollos-2.html',
  'manifest.json',
  'logo-192.png',
  'logo-512.png',
  'apple-touch-icon.png',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@300;400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js'
];

// Instalar Service Worker y cachear archivos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE).catch(() => {
        // Si falla el caché, continuar de todas formas
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activar y limpiar cachés antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia: Cache first, fallback a network
self.addEventListener('fetch', event => {
  // Solo cachear GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // Si está en caché, devolverlo
      if (response) {
        return response;
      }

      // Si no está en caché, ir a la red
      return fetch(event.request).then(response => {
        // Si es una respuesta válida, cachearlo
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clonar la respuesta
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Si falla la red, devolver del caché (si existe)
        return caches.match(event.request);
      });
    })
  );
});

// Mensaje para actualizar caché
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
