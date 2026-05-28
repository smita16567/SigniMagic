const CACHE_NAME = 'signimagic-v3';
const urlsToCache = [
  '/background.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/images/logo.jpeg',
  '/style.css',
  '/script.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  if (
    event.request.method !== 'GET' ||
    requestUrl.origin !== self.location.origin ||
    requestUrl.pathname.startsWith('/signtotext/dist/') ||
    requestUrl.pathname === '/sw.js'
  ) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  if (
    event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    requestUrl.pathname.endsWith('.html')
  ) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});
